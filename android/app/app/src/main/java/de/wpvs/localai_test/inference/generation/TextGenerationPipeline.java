package de.wpvs.localai_test.inference.generation;

import ai.onnxruntime.genai.Config;
import ai.onnxruntime.genai.GenAIException;
import ai.onnxruntime.genai.Generator;
import ai.onnxruntime.genai.GeneratorParams;
import ai.onnxruntime.genai.Model;
import ai.onnxruntime.genai.Sequences;
import ai.onnxruntime.genai.Tokenizer;
import ai.onnxruntime.genai.TokenizerStream;
import java.io.File;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.function.BooleanSupplier;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import de.wpvs.localai_test.inference.InferenceDevice;
import de.wpvs.localai_test.inference.ModelFiles;

/**
 * Text generation with decoder-only models (CausalLM) through ONNX Runtime GenAI. It behaves
 * like {@code pipeline("text-generation", ...)} in Transformers.js: chat models receive a
 * system message and the question in the model's chat template and return only the answer;
 * other models complete the input text and return the entire text.
 */
public final class TextGenerationPipeline implements AutoCloseable {
    /**
     * Receives tokens generated during text generation.
     */
    public interface TokenListener {
        /**
         * @param tokenId Generated token
         * @param text    Decoded text of the token (may be empty)
         */
        void onToken(int tokenId, String text);
    }

    /**
     * Settings from the model catalog ({@code app/static/models/index.json}).
     */
    public static final class ModelSettings {
        boolean instructionTuned;
        String systemPrompt;
        String questionPrefix;
        String contextPrefix;
        JSONObject tokenizerArgs;

        /**
         * Read settings from the catalog entry.
         *
         * @param modelConfig Catalog entry or {@code null}
         * @return Settings
         */
        public static ModelSettings fromJson(JSONObject modelConfig) {
            ModelSettings settings = new ModelSettings();
            if (modelConfig == null) return settings;

            settings.instructionTuned = modelConfig.optBoolean("instructionTuned", false);
            settings.systemPrompt     = optString(modelConfig, "systemPrompt");
            settings.tokenizerArgs    = modelConfig.optJSONObject("tokenizerArgs");

            JSONObject prefix = modelConfig.optJSONObject("prefix");

            if (prefix != null) {
                settings.questionPrefix = optString(prefix, "question");
                settings.contextPrefix  = optString(prefix, "context");
            }

            return settings;
        }

        private static String optString(JSONObject object, String key) {
            if (!object.has(key) || object.isNull(key)) return null;
            String value = object.optString(key, "");
            return value.isEmpty() ? null : value;
        }
    }

    /**
     * Parameters for a generation call. Unset values are {@code null}.
     */
    public static final class Request {
        public String question = "";
        public String context;
        public Integer maxNewTokens;
        public Integer maxLength;
        public Boolean doSample;
        public Double temperature;
        public Double repetitionPenalty;
    }

    private static final String DEFAULT_SYSTEM_PROMPT = "Du bist ein hilfreicher Assistent.";

    private final Config config;
    private final Model model;
    private final Tokenizer tokenizer;
    private final ModelSettings settings;
    private final JSONObject generationConfig;
    private final int contextLength;
    private final boolean addSpecialTokens;

    /**
     * Load the model. The required {@code genai_config.json} is generated from
     * the model's configuration files.
     *
     * @param modelDir Directory containing the model files
     * @param onnxFile Relative path to the ONNX file, e.g. {@code onnx/model_q4.onnx}
     * @param device   Execution provider to use
     * @param settings Settings from the model catalog
     * @throws Exception if the model cannot be loaded
     */
    public TextGenerationPipeline(File modelDir, String onnxFile, InferenceDevice device, ModelSettings settings) throws Exception {
        this.settings = settings;

        JSONObject modelConfig     = ModelFiles.readJson(new File(modelDir, "config.json"));
        JSONObject tokenizerConfig = ModelFiles.readJson(new File(modelDir, "tokenizer_config.json"));
        generationConfig = ModelFiles.readJson(new File(modelDir, "generation_config.json"));
        contextLength    = GenAIConfigBuilder.contextLength(modelConfig);

        // As in Transformers.js, the tokenizer adds special tokens for plain text completion
        // only when required by the tokenizer configuration.
        addSpecialTokens = tokenizerConfig.optBoolean("add_bos_token", false)
                        || tokenizerConfig.optBoolean("add_eos_token", false);

        JSONObject genaiConfig = GenAIConfigBuilder.build(modelConfig, generationConfig, onnxFile);
        ModelFiles.writeText(new File(modelDir, "genai_config.json"), genaiConfig.toString(2));

        Config createdConfig = new Config(modelDir.getAbsolutePath());
        Model createdModel = null;

        try {
            createdConfig.clearProviders();
            if (device == InferenceDevice.XNNPACK) createdConfig.appendProvider("XNNPACK");

            createdModel = new Model(createdConfig);
            tokenizer    = new Tokenizer(createdModel);
            config       = createdConfig;
            model        = createdModel;
        } catch (Exception e) {
            if (createdModel != null) createdModel.close();
            createdConfig.close();
            throw e;
        }
    }

    /**
     * Generate text.
     *
     * @param request  Call parameters
     * @param listener Receives individual tokens
     * @param stopped  Returns {@code true} if generation should be stopped
     * @return Model response (chat models) or completed text (other models)
     * @throws Exception if an error occurs during generation
     */
    public String generate(Request request, TokenListener listener, BooleanSupplier stopped) throws Exception {
        String question = request.question == null ? "" : request.question;
        String context  = request.context;

        if (settings.questionPrefix != null) question = settings.questionPrefix + " " + question;
        if (settings.contextPrefix != null && context != null && !context.isEmpty()) context = settings.contextPrefix + " " + context;

        int[] promptIds = encodePrompt(question, context);

        GenerationOptions options = GenerationOptions.resolve(
            generationConfig, promptIds.length, contextLength,
            request.maxNewTokens, request.maxLength, request.doSample,
            request.temperature, request.repetitionPenalty
        );

        try (GeneratorParams params = new GeneratorParams(model)) {
            params.setSearchOption("max_length", options.maxLength);
            params.setSearchOption("do_sample", options.doSample);
            params.setSearchOption("temperature", options.temperature);
            params.setSearchOption("top_k", options.topK);
            params.setSearchOption("top_p", options.topP);
            params.setSearchOption("repetition_penalty", options.repetitionPenalty);
            params.setSearchOption("past_present_share_buffer", false);

            try (Generator generator = new Generator(model, params);
                 TokenizerStream stream = tokenizer.createStream()) {

                generator.appendTokens(promptIds);

                long tokenCount = generator.tokenCount();

                while (!generator.isDone() && !stopped.getAsBoolean()) {
                    generator.generateNextToken();

                    // The end token terminates the sequence without extending it.
                    long newTokenCount = generator.tokenCount();
                    if (newTokenCount == tokenCount) continue;
                    tokenCount = newTokenCount;

                    int token = generator.getLastTokenInSequence(0);
                    listener.onToken(token, stream.decode(token));
                }

                int[] sequence = generator.getSequence(0);

                if (settings.instructionTuned) {
                    return tokenizer.decode(Arrays.copyOfRange(sequence, promptIds.length, sequence.length));
                } else {
                    return tokenizer.decode(sequence);
                }
            }
        }
    }

    /**
     * Build and tokenize the prompt.
     */
    private int[] encodePrompt(String question, String context) throws GenAIException, JSONException {
        String prompt;
        boolean specialTokens;

        if (settings.instructionTuned) {
            String system = settings.systemPrompt != null ? settings.systemPrompt : DEFAULT_SYSTEM_PROMPT;
            if (context != null && !context.isEmpty()) system += "\n\n" + context;

            JSONArray messages = new JSONArray()
                .put(new JSONObject().put("role", "system").put("content", system))
                .put(new JSONObject().put("role", "user").put("content", question));

            if (settings.tokenizerArgs != null) {
                Map<String, String> templateOptions = new HashMap<>();
                templateOptions.put("chat_template_kwargs", settings.tokenizerArgs.toString());
                tokenizer.updateOptions(templateOptions);
            }

            // The chat template already contains all special tokens. Use the tokenizer's
            // template for an empty string (null causes a crash in GenAI's JNI layer).
            prompt        = tokenizer.applyChatTemplate("", messages.toString(), null, true);
            specialTokens = false;
        } else {
            prompt        = context != null && !context.isEmpty() ? context + "\n\n" + question : question;
            specialTokens = addSpecialTokens;
        }

        Map<String, String> encodeOptions = new HashMap<>();
        encodeOptions.put("add_special_tokens", specialTokens ? "true" : "false");
        tokenizer.updateOptions(encodeOptions);

        try (Sequences sequences = tokenizer.encode(prompt)) {
            return sequences.getSequence(0);
        }
    }

    @Override
    public void close() {
        tokenizer.close();
        model.close();
        config.close();
    }
}

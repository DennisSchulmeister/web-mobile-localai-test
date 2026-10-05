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
 * Textgenerierung mit Decoder-Only-Modellen (CausalLM) über ONNX Runtime GenAI. Das Verhalten
 * entspricht {@code pipeline("text-generation", ...)} von Transformers.js: Chat-Modelle erhalten
 * eine Systemnachricht und die Frage im Chat-Template des Modells und liefern nur die Antwort,
 * andere Modelle vervollständigen den Eingabetext und liefern den gesamten Text.
 */
public final class TextGenerationPipeline implements AutoCloseable {
    /**
     * Empfänger der während der Generierung erzeugten Tokens.
     */
    public interface TokenListener {
        /**
         * @param tokenId Erzeugtes Token
         * @param text    Dekodierter Text des Tokens (ggf. leer)
         */
        void onToken(int tokenId, String text);
    }

    /**
     * Einstellungen aus dem Modellkatalog ({@code static/models/index.json}).
     */
    public static final class ModelSettings {
        boolean instructionTuned;
        String systemPrompt;
        String questionPrefix;
        String contextPrefix;
        JSONObject tokenizerArgs;

        /**
         * Einstellungen aus dem Katalogeintrag lesen.
         *
         * @param modelConfig Katalogeintrag oder {@code null}
         * @return Einstellungen
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
     * Parameter eines Generierungsaufrufs. Nicht gesetzte Werte sind {@code null}.
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
     * Modell laden. Die benötigte {@code genai_config.json} wird dabei aus den
     * Konfigurationsdateien des Modells erzeugt.
     *
     * @param modelDir Verzeichnis mit den Modelldateien
     * @param onnxFile Relativer Pfad der ONNX-Datei, z.B. {@code onnx/model_q4.onnx}
     * @param device   Zu verwendender Execution Provider
     * @param settings Einstellungen aus dem Modellkatalog
     * @throws Exception wenn das Modell nicht geladen werden kann
     */
    public TextGenerationPipeline(File modelDir, String onnxFile, InferenceDevice device, ModelSettings settings) throws Exception {
        this.settings = settings;

        JSONObject modelConfig     = ModelFiles.readJson(new File(modelDir, "config.json"));
        JSONObject tokenizerConfig = ModelFiles.readJson(new File(modelDir, "tokenizer_config.json"));
        generationConfig = ModelFiles.readJson(new File(modelDir, "generation_config.json"));
        contextLength    = GenAIConfigBuilder.contextLength(modelConfig);

        // Wie in Transformers.js fügt der Tokenizer bei reiner Textvervollständigung nur dann
        // Sonder-Tokens hinzu, wenn die Tokenizer-Konfiguration das verlangt.
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
     * Text generieren.
     *
     * @param request  Parameter des Aufrufs
     * @param listener Empfänger der einzelnen Tokens
     * @param stopped  Liefert {@code true}, wenn die Generierung abgebrochen werden soll
     * @return Antwort des Modells (Chat-Modelle) bzw. vervollständigter Text (andere Modelle)
     * @throws Exception bei Fehlern während der Generierung
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

                    // Beim End-Token wird die Sequenz nicht verlängert, sondern nur beendet
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
     * Prompt erzeugen und tokenisieren.
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

            // Das Chat-Template enthält bereits alle Sonder-Tokens. Leerer String = Template des
            // Tokenizers verwenden (null führt in der JNI-Schicht von GenAI zum Absturz).
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

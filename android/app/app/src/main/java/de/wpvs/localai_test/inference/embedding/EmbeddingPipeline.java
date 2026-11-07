package de.wpvs.localai_test.inference.embedding;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OnnxValue;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import ai.onnxruntime.genai.GenAIException;
import java.io.File;
import java.io.IOException;
import java.nio.FloatBuffer;
import java.nio.LongBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.json.JSONException;
import org.json.JSONObject;

import de.wpvs.localai_test.inference.InferenceDevice;
import de.wpvs.localai_test.inference.ModelFiles;

/**
 * Feature extraction pipeline for computing sentence embeddings with ONNX Runtime.
 * It behaves like {@code pipeline("feature-extraction", ...)} in Transformers.js
 * with {@code {pooling: "mean", normalize: true}}: tokenize, run the model,
 * mean-pool all tokens according to the attention mask, and L2-normalize.
 */
public final class EmbeddingPipeline implements AutoCloseable {
    /**
     * Tokenization result.
     */
    static final class Encoding {
        final long[] inputIds;
        final long[] tokenTypeIds;

        Encoding(long[] inputIds, long[] tokenTypeIds) {
            this.inputIds     = inputIds;
            this.tokenTypeIds = tokenTypeIds;
        }
    }

    /**
     * Shared interface for tokenizer implementations.
     */
    interface TextTokenizer extends AutoCloseable {
        Encoding encode(String text) throws Exception;

        @Override
        default void close() {}
    }

    /**
     * Fallback tokenizer based on ORT GenAI for models not supported by
     * {@link WordPieceTokenizer} (e.g. BPE or Unigram tokenizers).
     */
    private static final class GenAITokenizer implements TextTokenizer {
        /**
         * Minimal configuration when ORT GenAI is used only as a tokenizer.
         */
        private static final String TOKENIZER_ONLY_CONFIG = "{\"model\":{\"type\":\"decoder\",\"vocab_size\":1,\"context_length\":512,"
            + "\"decoder\":{\"filename\":\"unused.onnx\",\"head_size\":1,\"hidden_size\":1,\"num_attention_heads\":1,"
            + "\"num_hidden_layers\":1,\"num_key_value_heads\":1,\"inputs\":{\"input_ids\":\"input_ids\"},"
            + "\"outputs\":{\"logits\":\"logits\"}},\"eos_token_id\":0,\"bos_token_id\":0,\"pad_token_id\":0},"
            + "\"search\":{\"max_length\":512}}";

        private final ai.onnxruntime.genai.Config config;
        private final ai.onnxruntime.genai.Tokenizer tokenizer;
        private final int maxLength;

        GenAITokenizer(File modelDir, JSONObject tokenizerConfig) throws GenAIException, IOException {
            // ORT GenAI requires a genai_config.json even when only the tokenizer is used.
            ModelFiles.writeText(new File(modelDir, "genai_config.json"), TOKENIZER_ONLY_CONFIG);

            config    = new ai.onnxruntime.genai.Config(modelDir.getAbsolutePath());
            tokenizer = new ai.onnxruntime.genai.Tokenizer(config);

            Map<String, String> options = new HashMap<>();
            options.put("add_special_tokens", "true");
            tokenizer.updateOptions(options);

            double max = tokenizerConfig.optDouble("model_max_length", Double.NaN);
            maxLength  = Double.isNaN(max) || max >= Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) max;
        }

        @Override
        public Encoding encode(String text) throws GenAIException {
            int[] tokens;

            try (ai.onnxruntime.genai.Sequences sequences = tokenizer.encode(text)) {
                tokens = sequences.getSequence(0);
            }

            int length = Math.min(tokens.length, maxLength);
            long[] ids = new long[length];
            for (int i = 0; i < length; i++) ids[i] = tokens[i];

            return new Encoding(ids, new long[length]);
        }

        @Override
        public void close() {
            tokenizer.close();
            config.close();
        }
    }

    private final OrtEnvironment environment;
    private final OrtSession session;
    private final TextTokenizer tokenizer;
    private final Set<String> inputNames;

    /**
     * Load the model and tokenizer.
     *
     * @param modelDir Directory containing the model files
     * @param onnxFile Relative path to the ONNX file, e.g. {@code onnx/model.onnx}
     * @param device   Execution provider to use
     * @throws Exception if the model cannot be loaded
     */
    public EmbeddingPipeline(File modelDir, String onnxFile, InferenceDevice device) throws Exception {
        tokenizer = createTokenizer(modelDir);

        try {
            environment = OrtEnvironment.getEnvironment();

            try (OrtSession.SessionOptions options = device.createSessionOptions()) {
                session = environment.createSession(new File(modelDir, onnxFile).getAbsolutePath(), options);
            }

            inputNames = session.getInputNames();
        } catch (Exception e) {
            tokenizer.close();
            throw e;
        }
    }

    /**
     * Create the appropriate tokenizer for the model.
     */
    private static TextTokenizer createTokenizer(File modelDir) throws IOException, JSONException, GenAIException {
        JSONObject tokenizerJson   = ModelFiles.readJson(new File(modelDir, "tokenizer.json"));
        JSONObject tokenizerConfig = ModelFiles.readJson(new File(modelDir, "tokenizer_config.json"));

        if (WordPieceTokenizer.supports(tokenizerJson)) {
            return new WordPieceTokenizer(tokenizerJson, tokenizerConfig);
        } else {
            return new GenAITokenizer(modelDir, tokenizerConfig);
        }
    }

    /**
     * Compute a normalized embedding for a text.
     *
     * @param text Input text
     * @return L2-normalized embedding vector
     * @throws Exception if an error occurs during inference
     */
    public float[] embed(String text) throws Exception {
        Encoding encoding = tokenizer.encode(text);
        int length = encoding.inputIds.length;

        long[] attentionMask = new long[length];
        java.util.Arrays.fill(attentionMask, 1L);

        long[] shape = { 1, length };
        Map<String, OnnxTensor> inputs = new HashMap<>();

        try {
            if (inputNames.contains("input_ids")) {
                inputs.put("input_ids", OnnxTensor.createTensor(environment, LongBuffer.wrap(encoding.inputIds), shape));
            }

            if (inputNames.contains("attention_mask")) {
                inputs.put("attention_mask", OnnxTensor.createTensor(environment, LongBuffer.wrap(attentionMask), shape));
            }

            if (inputNames.contains("token_type_ids")) {
                inputs.put("token_type_ids", OnnxTensor.createTensor(environment, LongBuffer.wrap(encoding.tokenTypeIds), shape));
            }

            try (OrtSession.Result result = session.run(inputs)) {
                OnnxTensor output = findOutput(result);
                long[] outputShape = output.getInfo().getShape();

                if (outputShape.length == 2) {
                    // The model already returns a pooled embedding.
                    float[] embedding = toArray(output.getFloatBuffer());
                    return normalize(embedding);
                }

                if (outputShape.length != 3) {
                    throw new IllegalStateException("Unerwartete Form der Modellausgabe: " + java.util.Arrays.toString(outputShape));
                }

                int tokens     = (int) outputShape[1];
                int dimensions = (int) outputShape[2];
                return normalize(meanPooling(toArray(output.getFloatBuffer()), attentionMask, tokens, dimensions));
            }
        } finally {
            for (OnnxTensor tensor : inputs.values()) tensor.close();
        }
    }

    /**
     * Find the output tensor containing the token embeddings. Prefer
     * {@code last_hidden_state}, as in Transformers.js, followed by {@code logits}
     * and {@code token_embeddings}; otherwise use the first output.
     */
    private static OnnxTensor findOutput(OrtSession.Result result) {
        for (String name : new String[] { "last_hidden_state", "logits", "token_embeddings" }) {
            Optional<OnnxValue> value = result.get(name);
            if (value.isPresent() && value.get() instanceof OnnxTensor) return (OnnxTensor) value.get();
        }

        OnnxValue first = result.get(0);
        if (first instanceof OnnxTensor) return (OnnxTensor) first;
        throw new IllegalStateException("Das Modell liefert keinen Tensor als Ausgabe.");
    }

    private static float[] toArray(FloatBuffer buffer) {
        float[] array = new float[buffer.remaining()];
        buffer.get(array);
        return array;
    }

    /**
     * Mean of all token embeddings, weighted by the attention mask.
     *
     * @param hidden     Token embeddings with shape {@code [1, tokens, dimensions]}
     * @param mask       Attention mask
     * @param tokens     Number of tokens
     * @param dimensions Number of dimensions
     * @return Pooled embedding
     */
    static float[] meanPooling(float[] hidden, long[] mask, int tokens, int dimensions) {
        float[] result = new float[dimensions];
        double[] sums  = new double[dimensions];
        double count   = 0;

        for (int t = 0; t < tokens; t++) {
            long weight = t < mask.length ? mask[t] : 0;
            if (weight == 0) continue;

            count += weight;
            int offset = t * dimensions;

            for (int d = 0; d < dimensions; d++) {
                sums[d] += hidden[offset + d] * weight;
            }
        }

        for (int d = 0; d < dimensions; d++) {
            result[d] = count > 0 ? (float) (sums[d] / count) : 0f;
        }

        return result;
    }

    /**
     * Normalize a vector to length 1 (L2 norm).
     *
     * @param vector Vector, modified in place
     * @return The same vector
     */
    static float[] normalize(float[] vector) {
        double sum = 0;
        for (float value : vector) sum += value * (double) value;

        double norm = Math.max(Math.sqrt(sum), 1e-12);
        for (int i = 0; i < vector.length; i++) vector[i] = (float) (vector[i] / norm);

        return vector;
    }

    @Override
    public void close() {
        try {
            session.close();
        } catch (OrtException ignored) {
            // Not relevant during cleanup.
        }

        tokenizer.close();
    }
}

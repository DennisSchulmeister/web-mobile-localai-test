package de.wpvs.localai_test.inference.generation;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Creates the {@code genai_config.json} required by ORT GenAI from the {@code config.json}
 * and {@code generation_config.json} of a Transformers.js-compatible ONNX model.
 *
 * <p>Models from {@code onnx-community} use the input and output names from
 * Hugging Face Optimum-Exports ({@code past_key_values.N.key}, {@code present.N.key}).
 * These are defined here for ORT GenAI so that the same model files can be used
 * in the browser.</p>
 */
final class GenAIConfigBuilder {
    /**
     * Default value when the model does not specify a maximum context length.
     */
    static final int DEFAULT_CONTEXT_LENGTH = 2048;

    private GenAIConfigBuilder() {}

    /**
     * Get the model's maximum context length.
     *
     * @param config Contents of {@code config.json}
     * @return Context length in tokens
     */
    static int contextLength(JSONObject config) {
        return config.optInt("max_position_embeddings", DEFAULT_CONTEXT_LENGTH);
    }

    /**
     * Generate {@code genai_config.json}.
     *
     * @param config           Contents of {@code config.json}
     * @param generationConfig Contents of {@code generation_config.json} (may be empty)
     * @param onnxFile         Relative path to the ONNX file, e.g. {@code onnx/model_q4.onnx}
     * @return Configuration for ORT GenAI
     * @throws JSONException if the model configuration is incomplete
     */
    static JSONObject build(JSONObject config, JSONObject generationConfig, String onnxFile) throws JSONException {
        String modelType = config.getString("model_type");
        int contextLength = contextLength(config);

        int hiddenSize = config.getInt("hidden_size");
        int numHeads = config.has("num_attention_heads") ? config.getInt("num_attention_heads") : config.getInt("num_heads");
        int headSize = config.has("head_dim") && !config.isNull("head_dim") ? config.getInt("head_dim") : hiddenSize / numHeads;

        // Inputs and outputs from the Optimum export.
        JSONObject inputs = new JSONObject()
            .put("input_ids", "input_ids")
            .put("attention_mask", "attention_mask")
            .put("position_ids", "position_ids")
            .put("past_key_names", "past_key_values.%d.key")
            .put("past_value_names", "past_key_values.%d.value");

        JSONObject outputs = new JSONObject()
            .put("logits", "logits")
            .put("present_key_names", "present.%d.key")
            .put("present_value_names", "present.%d.value");

        JSONObject decoder = new JSONObject()
            .put("filename", onnxFile)
            .put("head_size", headSize)
            .put("hidden_size", hiddenSize)
            .put("num_attention_heads", numHeads)
            .put("num_hidden_layers", config.getInt("num_hidden_layers"))
            .put("num_key_value_heads", config.optInt("num_key_value_heads", numHeads))
            .put("inputs", inputs)
            .put("outputs", outputs)
            .put("session_options", new JSONObject().put("provider_options", new JSONArray()));

        if (modelType.equals("lfm2")) {
            // Hybrid model with attention and convolution layers and an additional convolution cache.
            decoder.put("layer_types", config.getJSONArray("layer_types"));
            decoder.put("conv_cache_size", config.getInt("conv_L_cache"));
            inputs.put("past_conv_names", "past_conv.%d");
            outputs.put("present_conv_names", "present_conv.%d");
            inputs.remove("position_ids");
        }

        Object eosTokenId = firstPresent(generationConfig, config, "eos_token_id");
        Object padTokenId = firstPresent(generationConfig, config, "pad_token_id");

        if (padTokenId == null) {
            padTokenId = eosTokenId instanceof JSONArray ? ((JSONArray) eosTokenId).opt(0) : eosTokenId;
        }

        JSONObject model = new JSONObject()
            .put("type", modelType)
            .put("vocab_size", config.getInt("vocab_size"))
            .put("context_length", contextLength)
            .put("bos_token_id", config.optInt("bos_token_id", 0))
            .put("eos_token_id", eosTokenId == null ? 0 : eosTokenId)
            .put("pad_token_id", padTokenId == null ? 0 : padTokenId)
            .put("decoder", decoder);

        JSONObject search = new JSONObject()
            .put("max_length", contextLength)
            .put("past_present_share_buffer", false);

        return new JSONObject().put("model", model).put("search", search);
    }

    /**
     * Read a value from the first configuration in which it is set and not {@code null}.
     */
    private static Object firstPresent(JSONObject first, JSONObject second, String key) {
        if (first.has(key) && !first.isNull(key)) return first.opt(key);
        if (second.has(key) && !second.isNull(key)) return second.opt(key);
        return null;
    }
}

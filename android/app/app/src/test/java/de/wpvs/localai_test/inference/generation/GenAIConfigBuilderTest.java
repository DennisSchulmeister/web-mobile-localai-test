package de.wpvs.localai_test.inference.generation;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

/**
 * Tests der Erzeugung von {@code genai_config.json} durch {@link GenAIConfigBuilder}.
 */
public class GenAIConfigBuilderTest {
    @Test
    public void genaiConfigForLlama() throws Exception {
        JSONObject config = new JSONObject()
            .put("model_type", "llama").put("vocab_size", 49152).put("max_position_embeddings", 8192)
            .put("hidden_size", 576).put("num_attention_heads", 9).put("num_hidden_layers", 30)
            .put("num_key_value_heads", 3).put("bos_token_id", 1).put("eos_token_id", 2);

        JSONObject genai = GenAIConfigBuilder.build(config, new JSONObject(), "onnx/model_q4.onnx");
        JSONObject model = genai.getJSONObject("model");
        JSONObject decoder = model.getJSONObject("decoder");

        assertEquals("llama", model.getString("type"));
        assertEquals(8192, model.getInt("context_length"));
        assertEquals(2, model.getInt("eos_token_id"));
        assertEquals(2, model.getInt("pad_token_id"));
        assertEquals(64, decoder.getInt("head_size"));
        assertEquals(3, decoder.getInt("num_key_value_heads"));
        assertEquals("onnx/model_q4.onnx", decoder.getString("filename"));
        assertEquals("position_ids", decoder.getJSONObject("inputs").getString("position_ids"));
        assertEquals("past_key_values.%d.key", decoder.getJSONObject("inputs").getString("past_key_names"));
        assertEquals(8192, genai.getJSONObject("search").getInt("max_length"));
        assertFalse(genai.getJSONObject("search").getBoolean("past_present_share_buffer"));
    }

    @Test
    public void genaiConfigPrefersGenerationConfig() throws Exception {
        JSONObject config = new JSONObject()
            .put("model_type", "qwen3").put("vocab_size", 151936).put("max_position_embeddings", 40960)
            .put("hidden_size", 1024).put("num_attention_heads", 16).put("num_hidden_layers", 28)
            .put("num_key_value_heads", 8).put("head_dim", 128).put("eos_token_id", 151645)
            .put("pad_token_id", JSONObject.NULL);

        JSONObject generation = new JSONObject()
            .put("eos_token_id", new JSONArray().put(151645).put(151643))
            .put("pad_token_id", 151643);

        JSONObject model = GenAIConfigBuilder.build(config, generation, "onnx/model_q4.onnx").getJSONObject("model");

        assertEquals(2, model.getJSONArray("eos_token_id").length());
        assertEquals(151643, model.getInt("pad_token_id"));
        assertEquals(128, model.getJSONObject("decoder").getInt("head_size"));
    }

    @Test
    public void genaiConfigForLfm2() throws Exception {
        JSONObject config = new JSONObject()
            .put("model_type", "lfm2").put("vocab_size", 65536).put("max_position_embeddings", 128000)
            .put("hidden_size", 2048).put("num_heads", 32).put("num_hidden_layers", 2)
            .put("num_key_value_heads", 8).put("eos_token_id", 7).put("conv_L_cache", 3)
            .put("layer_types", new JSONArray().put("conv").put("full_attention"));

        JSONObject decoder = GenAIConfigBuilder.build(config, new JSONObject(), "onnx/model_q4.onnx")
            .getJSONObject("model").getJSONObject("decoder");

        assertEquals(32, decoder.getInt("num_attention_heads"));
        assertEquals(3, decoder.getInt("conv_cache_size"));
        assertEquals(2, decoder.getJSONArray("layer_types").length());
        assertFalse(decoder.getJSONObject("inputs").has("position_ids"));
        assertEquals("past_conv.%d", decoder.getJSONObject("inputs").getString("past_conv_names"));
        assertEquals("present_conv.%d", decoder.getJSONObject("outputs").getString("present_conv_names"));
    }
}

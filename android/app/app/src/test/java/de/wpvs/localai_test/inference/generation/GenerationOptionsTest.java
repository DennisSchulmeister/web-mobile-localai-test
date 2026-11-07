package de.wpvs.localai_test.inference.generation;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import org.json.JSONObject;
import org.junit.Test;

/**
 * Tests der Auflösung der Generierungsparameter durch {@link GenerationOptions}.
 */
public class GenerationOptionsTest {
    private static final double DELTA = 1e-9;

    @Test
    public void generationOptionsUseDefaults() {
        GenerationOptions options = GenerationOptions.resolve(new JSONObject(), 10, 2048, null, null, null, null, null);

        assertEquals(2048, options.maxLength);
        assertFalse(options.doSample);
        assertEquals(1.0, options.temperature, DELTA);
        assertEquals(50, options.topK);
        assertEquals(1.0, options.topP, DELTA);
        assertEquals(1.0, options.repetitionPenalty, DELTA);
    }

    @Test
    public void generationOptionsPreferCallParameters() throws Exception {
        JSONObject generation = new JSONObject()
            .put("do_sample", true).put("temperature", 0.6).put("top_k", 20).put("top_p", 0.95)
            .put("max_new_tokens", 2048);

        GenerationOptions fromConfig = GenerationOptions.resolve(generation, 10, 40960, 100, null, null, null, null);
        assertEquals(110, fromConfig.maxLength);
        assertTrue(fromConfig.doSample);
        assertEquals(0.6, fromConfig.temperature, DELTA);
        assertEquals(20, fromConfig.topK);
        assertEquals(0.95, fromConfig.topP, DELTA);

        GenerationOptions fromCall = GenerationOptions.resolve(generation, 10, 40960, null, 50, false, 0.3, 1.2);
        assertEquals(50, fromCall.maxLength);
        assertFalse(fromCall.doSample);
        assertEquals(0.3, fromCall.temperature, DELTA);
        assertEquals(1.2, fromCall.repetitionPenalty, DELTA);
    }

    @Test
    public void generationOptionsClampLength() {
        assertEquals(100, GenerationOptions.resolve(new JSONObject(), 10, 100, 500, null, null, null, null).maxLength);
        assertEquals(11, GenerationOptions.resolve(new JSONObject(), 10, 100, null, 5, null, null, null).maxLength);
        assertFalse(GenerationOptions.resolve(new JSONObject(), 10, 100, null, null, true, 0.0, null).doSample);

        assertThrows(IllegalArgumentException.class,
            () -> GenerationOptions.resolve(new JSONObject(), 100, 100, null, null, null, null, null));
    }
}

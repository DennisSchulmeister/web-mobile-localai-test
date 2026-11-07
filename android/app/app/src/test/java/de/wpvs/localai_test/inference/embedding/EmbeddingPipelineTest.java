package de.wpvs.localai_test.inference.embedding;

import static org.junit.Assert.assertArrayEquals;

import org.junit.Test;

/**
 * Tests von Pooling und Normalisierung der {@link EmbeddingPipeline}.
 */
public class EmbeddingPipelineTest {
    @Test
    public void meanPoolingAndNormalization() {
        float[] hidden = { 1, 2, 3, 4, 100, 100 };
        float[] pooled = EmbeddingPipeline.meanPooling(hidden, new long[] { 1, 1, 0 }, 3, 2);
        assertArrayEquals(new float[] { 2, 3 }, pooled, 1e-6f);

        float[] normalized = EmbeddingPipeline.normalize(new float[] { 3, 4 });
        assertArrayEquals(new float[] { 0.6f, 0.8f }, normalized, 1e-6f);
    }
}

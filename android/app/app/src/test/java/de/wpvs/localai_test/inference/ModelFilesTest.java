package de.wpvs.localai_test.inference;

import static org.junit.Assert.assertEquals;

import java.util.List;
import org.json.JSONObject;
import org.junit.Test;

/**
 * Tests der Dateinamen-Logik von {@link ModelFiles}.
 */
public class ModelFilesTest {
    @Test
    public void dtypeSuffixMatchesTransformersJs() {
        assertEquals("", ModelFiles.dtypeSuffix("fp32"));
        assertEquals("_fp16", ModelFiles.dtypeSuffix("fp16"));
        assertEquals("_q4", ModelFiles.dtypeSuffix("q4"));
        assertEquals("_quantized", ModelFiles.dtypeSuffix("q8"));
    }

    @Test
    public void onnxFilesIncludeExternalData() throws Exception {
        JSONObject plain = new JSONObject();
        assertEquals(List.of("onnx/model_q4.onnx"), ModelFiles.onnxFiles(plain, "model", "q4"));

        JSONObject external = new JSONObject().put("transformers.js_config",
            new JSONObject().put("use_external_data_format", new JSONObject().put("model_q4.onnx", 2)));

        assertEquals(
            List.of("onnx/model_q4.onnx", "onnx/model_q4.onnx_data", "onnx/model_q4.onnx_data_1"),
            ModelFiles.onnxFiles(external, "model", "q4")
        );

        JSONObject global = new JSONObject().put("transformers.js_config",
            new JSONObject().put("use_external_data_format", true));

        assertEquals(List.of("onnx/model.onnx", "onnx/model.onnx_data"), ModelFiles.onnxFiles(global, "model", "fp32"));
    }
}

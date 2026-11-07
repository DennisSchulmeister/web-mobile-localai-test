package de.wpvs.localai_test.plugin;

import ai.onnxruntime.genai.GenAI;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.Log;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

import de.wpvs.localai_test.inference.InferenceDevice;
import de.wpvs.localai_test.inference.ModelFiles;
import de.wpvs.localai_test.inference.embedding.EmbeddingPipeline;
import de.wpvs.localai_test.inference.generation.TextGenerationPipeline;

/**
 * Native inference backend for Android that provides the backend API through Capacitor.
 * Inference runs with ONNX Runtime outside the WebView and uses the same
 * ONNX-Modelle wie Transformers.js im Browser:
 *
 * <ul>
 *   <li>{@code feature-extraction}: ONNX Runtime with its own WordPiece tokenizer
 *       ({@link EmbeddingPipeline})</li>
 *   <li>{@code text-generation}: ONNX Runtime GenAI for decoder-only models
 *       ({@link TextGenerationPipeline})</li>
 * </ul>
 *
 * <p>All other model types are unsupported, and their inference calls are rejected with an
 * UNIMPLEMENTED error. Model loading and inference calls run sequentially on a dedicated
 * background thread so the Capacitor thread is not blocked.</p>
 */
@CapacitorPlugin(name = "NativeInference")
public class NativeInferencePlugin extends Plugin {
    private static final String TAG = "NativeInference";
    private static final String TASK_FEATURE_EXTRACTION = "feature-extraction";
    private static final String TASK_TEXT_GENERATION = "text-generation";
    private static final String DEFAULT_DOWNLOAD_DIR = "_generated/models";

    /**
     * Background thread for model loading and inference.
     */
    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "NativeInference");
        thread.setPriority(Thread.NORM_PRIORITY);
        return thread;
    });

    /**
     * Most recently loaded model (used only on the background thread).
     */
    private EmbeddingPipeline embeddingPipeline;
    private TextGenerationPipeline textGenerationPipeline;

    /**
     * ID of the running text generation and its cancellation request. Read and
     * written outside the background thread so cancellation takes effect immediately.
     */
    private volatile String runningRequestId;
    private volatile boolean stopRequested;

    @Override
    public void load() {
        try {
            GenAI.setTelemetry(false);
        } catch (Throwable throwable) {
            Log.w(TAG, "Telemetrie von ONNX Runtime GenAI konnte nicht deaktiviert werden.", throwable);
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopRequested = true;

        executor.execute(this::unloadModel);
        executor.shutdown();
    }
    /**
     * Get supported execution environments as name/value pairs. The device value
     * is passed in the {@code device} field to {@link #loadModel(PluginCall)}.
     *
     * @param call Capacitor call; receives an object with {@code devices}, a
     *             list of objects with the string fields {@code device} and {@code label}
     */
    @PluginMethod
    public void getDevices(PluginCall call) {
        JSArray devices = new JSArray();

        for (InferenceDevice device : InferenceDevice.available()) {
            JSObject entry = new JSObject();
            entry.put("device", device.id);
            entry.put("label", device.label);
            devices.put(entry);
        }

        JSObject result = new JSObject();
        result.put("devices", devices);
        call.resolve(result);
    }

    /**
     * <p>
     * Check whether the backend supports a particular model type.
     * Model types can include:
     * </p>
     * 
     * <ul>
     *   <li><code>summarization</code></li>
     *   <li><code>translation</code></li>
     *   <li><code>question-answering</code></li>
     *   <li><code>feature-extraction</code></li>
     *   <li><code>text-generation</code></li>
     *   <li><code>text2text-generation</code></li>
     * </ul>
     * 
     * <p>Only {@code feature-extraction} and {@code text-generation} are supported.</p>
     *
     * @param call Capacitor call with {@code task} (String): model type;
     *             receives an object with {@code supported} (Boolean).
     *             The call is rejected if {@code task} is missing.
     */
    @PluginMethod
    public void supports(PluginCall call) {
        String task = call.getString("task");

        if (task == null) {
            call.reject("task is required");
            return;
        }

        JSObject result = new JSObject();
        result.put("supported", isSupportedTask(task));
        call.resolve(result);
    }

    /**
     * Return backend diagnostic information as a list of name/value pairs, such as
     * the Android version, device architecture, memory, OpenGL ES renderer, and the
     * ONNX Runtime and ONNX Runtime GenAI versions with their available execution providers.
     *
     * @param call Capacitor call; receives an object with {@code information}, a
     *             list of objects with the string fields {@code icon}, {@code label},
     *             and {@code text}
     */
    @PluginMethod
    public void getInformation(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("information", NativeSystemInformation.collect(getContext()));
            call.resolve(result);
        } catch (RuntimeException exception) {
            Log.e(TAG, "Systeminformationen konnten nicht ermittelt werden.", exception);
            call.reject("Systeminformationen konnten nicht ermittelt werden.", exception);
        }
    }

    /**
     * Load an AI model. Since the models are very large, only the most recently
     * loaded model is kept in memory.
     *
     * <p>On first load, model files are copied from the app assets
     * ({@code public/<downloadDir>/<modelId>}) to the app's private storage
     * or downloaded from Hugging Face if they were not bundled with the app.
     * As in Transformers.js, the ONNX file is selected based on the data type,
     * e.g. {@code onnx/model_q4.onnx} for {@code q4}.</p>
     *
     * <p>Parameters in the Capacitor call:</p>
     * <ul>
     *   <li>{@code task} (String): Model type</li>
     *   <li>{@code modelId} (String): Model ID</li>
     *   <li>{@code dtype} (String): Data type</li>
     *   <li>{@code device} (String): Execution environment</li>
     *   <li>{@code modelConfig} (Object): Configuration of the model to load</li>
     *   <li>{@code config} (Object): Global configuration from {@code app/static/config.json}</li>
     *   <li>{@code models} (Object): Model configuration from {@code app/static/models/index.json}</li>
     * </ul>
     *
     * @param call Capacitor call; resolves without a result after successful loading
     *             and is rejected for unsupported model types or loading errors
     */
    @PluginMethod
    public void loadModel(PluginCall call) {
        String task    = call.getString("task");
        String modelId = call.getString("modelId");

        if (task == null || modelId == null || modelId.isEmpty()) {
            call.reject("task und modelId müssen angegeben werden.");
            return;
        }

        if (!isSupportedTask(task)) {
            call.reject("Die Modellart " + task + " wird von der nativen Inferenz nicht unterstützt.");
            return;
        }

        String dtype = call.getString("dtype");
        if (dtype == null || dtype.isEmpty()) dtype = "fp32";

        InferenceDevice device = InferenceDevice.fromId(call.getString("device"));
        JSONObject modelConfig = call.getObject("modelConfig");
        JSONObject config      = call.getObject("config");
        String downloadDir     = DEFAULT_DOWNLOAD_DIR;

        if (config != null && config.optJSONObject("models") != null) {
            downloadDir = config.optJSONObject("models").optString("downloadDir", DEFAULT_DOWNLOAD_DIR);
        }

        String finalDtype       = dtype;
        String finalDownloadDir = downloadDir;

        executor.execute(() -> {
            try {
                unloadModel();

                ModelFiles files = new ModelFiles(getContext(), finalDownloadDir);
                File modelDir = files.ensure(modelId, List.of("config.json"), List.of());
                JSONObject modelJson = ModelFiles.readJson(new File(modelDir, "config.json"));

                List<String> onnxFiles = ModelFiles.onnxFiles(modelJson, "model", finalDtype);
                List<String> required = new ArrayList<>(List.of("tokenizer.json", "tokenizer_config.json"));
                required.addAll(onnxFiles);

                files.ensure(modelId, required, List.of("generation_config.json"));

                if (task.equals(TASK_FEATURE_EXTRACTION)) {
                    embeddingPipeline = new EmbeddingPipeline(modelDir, onnxFiles.get(0), device);
                } else {
                    textGenerationPipeline = new TextGenerationPipeline(
                        modelDir, onnxFiles.get(0), device,
                        TextGenerationPipeline.ModelSettings.fromJson(modelConfig)
                    );
                }

                Log.i(TAG, "Modell geladen: " + modelId + " (" + task + ", " + finalDtype + ", " + device.id + ")");
                call.resolve();
            } catch (Throwable throwable) {
                unloadModel();
                Log.e(TAG, "Modell " + modelId + " konnte nicht geladen werden.", throwable);
                call.reject("Modell " + modelId + " konnte nicht geladen werden: " + describe(throwable), toException(throwable));
            }
        });
    }

    /**
     * AI inference: normalized word embeddings for cosine similarity. As in
     * Transformers.js, token embeddings are averaged (mean pooling) and then
     * normalized to length 1.
     *
     * @param call Capacitor call with {@code input} (String): input text;
     *             receives an object with {@code embedding} (list of numeric embeddings)
     */
    @PluginMethod
    public void runEmbeddingPipeline(PluginCall call) {
        String input = call.getString("input", "");

        executor.execute(() -> {
            if (embeddingPipeline == null) {
                call.reject("Es ist kein Modell für feature-extraction geladen.");
                return;
            }

            try {
                float[] embedding = embeddingPipeline.embed(input);
                JSONArray values = new JSONArray();
                for (float value : embedding) values.put((double) value);

                JSObject result = new JSObject();
                result.put("embedding", values);
                call.resolve(result);
            } catch (Throwable throwable) {
                Log.e(TAG, "Fehler bei der Berechnung des Embeddings.", throwable);
                call.reject("Fehler bei der Berechnung des Embeddings: " + describe(throwable), toException(throwable));
            }
        });
    }

    /**
     * AI inference: answer a question about text.
     *
     * @param call Capacitor call with {@code question} (String): question and
     *             {@code context} (String): text context; rejected as unimplemented
     */
    @PluginMethod
    public void runQuestionAnsweringPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * AI inference: summarize text.
     *
     * @param call Capacitor call with {@code input} (String): input text and
     *             {@code maxNewTokens} (Number): maximum number of tokens; rejected as unimplemented
     */
    @PluginMethod
    public void runSummaryPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * AI inference: translate text.
     *
     * @param call Capacitor call with {@code input} (String): input text,
     *             {@code sourceLanguage} (String): source language, and
     *             {@code targetLanguage} (String): target language; rejected as unimplemented
     */
    @PluginMethod
    public void runTranslationPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * AI inference: text generation / chat.
     *
     * <p>For real-time UI updates, {@code generationChunk} events replace the
     * JavaScript callbacks. They contain the {@code requestId} for association,
     * {@code tokens} (list of the most recently generated tokens), and
     * {@code text} (string with the most recently generated text fragment).
     * As in Transformers.js, the final result contains the answer for chat models
     * and the completed input text for other models.</p>
     *
     * <p>Unspecified parameters are taken from the model's {@code generation_config.json}.</p>
     *
     * <p>Parameters in the Capacitor call:</p>
     * <ul>
     *   <li>{@code requestId} (String): ID of the generation and its streaming events</li>
     *   <li>{@code question} (String): Question</li>
     *   <li>{@code context} (String): Text context</li>
     *   <li>{@code maxNewTokens} (Number): Maximum number of tokens to generate</li>
     *   <li>{@code maxLength} (Number): Maximum length of the prompt and answer in tokens</li>
     *   <li>{@code doSample} (Boolean): Whether to use sampling</li>
     *   <li>{@code temperature} (Number): Temperature</li>
     *   <li>{@code repetitionPenalty} (Number): Penalty for verbatim repetitions</li>
     * </ul>
     *
     * @param call Capacitor call; receives an object with {@code text} (String):
     *             generated text, or the text generated so far if cancelled
     */
    @PluginMethod
    public void runTextGenerationPipeline(PluginCall call) {
        String requestId = call.getString("requestId", "");

        TextGenerationPipeline.Request request = new TextGenerationPipeline.Request();
        request.question          = call.getString("question", "");
        request.context           = call.getString("context");
        request.maxNewTokens      = optPositiveInt(call.getData(), "maxNewTokens");
        request.maxLength         = optPositiveInt(call.getData(), "maxLength");
        request.doSample          = call.getData().opt("doSample") instanceof Boolean ? call.getBoolean("doSample") : null;
        request.temperature       = optNumber(call.getData(), "temperature");
        request.repetitionPenalty = optNumber(call.getData(), "repetitionPenalty");

        synchronized (this) {
            if (runningRequestId != null) {
                call.reject("Textgenerierung läuft bereits.");
                return;
            }

            runningRequestId = requestId;
            stopRequested    = false;
        }

        executor.execute(() -> {
            try {
                if (textGenerationPipeline == null) {
                    call.reject("Es ist kein Modell für text-generation geladen.");
                    return;
                }

                String text = textGenerationPipeline.generate(request, (token, piece) -> {
                    JSObject chunk = new JSObject();
                    chunk.put("requestId", requestId);
                    chunk.put("tokens", new JSArray().put(token));
                    chunk.put("text", piece);
                    notifyListeners("generationChunk", chunk);
                }, () -> stopRequested);

                JSObject result = new JSObject();
                result.put("text", text);
                call.resolve(result);
            } catch (Throwable throwable) {
                Log.e(TAG, "Fehler bei der Textgenerierung.", throwable);
                call.reject("Fehler bei der Textgenerierung: " + describe(throwable), toException(throwable));
            } finally {
                synchronized (this) {
                    runningRequestId = null;
                    stopRequested    = false;
                }
            }
        });
    }

    /**
     * Cancel the current text generation. The original generation request resolves
     * after the current token with the text generated so far.
     *
     * @param call Capacitor call with {@code requestId} (String): ID of the running
     *             generation; resolves immediately without a result
     */
    @PluginMethod
    public void stopTextGeneration(PluginCall call) {
        String requestId = call.getString("requestId");

        synchronized (this) {
            if (runningRequestId != null && (requestId == null || requestId.equals(runningRequestId))) {
                stopRequested = true;
            }
        }

        call.resolve();
    }

    /**
     * Explicitly reject inference calls for unsupported model types.
     *
     * @param call Capacitor call to reject with an UNIMPLEMENTED error
     */
    private void rejectInference(PluginCall call) {
        call.unimplemented("Diese Modellart wird von der nativen Inferenz nicht unterstützt.");
    }

    /**
     * Check whether a model type is supported natively.
     */
    private static boolean isSupportedTask(String task) {
        return TASK_FEATURE_EXTRACTION.equals(task) || TASK_TEXT_GENERATION.equals(task);
    }

    /**
     * Release the most recently loaded model (call only on the background thread).
     */
    private void unloadModel() {
        if (embeddingPipeline != null) {
            embeddingPipeline.close();
            embeddingPipeline = null;
        }

        if (textGenerationPipeline != null) {
            textGenerationPipeline.close();
            textGenerationPipeline = null;
        }

    }

    /**
     * Read a positive integer from the call parameters. JavaScript numbers can arrive
     * as either Integer or Double; 0 and missing values are treated as unset.
     */
    private static Integer optPositiveInt(JSONObject data, String key) {
        Object value = data.opt(key);
        if (!(value instanceof Number)) return null;

        int number = ((Number) value).intValue();
        return number > 0 ? number : null;
    }

    /**
     * Read a number from the call parameters, or return {@code null} if it is missing.
     */
    private static Double optNumber(JSONObject data, String key) {
        Object value = data.opt(key);
        return value instanceof Number ? ((Number) value).doubleValue() : null;
    }

    private static String describe(Throwable throwable) {
        String message = throwable.getMessage();
        return message == null || message.isEmpty() ? throwable.getClass().getSimpleName() : message;
    }

    private static Exception toException(Throwable throwable) {
        return throwable instanceof Exception ? (Exception) throwable : new Exception(throwable);
    }
}

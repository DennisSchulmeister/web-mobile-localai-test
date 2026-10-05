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
 * Natives Inferenz-Backend für Android, das die Backend-API über Capacitor bereitstellt.
 * Die Inferenz läuft mit ONNX Runtime außerhalb der Web View und nutzt dieselben
 * ONNX-Modelle wie Transformers.js im Browser:
 *
 * <ul>
 *   <li>{@code feature-extraction}: ONNX Runtime mit eigenem WordPiece-Tokenizer
 *       ({@link EmbeddingPipeline})</li>
 *   <li>{@code text-generation}: ONNX Runtime GenAI für Decoder-Only-Modelle
 *       ({@link TextGenerationPipeline})</li>
 * </ul>
 *
 * <p>Alle anderen Modellarten werden nicht unterstützt und ihre Inferenzaufrufe mit einem
 * UNIMPLEMENTED-Fehler abgelehnt. Modell- und Inferenzaufrufe laufen nacheinander in einem
 * eigenen Hintergrund-Thread, damit der Capacitor-Thread nicht blockiert wird.</p>
 */
@CapacitorPlugin(name = "NativeInference")
public class NativeInferencePlugin extends Plugin {
    private static final String TAG = "NativeInference";
    private static final String TASK_FEATURE_EXTRACTION = "feature-extraction";
    private static final String TASK_TEXT_GENERATION = "text-generation";
    private static final String DEFAULT_DOWNLOAD_DIR = "_generated/models";

    /**
     * Hintergrund-Thread für das Laden der Modelle und die Inferenz.
     */
    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "NativeInference");
        thread.setPriority(Thread.NORM_PRIORITY);
        return thread;
    });

    /**
     * Zuletzt geladenes Modell (nur im Hintergrund-Thread verwendet).
     */
    private EmbeddingPipeline embeddingPipeline;
    private TextGenerationPipeline textGenerationPipeline;

    /**
     * ID der laufenden Textgenerierung und Abbruchanforderung. Werden ohne den
     * Hintergrund-Thread gelesen und geschrieben, damit der Abbruch sofort wirkt.
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
     * Unterstützte Ausführumgebungen als Name/Wert-Paare abfragen. Der Gerätewert
     * wird {@link #loadModel(PluginCall)} im Feld {@code device} übergeben.
     *
     * @param call Capacitor-Aufruf; erhält ein Objekt mit {@code devices}, einer
     *             Liste von Objekten mit den String-Feldern {@code device} und {@code label}
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
     * Abfragen, ob eine bestimmte Modellart vom Backend unterstützt wird.
     * Modellarten können sein:
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
     * <p>Unterstützt werden nur {@code feature-extraction} und {@code text-generation}.</p>
     *
     * @param call Capacitor-Aufruf mit {@code task} (String): Art des Modells;
     *             erhält ein Objekt mit {@code supported} (Boolean).
     *             Fehlt {@code task}, wird der Aufruf abgelehnt.
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
     * Diagnoseinformationen des Backends als Name/Wert-Liste zurückgeben, zum Beispiel
     * Android-Version, Gerätearchitektur, Speicher, OpenGL-ES-Renderer sowie die Versionen
     * von ONNX Runtime und ONNX Runtime GenAI mit den verfügbaren Execution Providern.
     *
     * @param call Capacitor-Aufruf; erhält ein Objekt mit {@code information}, einer
     *             Liste von Objekten mit den String-Feldern {@code icon}, {@code label}
     *             und {@code text}
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
     * KI-Modell laden. Da die Modelle sehr groß sind, wird immer nur das zuletzt
     * geladene Modell im Speicher behalten.
     *
     * <p>Die Modelldateien werden beim ersten Laden aus den App-Assets
     * ({@code public/<downloadDir>/<modelId>}) in den privaten Speicher der App kopiert
     * oder, falls sie nicht mit der App ausgeliefert wurden, von Hugging Face
     * heruntergeladen. Die ONNX-Datei wird wie in Transformers.js anhand des Datentyps
     * bestimmt, z.B. {@code onnx/model_q4.onnx} für {@code q4}.</p>
     *
     * <p>Parameter im Capacitor-Aufruf:</p>
     * <ul>
     *   <li>{@code task} (String): Art des Modells</li>
     *   <li>{@code modelId} (String): Modell-ID</li>
     *   <li>{@code dtype} (String): Datentyp</li>
     *   <li>{@code device} (String): Ausführumgebung</li>
     *   <li>{@code modelConfig} (Objekt): Konfiguration des zu ladenden Modells</li>
     *   <li>{@code config} (Objekt): Globale Konfiguration aus {@code static/config.json}</li>
     *   <li>{@code models} (Objekt): Modellkonfiguration aus {@code static/models/index.json}</li>
     * </ul>
     *
     * @param call Capacitor-Aufruf; wird nach erfolgreichem Laden ohne Ergebnis aufgelöst
     *             und bei nicht unterstützten Modellarten oder Ladefehlern abgelehnt
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
     * KI-Inferenz: Normalisierte Worteinbettungen für Cosinus-Vergleich. Wie in
     * Transformers.js werden die Token-Embeddings gemittelt (Mean Pooling) und
     * anschließend auf die Länge 1 normalisiert.
     *
     * @param call Capacitor-Aufruf mit {@code input} (String): Eingabetext;
     *             erhält ein Objekt mit {@code embedding} (Liste numerischer Einbettungen)
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
     * KI-Inferenz: Frage zu Text beantworten.
     *
     * @param call Capacitor-Aufruf mit {@code question} (String): Frage und
     *             {@code context} (String): Text-Kontext; wird als nicht
     *             implementiert abgelehnt
     */
    @PluginMethod
    public void runQuestionAnsweringPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * KI-Inferenz: Text zusammenfassen.
     *
     * @param call Capacitor-Aufruf mit {@code input} (String): Eingabetext und
     *             {@code maxNewTokens} (Zahl): Maximale Anzahl Tokens; wird als nicht
     *             implementiert abgelehnt
     */
    @PluginMethod
    public void runSummaryPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * KI-Inferenz: Text übersetzen.
     *
     * @param call Capacitor-Aufruf mit {@code input} (String): Eingabetext,
     *             {@code sourceLanguage} (String): Quellsprache und
     *             {@code targetLanguage} (String): Zielsprache; wird als nicht
     *             implementiert abgelehnt
     */
    @PluginMethod
    public void runTranslationPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * KI-Inferenz: Textgenerierung / Chat.
     *
     * <p>Für UI-Updates in Echtzeit ersetzen {@code generationChunk}-Events die
     * JavaScript-Callbacks. Sie enthalten die {@code requestId} zur Zuordnung sowie
     * {@code tokens} (Liste der zuletzt generierten Tokens) und
     * {@code text} (String mit dem zuletzt generierten Textabschnitt).
     * Das abschließende Ergebnis enthält wie in Transformers.js bei Chat-Modellen
     * die Antwort und bei anderen Modellen den vervollständigten Eingabetext.</p>
     *
     * <p>Nicht angegebene Parameter werden aus der {@code generation_config.json}
     * des Modells übernommen.</p>
     *
     * <p>Parameter im Capacitor-Aufruf:</p>
     * <ul>
     *   <li>{@code requestId} (String): ID der Generierung und ihrer Streaming-Events</li>
     *   <li>{@code question} (String): Frage</li>
     *   <li>{@code context} (String): Text-Kontext</li>
     *   <li>{@code maxNewTokens} (Zahl): Maximale Anzahl zu generierender Tokens</li>
     *   <li>{@code maxLength} (Zahl): Maximale Länge von Prompt und Antwort in Tokens</li>
     *   <li>{@code doSample} (Boolean): Sampling ja/nein</li>
     *   <li>{@code temperature} (Zahl): Temperatur</li>
     *   <li>{@code repetitionPenalty} (Zahl): Bestrafung für wörtliche Wiederholungen</li>
     * </ul>
     *
     * @param call Capacitor-Aufruf; erhält ein Objekt mit {@code text} (String):
     *             Generierter Text, nach einem Abbruch mit dem bis dahin erzeugten Text
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
     * Laufende Textgenerierung abbrechen. Die ursprüngliche Generierungsanfrage
     * wird nach dem aktuellen Token mit dem bis dahin erzeugten Text abgeschlossen.
     *
     * @param call Capacitor-Aufruf mit {@code requestId} (String): ID der laufenden
     *             Generierung; wird sofort ohne Ergebnis aufgelöst
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
     * Inferenzaufrufe für nicht unterstützte Modellarten explizit ablehnen.
     *
     * @param call Capacitor-Aufruf, der mit einem UNIMPLEMENTED-Fehler abgelehnt wird
     */
    private void rejectInference(PluginCall call) {
        call.unimplemented("Diese Modellart wird von der nativen Inferenz nicht unterstützt.");
    }

    /**
     * Prüfen, ob eine Modellart nativ unterstützt wird.
     */
    private static boolean isSupportedTask(String task) {
        return TASK_FEATURE_EXTRACTION.equals(task) || TASK_TEXT_GENERATION.equals(task);
    }

    /**
     * Zuletzt geladenes Modell freigeben (nur im Hintergrund-Thread aufrufen).
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
     * Positive Ganzzahl aus den Aufrufparametern lesen. JavaScript-Zahlen können als
     * Integer oder Double ankommen, 0 oder fehlende Werte gelten als nicht gesetzt.
     */
    private static Integer optPositiveInt(JSONObject data, String key) {
        Object value = data.opt(key);
        if (!(value instanceof Number)) return null;

        int number = ((Number) value).intValue();
        return number > 0 ? number : null;
    }

    /**
     * Zahl aus den Aufrufparametern lesen oder {@code null}, wenn sie fehlt.
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

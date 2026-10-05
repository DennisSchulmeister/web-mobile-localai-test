package de.wpvs.localai_test;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.Log;

/**
 * Natives Inferenz-Backend für Android, das die Backend-API über Capacitor bereitstellt.
 * Ohne native Runtime werden keine Geräte oder Modellarten unterstützt und
 * Modell- sowie Inferenzaufrufe mit einem UNIMPLEMENTED-Fehler abgelehnt.
 */
@CapacitorPlugin(name = "NativeInference")
public class NativeInferencePlugin extends Plugin {
    /**
     * Unterstützte Ausführumgebungen als Name/Wert-Paare abfragen. Der Gerätewert
     * wird {@link #loadModel(PluginCall)} im Feld {@code device} übergeben.
     *
     * @param call Capacitor-Aufruf; erhält ein Objekt mit {@code devices}, einer
     *             Liste von Objekten mit den String-Feldern {@code device} und {@code label}
     */
    @PluginMethod
    public void getDevices(PluginCall call) {
        JSObject result = new JSObject();
        result.put("devices", new JSArray());
        call.resolve(result);
    }

    /**
     * Abfragen, ob eine bestimmte Modellart vom Backend unterstützt wird.
     *
     * @param call Capacitor-Aufruf mit {@code task} (String): Art des Modells;
     *             erhält ein Objekt mit {@code supported} (Boolean).
     *             Fehlt {@code task}, wird der Aufruf abgelehnt.
     */
    @PluginMethod
    public void supports(PluginCall call) {
        if (call.getString("task") == null) {
            call.reject("task is required");
            return;
        }

        JSObject result = new JSObject();
        result.put("supported", false);
        call.resolve(result);
    }

    /**
     * Diagnoseinformationen des Backends als Name/Wert-Liste zurückgeben, zum Beispiel
     * Android-Version, Gerätearchitektur, Speicher und OpenGL-ES-Renderer.
     * Grafikfähigkeiten belegen keine Unterstützung durch eine Inferenz-Runtime.
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
            Log.e("NativeInference", "Systeminformationen konnten nicht ermittelt werden.", exception);
            call.reject("Systeminformationen konnten nicht ermittelt werden.", exception);
        }
    }

    /**
     * KI-Modell laden. Da die Modelle sehr groß sind, soll immer nur das zuletzt
     * geladene Modell im Speicher behalten werden.
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
     * @param call Capacitor-Aufruf; soll nach erfolgreichem Laden ohne Ergebnis
     *             aufgelöst werden, wird aktuell aber als nicht implementiert abgelehnt
     */
    @PluginMethod
    public void loadModel(PluginCall call) {
        rejectInference(call);
    }

    /**
     * KI-Inferenz: Normalisierte Worteinbettungen für Cosinus-Vergleich.
     *
     * @param call Capacitor-Aufruf mit {@code input} (String): Eingabetext;
     *             soll ein Objekt mit {@code embedding} (Liste numerischer Einbettungen)
     *             erhalten, wird aktuell aber als nicht implementiert abgelehnt
     */
    @PluginMethod
    public void runEmbeddingPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * KI-Inferenz: Frage zu Text beantworten.
     *
     * @param call Capacitor-Aufruf mit {@code question} (String): Frage und
     *             {@code context} (String): Text-Kontext; soll ein Objekt mit
     *             {@code text} (String): Antwort erhalten, wird aktuell aber
     *             als nicht implementiert abgelehnt
     */
    @PluginMethod
    public void runQuestionAnsweringPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * KI-Inferenz: Text zusammenfassen.
     *
     * @param call Capacitor-Aufruf mit {@code input} (String): Eingabetext und
     *             {@code maxNewTokens} (Zahl): Maximale Anzahl Tokens; soll ein Objekt
     *             mit {@code text} (String): Zusammenfassung erhalten, wird aktuell
     *             aber als nicht implementiert abgelehnt
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
     *             {@code targetLanguage} (String): Zielsprache; soll ein Objekt mit
     *             {@code text} (String): Übersetzung erhalten, wird aktuell aber
     *             als nicht implementiert abgelehnt
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
     * optional {@code tokens} (Liste der zuletzt generierten Tokens) und
     * {@code text} (String mit dem zuletzt generierten Textabschnitt).
     * Das abschließende Ergebnis enthält den gesamten generierten Text.</p>
     *
     * <p>Parameter im Capacitor-Aufruf:</p>
     * <ul>
     *   <li>{@code requestId} (String): ID der Generierung und ihrer Streaming-Events</li>
     *   <li>{@code question} (String): Frage</li>
     *   <li>{@code context} (String): Text-Kontext</li>
     *   <li>{@code maxNewTokens} (Zahl): Maximale Anzahl zu generierender Tokens</li>
     *   <li>{@code maxLength} (Zahl): Maximale Länge der Antwort</li>
     *   <li>{@code doSample} (Boolean): Sampling ja/nein</li>
     *   <li>{@code temperature} (Zahl): Temperatur</li>
     *   <li>{@code repetitionPenalty} (Zahl): Bestrafung für wörtliche Wiederholungen</li>
     * </ul>
     *
     * @param call Capacitor-Aufruf; soll ein Objekt mit {@code text} (String):
     *             Generierter Text erhalten, wird aktuell aber als nicht implementiert abgelehnt
     */
    @PluginMethod
    public void runTextGenerationPipeline(PluginCall call) {
        rejectInference(call);
    }

    /**
     * Laufende Textgenerierung abbrechen. Die ursprüngliche Generierungsanfrage
     * muss dabei ebenfalls mit Teiltext oder einem Fehler abgeschlossen werden.
     *
     * @param call Capacitor-Aufruf mit {@code requestId} (String): ID der laufenden
     *             Generierung; soll ohne Ergebnis aufgelöst werden, wird aktuell
     *             aber als nicht implementiert abgelehnt
     */
    @PluginMethod
    public void stopTextGeneration(PluginCall call) {
        rejectInference(call);
    }

    /**
     * Modell- und Inferenzaufrufe ohne native Runtime explizit ablehnen.
     *
     * @param call Capacitor-Aufruf, der mit einem UNIMPLEMENTED-Fehler abgelehnt wird
     */
    private void rejectInference(PluginCall call) {
        call.unimplemented("Native Inferenz ist noch nicht implementiert (keine native Runtime).");
    }
}

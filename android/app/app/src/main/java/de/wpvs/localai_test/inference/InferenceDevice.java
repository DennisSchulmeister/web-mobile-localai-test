package de.wpvs.localai_test.inference;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtProvider;
import ai.onnxruntime.OrtSession;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Für die native Inferenz unterstützte Geräte bzw. Execution Provider. Die Werte entsprechen
 * den {@code device}-Werten, die {@code getDevices()} an die Weboberfläche meldet.
 */
public enum InferenceDevice {
    /** Standard-CPU-Provider von ONNX Runtime */
    CPU("cpu", "CPU"),

    /** Für ARM- und x86-CPUs optimierter XNNPACK-Provider */
    XNNPACK("xnnpack", "CPU (XNNPACK)");

    public final String id;
    public final String label;

    InferenceDevice(String id, String label) {
        this.id    = id;
        this.label = label;
    }

    /**
     * Auf diesem Gerät verfügbare Execution Provider ermitteln.
     *
     * @return Verfügbare Geräte, mindestens {@link #CPU}
     */
    public static List<InferenceDevice> available() {
        List<InferenceDevice> result = new ArrayList<>();
        result.add(CPU);

        try {
            EnumSet<OrtProvider> providers = OrtEnvironment.getAvailableProviders();
            if (providers.contains(OrtProvider.XNNPACK)) result.add(XNNPACK);
        } catch (Throwable ignored) {
            // Native Bibliothek nicht ladbar: Nur CPU melden
        }

        return result;
    }

    /**
     * Gerät anhand der ID suchen. Unbekannte oder leere Werte ergeben {@link #CPU}.
     *
     * @param id Geräte-ID aus der Weboberfläche
     * @return Gerät
     */
    public static InferenceDevice fromId(String id) {
        for (InferenceDevice device : values()) {
            if (device.id.equals(id)) return device;
        }

        return CPU;
    }

    /**
     * Anzahl der zu nutzenden Threads (alle verfügbaren Prozessorkerne).
     */
    static int threadCount() {
        return Math.max(1, Runtime.getRuntime().availableProcessors());
    }

    /**
     * Session-Optionen für ONNX Runtime passend zu diesem Gerät erzeugen.
     *
     * @return Neue Session-Optionen, die vom Aufrufer geschlossen werden müssen
     * @throws OrtException bei Fehlern in ONNX Runtime
     */
    public OrtSession.SessionOptions createSessionOptions() throws OrtException {
        OrtSession.SessionOptions options = new OrtSession.SessionOptions();
        options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);

        if (this == XNNPACK) {
            // XNNPACK nutzt einen eigenen Threadpool, ORT selbst soll dann nicht parallelisieren
            Map<String, String> xnnpackOptions = new HashMap<>();
            xnnpackOptions.put("intra_op_num_threads", Integer.toString(threadCount()));
            options.addXnnpack(xnnpackOptions);
            options.setIntraOpNumThreads(1);
        } else {
            options.setIntraOpNumThreads(threadCount());
        }

        return options;
    }
}

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
 * Devices and execution providers supported for native inference. The values correspond
 * to the {@code device} values reported by {@code getDevices()} to the web interface.
 */
public enum InferenceDevice {
    /** Standard-CPU-Provider von ONNX Runtime */
    CPU("cpu", "CPU"),

    /** XNNPACK provider optimized for ARM and x86 CPUs */
    XNNPACK("xnnpack", "CPU (XNNPACK)");

    public final String id;
    public final String label;

    InferenceDevice(String id, String label) {
        this.id    = id;
        this.label = label;
    }

    /**
     * Get the execution providers available on this device.
     *
     * @return Available devices, including at least {@link #CPU}
     */
    public static List<InferenceDevice> available() {
        List<InferenceDevice> result = new ArrayList<>();
        result.add(CPU);

        try {
            EnumSet<OrtProvider> providers = OrtEnvironment.getAvailableProviders();
            if (providers.contains(OrtProvider.XNNPACK)) result.add(XNNPACK);
        } catch (Throwable ignored) {
            // Native library could not be loaded: report CPU only.
        }

        return result;
    }

    /**
     * Find a device by ID. Unknown or empty values resolve to {@link #CPU}.
     *
     * @param id Device ID from the web interface
     * @return Device
     */
    public static InferenceDevice fromId(String id) {
        for (InferenceDevice device : values()) {
            if (device.id.equals(id)) return device;
        }

        return CPU;
    }

    /**
     * Number of threads to use (all available processor cores).
     */
    static int threadCount() {
        return Math.max(1, Runtime.getRuntime().availableProcessors());
    }

    /**
     * Create ONNX Runtime session options for this device.
     *
     * @return New session options that must be closed by the caller
     * @throws OrtException bei Fehlern in ONNX Runtime
     */
    public OrtSession.SessionOptions createSessionOptions() throws OrtException {
        OrtSession.SessionOptions options = new OrtSession.SessionOptions();
        options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);

        if (this == XNNPACK) {
            // XNNPACK uses its own thread pool, so ORT itself should not parallelize.
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

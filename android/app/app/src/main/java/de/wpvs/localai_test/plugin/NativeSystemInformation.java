package de.wpvs.localai_test.plugin;

import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.opengl.EGL14;
import android.opengl.EGLConfig;
import android.opengl.EGLContext;
import android.opengl.EGLDisplay;
import android.opengl.EGLSurface;
import android.opengl.GLES20;
import android.os.Build;
import android.os.Debug;
import android.os.Process;
import android.text.TextUtils;
import android.util.Log;
import android.webkit.WebView;
import ai.onnxruntime.OrtEnvironment;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.util.Locale;

import de.wpvs.localai_test.BuildConfig;
import de.wpvs.localai_test.inference.InferenceDevice;

/**
 * System diagnostics for comparing browser and native inference.
 * The GPU query describes the OpenGL ES renderer, not its suitability for AI.
 */
final class NativeSystemInformation {
    private static final String TAG = "NativeInference";

    /**
     * Prevent instantiation of this static utility class.
     */
    private NativeSystemInformation() {}

    /**
     * Add the ONNX Runtime and ONNX Runtime GenAI versions and the available
     * execution providers.
     *
     * @param information List to which entries are appended
     */
    private static void addRuntimeInformation(JSArray information) {
        add(information, "onnxRuntimeVersion", "bi-box", "ONNX Runtime",       BuildConfig.ONNXRUNTIME_VERSION);
        add(information, "onnxRuntimeGenaiVersion", "bi-box", "ONNX Runtime GenAI", BuildConfig.ONNXRUNTIME_GENAI_VERSION);

        try {
            add(information, "executionProviders", "bi-gpu-card", "Execution Provider", OrtEnvironment.getAvailableProviders().toString());
        } catch (Throwable throwable) {
            Log.w(TAG, "Execution Provider konnten nicht ermittelt werden.", throwable);
            add(information, "executionProviders", "bi-gpu-card", "Execution Provider", "Nicht ermittelbar: " + throwable.getMessage());
        }

        StringBuilder devices = new StringBuilder();

        for (InferenceDevice device : InferenceDevice.available()) {
            if (devices.length() > 0) devices.append(", ");
            devices.append(device.label);
        }

        add(information, "inferenceDevices", "bi-cpu", "Native Inferenz-Geräte", devices.toString());
    }

    /**
     * Collect device, operating system, memory, and graphics diagnostics.
     * Memory values are measured when this method is called. GPU query errors
     * are returned as diagnostic entries and logged.
     *
     * @param context Android context for system services
     * @return List of diagnostic objects with {@code field}, {@code icon}, {@code label}, and {@code text}
     * @throws IllegalStateException if the ActivityManager is unavailable
     */
    static JSArray collect(Context context) {
        JSArray information = new JSArray();

        // Backend and device hardware.
        add(information, "backendType",    "bi-terminal",    "Backend-Typ",         "Android (Native)");
        addRuntimeInformation(information);
        add(information, "manufacturerModel", "bi-phone", "Hersteller / Modell", Build.MANUFACTURER + " / " + Build.MODEL);
        add(information, "hardwareBoard",      "bi-cpu",   "Hardware / Board",    Build.HARDWARE + " / " + Build.BOARD);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            add(information, "soc", "bi-cpu", "SoC", Build.SOC_MANUFACTURER + " / " + Build.SOC_MODEL);
        }

        // Operating system and process architecture.
        add(information, "androidVersion",       "bi-display",     "Android-Version",          Build.VERSION.RELEASE);
        add(information, "androidApiLevel",      "bi-info-circle", "Android API-Level",        String.valueOf(Build.VERSION.SDK_INT));
        add(information, "androidSecurityPatch", "bi-info-circle", "Android Security Patch",   Build.VERSION.SECURITY_PATCH);
        add(information, "supportedAbis",        "bi-cpu",         "Unterstützte ABIs",        TextUtils.join(", ", Build.SUPPORTED_ABIS));
        add(information, "processArchitecture",  "bi-cpu",         "Prozessarchitektur",       Process.is64Bit() ? "64 Bit" : "32 Bit");
        add(information, "hardwareConcurrency",  "bi-cpu",         "Hardware-Nebenläufigkeit", Runtime.getRuntime().availableProcessors() + " für den Prozess verfügbare CPU-Kerne");

        // System memory and low-memory status.
        ActivityManager manager = context.getSystemService(ActivityManager.class);

        if (manager == null) {
            throw new IllegalStateException("ActivityManager nicht verfügbar.");
        }

        ActivityManager.MemoryInfo memory = new ActivityManager.MemoryInfo();
        manager.getMemoryInfo(memory);

        add(information, "totalSystemRam",     "bi-memory", "System-RAM gesamt",    formatBytes(memory.totalMem));
        add(information, "availableSystemRam", "bi-memory", "System-RAM verfügbar", formatBytes(memory.availMem));
        add(information, "lowMemoryThreshold", "bi-memory", "Low-Memory-Schwelle",  formatBytes(memory.threshold));
        add(information, "lowMemory",          "bi-memory", "Low-Memory-Zustand",   memory.lowMemory ? "Ja" : "Nein");
        add(information, "lowRamDevice",       "bi-memory", "Low-RAM-Gerät",        manager.isLowRamDevice() ? "Ja" : "Nein");

        // Heap limits and current allocations of the app process.
        add(information, "javaHeapMemoryClass", "bi-memory", "Android Memory Class (Java-Heap)", manager.getMemoryClass() + " MiB");
        add(information, "javaHeapMaximum",     "bi-memory", "Java-Heap Maximum",                formatBytes(Runtime.getRuntime().maxMemory()));
        add(information, "javaHeapAllocated",   "bi-memory", "Java-Heap belegt",                 formatBytes(Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()));
        add(information, "nativeHeapAllocated", "bi-memory", "Nativer Heap belegt",              formatBytes(Debug.getNativeHeapAllocatedSize()));

        // PSS counts shared memory pages proportionally.
        Debug.MemoryInfo processMemory = new Debug.MemoryInfo();
        Debug.getMemoryInfo(processMemory);

        add(information, "processRamPss", "bi-memory", "Prozess-RAM PSS", formatBytes(processMemory.getTotalPss() * 1024L));

        // WebView version for comparison with browser execution.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PackageInfo webView = WebView.getCurrentWebViewPackage();
            add(information, "androidWebView", "bi-info-circle", "Android WebView", webView == null ? "Nicht verfügbar (noch nicht geladen)" : webView.packageName + " / " + webView.versionName);
        }

        // Graphics diagnostics in a separate temporary context.
        collectGpu(information);

        return information;
    }

    /**
     * Format a memory size using binary units and the exact byte count.
     *
     * @param bytes Memory size in bytes
     * @return Locale-independent representation in MiB, GiB, and bytes
     */
    static String formatBytes(long bytes) {
        return String.format(Locale.ROOT, "%.2f MiB (%.2f GiB; %d Bytes)",
            bytes / 1048576.0, bytes / 1073741824.0, bytes);
    }

    /**
     * Append a diagnostic entry in the shared frontend format.
     *
     * @param information Target data for diagnostics
     * @param field Technical name of the diagnostic field
     * @param icon Bootstrap icon CSS class
     * @param label Display name of the value
     * @param text Value to display
     */
    private static void add(JSArray information, String field, String icon, String label, String text) {
        JSObject entry = new JSObject();
        entry.put("field", field);
        entry.put("icon",  icon);
        entry.put("label", label);
        entry.put("text",  text);

        information.put(entry);
    }

    /**
     * Report failed EGL operations with their error code.
     *
     * @param success Result of the EGL operation
     * @param operation Name of the operation performed
     * @throws IllegalStateException if the EGL operation failed
     */
    private static void requireEgl(boolean success, String operation) {
        if (!success) {
            throw new IllegalStateException(operation + ": EGL-Fehler 0x" + Integer.toHexString(EGL14.eglGetError()));
        }
    }

    /**
     * Log EGL cleanup failures without preventing further resource releases.
     *
     * @param success Result of the EGL operation
     * @param operation Name of the release or restoration operation performed
     */
    private static void checkCleanup(boolean success, String operation) {
        if (!success) {
            Log.w(TAG, operation + ": EGL-Fehler 0x" + Integer.toHexString(EGL14.eglGetError()));
        }
    }

    /**
     * Use a separate temporary GLES 2 context without a visible surface.
     * Restore any previously active EGL context.
     * Log query failures and append them as diagnostic entries.
     *
     * @param information Target data for the renderer, vendor, version, and texture limit
     */
    private static void collectGpu(JSArray information) {
        // Save the previous thread-local EGL state for restoration.
        EGLDisplay previousDisplay = EGL14.eglGetCurrentDisplay();
        EGLContext previousContext = EGL14.eglGetCurrentContext();
        EGLSurface previousDraw    = EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW);
        EGLSurface previousRead    = EGL14.eglGetCurrentSurface(EGL14.EGL_READ);

        // Clean up deliberately even if initialization only partially succeeds.
        EGLDisplay display  = EGL14.EGL_NO_DISPLAY;
        EGLContext context  = EGL14.EGL_NO_CONTEXT;
        EGLSurface surface  = EGL14.EGL_NO_SURFACE;

        boolean initialized = false;
        boolean current     = false;

        try {
            // Initialize EGL and choose a GLES 2 configuration that supports pbuffers.
            display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY);
            requireEgl(!display.equals(EGL14.EGL_NO_DISPLAY), "eglGetDisplay");

            int[] version = new int[2];
            requireEgl(EGL14.eglInitialize(display, version, 0, version, 1), "eglInitialize");
            initialized = true;

            EGLConfig[] configs = new EGLConfig[1];
            int[] count = new int[1];

            int[] attributes = {
                EGL14.EGL_SURFACE_TYPE, EGL14.EGL_PBUFFER_BIT,
                EGL14.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
                EGL14.EGL_NONE,
            };

            requireEgl(EGL14.eglChooseConfig(display, attributes, 0, configs, 0, 1, count, 0), "eglChooseConfig");

            if (count[0] == 0) {
                throw new IllegalStateException("Keine EGL-Konfiguration für OpenGL ES 2 verfügbar.");
            }

            // A pbuffer allows queries without a visible Android surface.
            context = EGL14.eglCreateContext(display, configs[0], EGL14.EGL_NO_CONTEXT, new int[] {EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL14.EGL_NONE}, 0);
            requireEgl(!context.equals(EGL14.EGL_NO_CONTEXT), "eglCreateContext");

            surface = EGL14.eglCreatePbufferSurface(display, configs[0], new int[] {EGL14.EGL_WIDTH, 1, EGL14.EGL_HEIGHT, 1, EGL14.EGL_NONE}, 0);
            requireEgl(!surface.equals(EGL14.EGL_NO_SURFACE), "eglCreatePbufferSurface");

            requireEgl(EGL14.eglMakeCurrent(display, surface, surface, context), "eglMakeCurrent");
            current = true;

            // Read renderer information and the texture limit from the active context.
            String vendor        = GLES20.glGetString(GLES20.GL_VENDOR);
            String renderer      = GLES20.glGetString(GLES20.GL_RENDERER);
            String glVersion     = GLES20.glGetString(GLES20.GL_VERSION);
            int[] maxTextureSize = new int[1];

            GLES20.glGetIntegerv(GLES20.GL_MAX_TEXTURE_SIZE, maxTextureSize, 0);

            int error = GLES20.glGetError();
            if (error != GLES20.GL_NO_ERROR || vendor == null || renderer == null || glVersion == null) {
                throw new IllegalStateException("OpenGL-ES-Abfrage fehlgeschlagen: 0x" + Integer.toHexString(error));
            }

            add(information, "gpuVendor",      "bi-gpu-card", "GPU-Anbieter",      vendor);
            add(information, "gpuRenderer",    "bi-gpu-card", "GPU-Renderer",      renderer);
            add(information, "openGlEsVersion", "bi-gpu-card", "OpenGL-ES-Version", glVersion);
            add(information, "maxTextureSize", "bi-gpu-card", "Max Texture Size",  maxTextureSize[0] + " Pixel pro Dimension");
        } catch (RuntimeException exception) {
            // Keep the remaining system diagnostics available if graphics queries fail.
            Log.w(TAG, "GPU-Informationen konnten nicht ermittelt werden.", exception);
            add(information, "gpuInformation", "bi-gpu-card", "GPU-Informationen", "Nicht verfügbar: " + exception.getMessage());
        } finally {
            // First restore the previous context or unbind the current one.
            if (current) {
                if (!previousContext.equals(EGL14.EGL_NO_CONTEXT)) {
                    checkCleanup(EGL14.eglMakeCurrent(previousDisplay, previousDraw, previousRead, previousContext), "EGL-Kontext wiederherstellen");
                } else {
                    checkCleanup(EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT), "EGL-Kontext freigeben");
                }
            }

            // Then release temporary EGL resources in reverse order.
            if (!surface.equals(EGL14.EGL_NO_SURFACE)) {
                checkCleanup(EGL14.eglDestroySurface(display, surface), "eglDestroySurface");
            }

            if (!context.equals(EGL14.EGL_NO_CONTEXT)) {
                checkCleanup(EGL14.eglDestroyContext(display, context), "eglDestroyContext");
            }
            
            if (initialized) {
                checkCleanup(EGL14.eglTerminate(display), "eglTerminate");
            }
        }
    }
}

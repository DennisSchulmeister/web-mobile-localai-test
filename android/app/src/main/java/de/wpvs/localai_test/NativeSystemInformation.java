package de.wpvs.localai_test;

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
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.util.Locale;

/**
 * Systemdiagnose für den Vergleich von Browser- und nativer Inferenz.
 * Die GPU-Abfrage beschreibt den OpenGL-ES-Renderer, nicht dessen Nutzbarkeit für KI.
 */
final class NativeSystemInformation {
    private static final String TAG = "NativeInference";

    /**
     * Instanziierung der statischen Hilfsklasse verhindern.
     */
    private NativeSystemInformation() {}

    /**
     * Geräte-, Betriebssystem-, Speicher- und Grafikdiagnose zusammenstellen.
     * Speicherwerte werden zum Zeitpunkt des Aufrufs ermittelt. Fehler der
     * GPU-Abfrage werden als Diagnoseeintrag zurückgegeben und protokolliert.
     *
     * @param context Android-Kontext für Systemdienste
     * @return Liste von Diagnoseobjekten mit {@code icon}, {@code label} und {@code text}
     * @throws IllegalStateException wenn der ActivityManager nicht verfügbar ist
     */
    static JSArray collect(Context context) {
        JSArray information = new JSArray();

        // Backend und Gerätehardware
        add(information, "bi-terminal",    "Backend-Typ",         "Android (Native)");
        add(information, "bi-info-circle", "Native Inferenz",     "Noch nicht implementiert");
        add(information, "bi-phone",       "Hersteller / Modell", Build.MANUFACTURER + " / " + Build.MODEL);
        add(information, "bi-cpu",         "Hardware / Board",    Build.HARDWARE + " / " + Build.BOARD);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            add(information, "bi-cpu", "SoC", Build.SOC_MANUFACTURER + " / " + Build.SOC_MODEL);
        }

        // Betriebssystem und Prozessarchitektur
        add(information, "bi-display",     "Android-Version",          Build.VERSION.RELEASE);
        add(information, "bi-info-circle", "Android API-Level",        String.valueOf(Build.VERSION.SDK_INT));
        add(information, "bi-info-circle", "Android Security Patch",   Build.VERSION.SECURITY_PATCH);
        add(information, "bi-cpu",         "Unterstützte ABIs",        TextUtils.join(", ", Build.SUPPORTED_ABIS));
        add(information, "bi-cpu",         "Prozessarchitektur",       Process.is64Bit() ? "64 Bit" : "32 Bit");
        add(information, "bi-cpu",         "Hardware-Nebenläufigkeit", Runtime.getRuntime().availableProcessors() + " für den Prozess verfügbare CPU-Kerne");

        // Systemweiter Speicher und Low-Memory-Zustand
        ActivityManager manager = context.getSystemService(ActivityManager.class);

        if (manager == null) {
            throw new IllegalStateException("ActivityManager nicht verfügbar.");
        }

        ActivityManager.MemoryInfo memory = new ActivityManager.MemoryInfo();
        manager.getMemoryInfo(memory);

        add(information, "bi-memory", "System-RAM gesamt",    formatBytes(memory.totalMem));
        add(information, "bi-memory", "System-RAM verfügbar", formatBytes(memory.availMem));
        add(information, "bi-memory", "Low-Memory-Schwelle",  formatBytes(memory.threshold));
        add(information, "bi-memory", "Low-Memory-Zustand",   memory.lowMemory ? "Ja" : "Nein");
        add(information, "bi-memory", "Low-RAM-Gerät",        manager.isLowRamDevice() ? "Ja" : "Nein");

        // Heap-Grenzen und aktuelle Allokationen des App-Prozesses
        add(information, "bi-memory", "Android Memory Class (Java-Heap)", manager.getMemoryClass() + " MiB");
        add(information, "bi-memory", "Java-Heap Maximum",                formatBytes(Runtime.getRuntime().maxMemory()));
        add(information, "bi-memory", "Java-Heap belegt",                 formatBytes(Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()));
        add(information, "bi-memory", "Nativer Heap belegt",              formatBytes(Debug.getNativeHeapAllocatedSize()));

        // PSS rechnet gemeinsam genutzte Speicherseiten nur anteilig an.
        Debug.MemoryInfo processMemory = new Debug.MemoryInfo();
        Debug.getMemoryInfo(processMemory);

        add(information, "bi-memory", "Prozess-RAM PSS", formatBytes(processMemory.getTotalPss() * 1024L));

        // WebView-Version für den Vergleich mit der Browser-Ausführung
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PackageInfo webView = WebView.getCurrentWebViewPackage();
            add(information, "bi-info-circle", "Android WebView", webView == null ? "Nicht verfügbar (noch nicht geladen)" : webView.packageName + " / " + webView.versionName);
        }

        // Grafikdiagnose in einem eigenen temporären Kontext
        collectGpu(information);

        return information;
    }

    /**
     * Speichergröße mit binären Einheiten und exakter Byte-Anzahl formatieren.
     *
     * @param bytes Speichergröße in Bytes
     * @return Locale-unabhängige Darstellung in MiB, GiB und Bytes
     */
    static String formatBytes(long bytes) {
        return String.format(Locale.ROOT, "%.2f MiB (%.2f GiB; %d Bytes)",
            bytes / 1048576.0, bytes / 1073741824.0, bytes);
    }

    /**
     * Einen Diagnoseeintrag im gemeinsamen Frontend-Format anhängen.
     *
     * @param information Zieldaten für die Diagnose
     * @param icon CSS-Klasse des Bootstrap-Icons
     * @param label Anzeigename des Wertes
     * @param text Darzustellender Wert
     */
    private static void add(JSArray information, String icon, String label, String text) {
        JSObject entry = new JSObject();
        entry.put("icon",  icon);
        entry.put("label", label);
        entry.put("text",  text);

        information.put(entry);
    }

    /**
     * Fehlgeschlagene EGL-Operationen mit ihrem Fehlercode melden.
     *
     * @param success Ergebnis der EGL-Operation
     * @param operation Name der ausgeführten Operation
     * @throws IllegalStateException wenn die EGL-Operation fehlgeschlagen ist
     */
    private static void requireEgl(boolean success, String operation) {
        if (!success) {
            throw new IllegalStateException(operation + ": EGL-Fehler 0x" + Integer.toHexString(EGL14.eglGetError()));
        }
    }

    /**
     * Fehler beim EGL-Aufräumen protokollieren, ohne weitere Freigaben zu verhindern.
     *
     * @param success Ergebnis der EGL-Operation
     * @param operation Name der ausgeführten Freigabe oder Wiederherstellung
     */
    private static void checkCleanup(boolean success, String operation) {
        if (!success) {
            Log.w(TAG, operation + ": EGL-Fehler 0x" + Integer.toHexString(EGL14.eglGetError()));
        }
    }

    /**
     * Eigenen temporären GLES-2-Kontext ohne sichtbare Oberfläche verwenden.
     * Ein zuvor aktiver EGL-Kontext wird wiederhergestellt.
     * Abfragefehler werden protokolliert und als Diagnoseeintrag angehängt.
     *
     * @param information Zieldaten für Renderer, Anbieter, Version und Texturgrenze
     */
    private static void collectGpu(JSArray information) {
        // Vorherigen threadlokalen EGL-Zustand für die Wiederherstellung sichern.
        EGLDisplay previousDisplay = EGL14.eglGetCurrentDisplay();
        EGLContext previousContext = EGL14.eglGetCurrentContext();
        EGLSurface previousDraw    = EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW);
        EGLSurface previousRead    = EGL14.eglGetCurrentSurface(EGL14.EGL_READ);

        // Auch bei teilweise fehlgeschlagener Initialisierung gezielt aufräumen.
        EGLDisplay display  = EGL14.EGL_NO_DISPLAY;
        EGLContext context  = EGL14.EGL_NO_CONTEXT;
        EGLSurface surface  = EGL14.EGL_NO_SURFACE;

        boolean initialized = false;
        boolean current     = false;

        try {
            // EGL initialisieren und eine Pbuffer-fähige GLES-2-Konfiguration wählen.
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

            // Ein Pbuffer erlaubt die Abfrage ohne sichtbare Android-Oberfläche.
            context = EGL14.eglCreateContext(display, configs[0], EGL14.EGL_NO_CONTEXT, new int[] {EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL14.EGL_NONE}, 0);
            requireEgl(!context.equals(EGL14.EGL_NO_CONTEXT), "eglCreateContext");

            surface = EGL14.eglCreatePbufferSurface(display, configs[0], new int[] {EGL14.EGL_WIDTH, 1, EGL14.EGL_HEIGHT, 1, EGL14.EGL_NONE}, 0);
            requireEgl(!surface.equals(EGL14.EGL_NO_SURFACE), "eglCreatePbufferSurface");

            requireEgl(EGL14.eglMakeCurrent(display, surface, surface, context), "eglMakeCurrent");
            current = true;

            // Rendererinformationen und Texturgrenze aus dem aktiven Kontext lesen.
            String vendor        = GLES20.glGetString(GLES20.GL_VENDOR);
            String renderer      = GLES20.glGetString(GLES20.GL_RENDERER);
            String glVersion     = GLES20.glGetString(GLES20.GL_VERSION);
            int[] maxTextureSize = new int[1];

            GLES20.glGetIntegerv(GLES20.GL_MAX_TEXTURE_SIZE, maxTextureSize, 0);

            int error = GLES20.glGetError();
            if (error != GLES20.GL_NO_ERROR || vendor == null || renderer == null || glVersion == null) {
                throw new IllegalStateException("OpenGL-ES-Abfrage fehlgeschlagen: 0x" + Integer.toHexString(error));
            }

            add(information, "bi-gpu-card", "GPU-Anbieter",      vendor);
            add(information, "bi-gpu-card", "GPU-Renderer",      renderer);
            add(information, "bi-gpu-card", "OpenGL-ES-Version", glVersion);
            add(information, "bi-gpu-card", "Max Texture Size",  maxTextureSize[0] + " Pixel pro Dimension");
        } catch (RuntimeException exception) {
            // Die übrige Systemdiagnose bleibt bei Grafikfehlern verfügbar.
            Log.w(TAG, "GPU-Informationen konnten nicht ermittelt werden.", exception);
            add(information, "bi-gpu-card", "GPU-Informationen", "Nicht verfügbar: " + exception.getMessage());
        } finally {
            // Zuerst den vorherigen Kontext wiederherstellen oder den eigenen lösen.
            if (current) {
                if (!previousContext.equals(EGL14.EGL_NO_CONTEXT)) {
                    checkCleanup(EGL14.eglMakeCurrent(previousDisplay, previousDraw, previousRead, previousContext), "EGL-Kontext wiederherstellen");
                } else {
                    checkCleanup(EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT), "EGL-Kontext freigeben");
                }
            }

            // Danach die temporären EGL-Ressourcen in umgekehrter Reihenfolge freigeben.
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

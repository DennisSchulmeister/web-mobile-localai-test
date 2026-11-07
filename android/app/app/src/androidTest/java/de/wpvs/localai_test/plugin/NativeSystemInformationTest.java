package de.wpvs.localai_test.plugin;

import static org.junit.Assert.*;

import android.content.Context;
import android.opengl.EGL14;
import android.opengl.EGLContext;
import android.opengl.EGLDisplay;
import android.os.Build;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.getcapacitor.JSArray;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class NativeSystemInformationTest {
    @Test
    public void reportsSystemInformationAndGpuResultWithConsistentShape() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        EGLContext previousContext = EGL14.eglGetCurrentContext();
        EGLDisplay previousDisplay = EGL14.eglGetCurrentDisplay();
        for (int attempt = 0; attempt < 2; attempt++) {
            JSArray information = NativeSystemInformation.collect(context);
            assertEquals(previousContext, EGL14.eglGetCurrentContext());
            assertEquals(previousDisplay, EGL14.eglGetCurrentDisplay());
            Set<String> labels = new HashSet<>();
            for (int i = 0; i < information.length(); i++) {
                JSONObject entry = information.getJSONObject(i);
                assertEquals(3, entry.length());
                assertFalse(entry.getString("icon").isEmpty());
                assertFalse(entry.getString("text").isEmpty());
                assertTrue(labels.add(entry.getString("label")));
                if (entry.getString("label").equals("Android API-Level")) {
                    assertEquals(String.valueOf(Build.VERSION.SDK_INT), entry.getString("text"));
                }
            }
            assertTrue(labels.contains("Android-Version"));
            assertTrue(labels.contains("Android API-Level"));
            assertTrue(labels.contains("System-RAM gesamt"));
            assertTrue(labels.contains("System-RAM verfügbar (Momentaufnahme)"));
            assertTrue(labels.contains("Java-Heap Maximum"));
            assertTrue(labels.contains("Prozess-RAM PSS (Momentaufnahme)"));
            assertFalse(labels.contains("GPU / KI-Beschleunigung"));
            assertTrue(labels.contains("GPU-Renderer (ggf. Software / Emulator)")
                || labels.contains("GPU-Informationen"));
        }
    }
}

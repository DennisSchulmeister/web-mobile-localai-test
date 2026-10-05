package de.wpvs.localai_test;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * Start-Aktivität
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Eigene Capacitor-Plugins registrieren
        registerPlugin(NativeInferencePlugin.class);

        super.onCreate(savedInstanceState);
    }
}

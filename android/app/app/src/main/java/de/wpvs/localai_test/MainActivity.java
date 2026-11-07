package de.wpvs.localai_test;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

import de.wpvs.localai_test.plugin.NativeInferencePlugin;

/**
 * Main activity.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register own Capacitor plugins
        registerPlugin(NativeInferencePlugin.class);

        super.onCreate(savedInstanceState);
    }
}

package de.wpvs.localai_test.plugin;

import static org.junit.Assert.assertEquals;

import java.util.Locale;
import org.junit.Test;

public class NativeSystemInformationTest {
    @Test
    public void formatsMemoryWithBinaryUnitsAndExactBytes() {
        assertEquals("0.00 MiB (0.00 GiB; 0 Bytes)", NativeSystemInformation.formatBytes(0));
        assertEquals("1024.00 MiB (1.00 GiB; 1073741824 Bytes)",
            NativeSystemInformation.formatBytes(1073741824L));
        assertEquals("8192.00 MiB (8.00 GiB; 8589934592 Bytes)",
            NativeSystemInformation.formatBytes(8589934592L));
    }

    @Test
    public void formatsMemoryIndependentlyOfDeviceLocale() {
        Locale original = Locale.getDefault();
        try {
            Locale.setDefault(Locale.GERMANY);
            assertEquals("1.50 MiB (0.00 GiB; 1572864 Bytes)",
                NativeSystemInformation.formatBytes(1572864L));
        } finally {
            Locale.setDefault(original);
        }
    }
}

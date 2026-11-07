import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId:   "de.wpvs.localai_test",
  appName: "Local AI Test",
  webDir:  "../.capacitor/www",
  android: {
    path: "app"
  }
};

export default config;

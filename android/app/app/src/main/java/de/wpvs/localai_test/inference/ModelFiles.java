package de.wpvs.localai_test.inference;

import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.util.Log;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Bereitstellung der Modelldateien im Dateisystem, da ONNX Runtime und ORT GenAI
 * die Modelle aus echten Dateien laden. Die Dateien werden wie bei Transformers.js
 * zuerst lokal (mit der App ausgelieferte Assets) und dann bei Hugging Face gesucht.
 *
 * <p>Ziel ist {@code noBackupFilesDir/models/<modelId>/}. Mit der App ausgelieferte
 * Dateien werden nach jedem App-Update neu kopiert. Heruntergeladene Dateien bleiben
 * erhalten.</p>
 */
public final class ModelFiles {
    private static final String TAG = "NativeInference";

    /**
     * Verzeichnis der Web-Assets innerhalb des APK (Capacitor {@code webDir}).
     */
    private static final String ASSET_ROOT = "public";

    /**
     * Basis-URL für Downloads, entspricht {@code env.remoteHost} von Transformers.js.
     */
    private static final String REMOTE_HOST = "https://huggingface.co/";

    /**
     * Datei mit dem Versionsstand der aus den Assets kopierten Dateien.
     */
    private static final String STAMP_FILE = ".bundle-version";

    private final Context context;
    private final String assetDir;

    /**
     * @param context  Android-Kontext für Assets und Dateisystem
     * @param assetDir Modellverzeichnis innerhalb der Web-Assets, zum Beispiel
     *                 {@code _generated/models} aus {@code config.models.downloadDir}
     */
    public ModelFiles(Context context, String assetDir) {
        this.context  = context;
        this.assetDir = trimSlashes(assetDir == null || assetDir.isEmpty() ? "_generated/models" : assetDir);
    }

    /**
     * Dateinamenszusatz für einen Datentyp, wie {@code DEFAULT_DTYPE_SUFFIX_MAPPING}
     * von Transformers.js.
     *
     * @param dtype Datentyp, zum Beispiel {@code q4} oder {@code fp32}
     * @return Zusatz für den Dateinamen der ONNX-Datei
     * @throws IllegalArgumentException bei unbekanntem Datentyp
     */
    static String dtypeSuffix(String dtype) {
        if (dtype == null || dtype.isEmpty() || dtype.equals("auto")) return "";

        switch (dtype) {
            case "fp32":  return "";
            case "fp16":  return "_fp16";
            case "int8":  return "_int8";
            case "uint8": return "_uint8";
            case "q8":    return "_quantized";
            case "q4":    return "_q4";
            case "q4f16": return "_q4f16";
            case "bnb4":  return "_bnb4";
            default:      throw new IllegalArgumentException("Unbekannter Datentyp: " + dtype);
        }
    }

    /**
     * Relative Pfade der ONNX-Datei und ihrer externen Gewichte ermitteln. Die Anzahl der
     * Gewichtsdateien steht wie bei Transformers.js in {@code transformers.js_config.use_external_data_format}
     * der {@code config.json}, entweder global oder je Dateiname.
     *
     * @param config   Inhalt der {@code config.json}
     * @param baseName Basisname der ONNX-Datei, zum Beispiel {@code model}
     * @param dtype    Datentyp
     * @return Erst die ONNX-Datei, danach die externen Gewichtsdateien
     */
    public static List<String> onnxFiles(JSONObject config, String baseName, String dtype) {
        String fileName = baseName + dtypeSuffix(dtype) + ".onnx";
        String path     = "onnx/" + fileName;

        List<String> files = new ArrayList<>();
        files.add(path);

        JSONObject jsConfig = config.optJSONObject("transformers.js_config");
        Object format = jsConfig == null ? null : jsConfig.opt("use_external_data_format");

        if (format instanceof JSONObject) {
            JSONObject map = (JSONObject) format;
            format = map.has(fileName) ? map.opt(fileName) : map.opt(baseName);
        }

        int chunks = 0;

        if (format instanceof Boolean) {
            chunks = (Boolean) format ? 1 : 0;
        } else if (format instanceof Number) {
            chunks = ((Number) format).intValue();
        }

        for (int i = 0; i < chunks; i++) {
            files.add(path + "_data" + (i == 0 ? "" : "_" + i));
        }

        return files;
    }

    /**
     * Modellverzeichnis im Dateisystem.
     *
     * @param modelId Modell-ID, zum Beispiel {@code onnx-community/Qwen3-0.6B-ONNX}
     * @return Verzeichnis (muss nicht existieren)
     * @throws IllegalArgumentException bei ungültiger Modell-ID
     */
    File modelDir(String modelId) {
        if (modelId == null || modelId.isEmpty() || modelId.startsWith("/") || modelId.contains("..") || modelId.contains("\\")) {
            throw new IllegalArgumentException("Ungültige Modell-ID: " + modelId);
        }

        return new File(new File(context.getNoBackupFilesDir(), "models"), modelId);
    }

    /**
     * Sicherstellen, dass alle Dateien eines Modells lokal vorhanden sind.
     *
     * @param modelId  Modell-ID
     * @param required Relative Pfade der benötigten Dateien
     * @param optional Relative Pfade optionaler Dateien, die fehlen dürfen
     * @return Modellverzeichnis
     * @throws IOException wenn eine benötigte Datei weder in den Assets noch online verfügbar ist
     */
    public File ensure(String modelId, List<String> required, List<String> optional) throws IOException {
        File dir = modelDir(modelId);

        if (!dir.isDirectory() && !dir.mkdirs()) {
            throw new IOException("Verzeichnis konnte nicht angelegt werden: " + dir);
        }

        File stampFile = new File(dir, STAMP_FILE);
        String stamp   = bundleVersion();
        boolean fresh  = stamp.equals(readText(stampFile));

        for (String file : required) ensureFile(modelId, dir, file, fresh, true);
        for (String file : optional) ensureFile(modelId, dir, file, fresh, false);

        writeText(stampFile, stamp);
        return dir;
    }

    /**
     * Inhalt einer optionalen JSON-Datei im Modellverzeichnis lesen.
     *
     * @param file Datei
     * @return JSON-Objekt oder ein leeres Objekt, wenn die Datei fehlt
     * @throws IOException bei Lesefehlern
     * @throws JSONException bei ungültigem JSON
     */
    public static JSONObject readJson(File file) throws IOException, JSONException {
        if (!file.isFile()) return new JSONObject();
        return new JSONObject(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8));
    }

    /**
     * Text in eine Datei schreiben.
     *
     * @param file Datei
     * @param text Inhalt
     * @throws IOException bei Schreibfehlern
     */
    public static void writeText(File file, String text) throws IOException {
        Files.write(file.toPath(), text.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Einzelne Datei aus den Assets kopieren oder herunterladen. Aus den Assets wird nach
     * einem App-Update erneut kopiert. Heruntergeladene Dateien werden wiederverwendet.
     */
    private void ensureFile(String modelId, File dir, String file, boolean fresh, boolean required) throws IOException {
        File target = new File(dir, file);

        if (target.isFile() && fresh) return;

        File parent = target.getParentFile();

        if (parent != null && !parent.isDirectory() && !parent.mkdirs()) {
            throw new IOException("Verzeichnis konnte nicht angelegt werden: " + parent);
        }

        String assetPath = ASSET_ROOT + "/" + assetDir + "/" + modelId + "/" + file;
        AssetManager assets = context.getAssets();

        if (target.isFile() && target.length() == uncompressedAssetLength(assets, assetPath)) return;

        try (InputStream input = assets.open(assetPath, AssetManager.ACCESS_STREAMING)) {
            Log.i(TAG, "Kopiere Modelldatei aus der App: " + assetPath);
            copy(input, target);
            return;
        } catch (FileNotFoundException ignored) {
            // Nicht mit der App ausgeliefert
        }

        if (target.isFile()) return;

        String url = REMOTE_HOST + encodePath(modelId) + "/resolve/main/" + encodePath(file) + "?download=true";
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(30_000);
        connection.setReadTimeout(60_000);
        connection.setInstanceFollowRedirects(true);

        try {
            int status = connection.getResponseCode();

            if (status == HttpURLConnection.HTTP_NOT_FOUND && !required) return;

            if (status != HttpURLConnection.HTTP_OK) {
                throw new IOException(String.format(Locale.ROOT,
                    "Modelldatei %s konnte nicht geladen werden (HTTP %d): %s", file, status, url));
            }

            Log.i(TAG, "Lade Modelldatei herunter: " + url);

            try (InputStream input = connection.getInputStream()) {
                copy(input, target);
            }
        } finally {
            connection.disconnect();
        }
    }

    /**
     * Daten in eine temporäre Datei schreiben und diese erst nach Abschluss umbenennen,
     * damit abgebrochene Kopien nicht als vollständige Datei gelten.
     */
    private static void copy(InputStream input, File target) throws IOException {
        File part = new File(target.getPath() + ".part");
        byte[] buffer = new byte[1024 * 1024];

        try (OutputStream output = new FileOutputStream(part)) {
            int read;

            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
        } catch (IOException exception) {
            //noinspection ResultOfMethodCallIgnored
            part.delete();
            throw exception;
        }

        if (target.exists() && !target.delete()) {
            throw new IOException("Datei konnte nicht ersetzt werden: " + target);
        }

        if (!part.renameTo(target)) {
            throw new IOException("Datei konnte nicht umbenannt werden: " + part);
        }
    }

    /**
     * Größe eines unkomprimiert im APK abgelegten Assets (siehe {@code noCompress} in
     * {@code build.gradle}), um unveränderte Dateien nach einem App-Update nicht erneut
     * zu kopieren.
     *
     * @return Größe in Bytes oder -1, wenn das Asset fehlt oder komprimiert ist
     */
    private static long uncompressedAssetLength(AssetManager assets, String assetPath) {
        try (android.content.res.AssetFileDescriptor descriptor = assets.openFd(assetPath)) {
            return descriptor.getLength();
        } catch (IOException exception) {
            return -1;
        }
    }

    /**
     * Versionsstand der App, um mitgelieferte Modelle nach einem Update neu zu kopieren.
     */
    private String bundleVersion() {
        try {
            return String.valueOf(context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).lastUpdateTime);
        } catch (PackageManager.NameNotFoundException exception) {
            return "unknown";
        }
    }

    private static String readText(File file) {
        try {
            return file.isFile() ? new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8) : "";
        } catch (IOException exception) {
            return "";
        }
    }

    private static String encodePath(String path) throws IOException {
        StringBuilder result = new StringBuilder();

        for (String segment : path.split("/")) {
            if (result.length() > 0) result.append('/');
            result.append(URLEncoder.encode(segment, "UTF-8").replace("+", "%20"));
        }

        return result.toString();
    }

    private static String trimSlashes(String path) {
        int start = 0;
        int end   = path.length();

        while (start < end && path.charAt(start) == '/') start++;
        while (end > start && path.charAt(end - 1) == '/') end--;

        return path.substring(start, end);
    }
}

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
 * Makes model files available in the file system because ONNX Runtime and ORT GenAI
 * load models from actual files. As in Transformers.js, files are searched for locally
 * first (assets bundled with the app) and then on Hugging Face.
 *
 * <p>The destination is {@code noBackupFilesDir/models/<modelId>/}. Files bundled
 * with the app are recopied after each app update. Downloaded files are retained.</p>
 */
public final class ModelFiles {
    private static final String TAG = "NativeInference";

    /**
     * Directory of the web assets inside the APK (Capacitor {@code webDir}).
     */
    private static final String ASSET_ROOT = "public";

    /**
     * Base URL for downloads, corresponding to {@code env.remoteHost} in Transformers.js.
     */
    private static final String REMOTE_HOST = "https://huggingface.co/";

    /**
     * File containing the version of files copied from the assets.
     */
    private static final String STAMP_FILE = ".bundle-version";

    private final Context context;
    private final String assetDir;

    /**
     * @param context  Android context for assets and the file system
     * @param assetDir Model directory within the web assets, for example
     *                 {@code _generated/models} from {@code config.models.downloadDir}
     */
    public ModelFiles(Context context, String assetDir) {
        this.context  = context;
        this.assetDir = trimSlashes(assetDir == null || assetDir.isEmpty() ? "_generated/models" : assetDir);
    }

    /**
     * File name suffix for a data type, like {@code DEFAULT_DTYPE_SUFFIX_MAPPING}
     * in Transformers.js.
     *
     * @param dtype Data type, for example {@code q4} or {@code fp32}
     * @return Suffix for the ONNX file name
     * @throws IllegalArgumentException for an unknown data type
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
     * Get the relative paths of the ONNX file and its external weights. As in Transformers.js,
     * the number of weight files is specified in {@code transformers.js_config.use_external_data_format}
     * in {@code config.json}, either globally or per file name.
     *
     * @param config   Contents of {@code config.json}
     * @param baseName Base name of the ONNX file, for example {@code model}
     * @param dtype    Data type
     * @return The ONNX file followed by the external weight files
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
     * Model directory in the file system.
     *
     * @param modelId Model ID, for example {@code onnx-community/Qwen3-0.6B-ONNX}
     * @return Directory (does not need to exist)
     * @throws IllegalArgumentException for an invalid model ID
     */
    File modelDir(String modelId) {
        if (modelId == null || modelId.isEmpty() || modelId.startsWith("/") || modelId.contains("..") || modelId.contains("\\")) {
            throw new IllegalArgumentException("Ungültige Modell-ID: " + modelId);
        }

        return new File(new File(context.getNoBackupFilesDir(), "models"), modelId);
    }

    /**
     * Ensure that all files for a model are available locally.
     *
     * @param modelId  Model ID
     * @param required Relative paths of required files
     * @param optional Relative paths of optional files that may be missing
     * @return Model directory
     * @throws IOException if a required file is unavailable both in the assets and online
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
     * Read the contents of an optional JSON file in the model directory.
     *
     * @param file File
     * @return JSON object or an empty object if the file is missing
     * @throws IOException if reading fails
     * @throws JSONException if the JSON is invalid
     */
    public static JSONObject readJson(File file) throws IOException, JSONException {
        if (!file.isFile()) return new JSONObject();
        return new JSONObject(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8));
    }

    /**
     * Write text to a file.
     *
     * @param file File
     * @param text Contents
     * @throws IOException if writing fails
     */
    public static void writeText(File file, String text) throws IOException {
        Files.write(file.toPath(), text.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Copy or download a single file. Files from the assets are copied again after
     * an app update. Downloaded files are reused.
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
            // Not bundled with the app.
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
     * Write data to a temporary file and rename it only after completion so that
     * interrupted copies are not treated as complete files.
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
     * Size of an asset stored uncompressed in the APK (see {@code noCompress} in
     * {@code build.gradle}), used to avoid copying unchanged files again after an app update.
     *
     * @return Size in bytes, or -1 if the asset is missing or compressed
     */
    private static long uncompressedAssetLength(AssetManager assets, String assetPath) {
        try (android.content.res.AssetFileDescriptor descriptor = assets.openFd(assetPath)) {
            return descriptor.getLength();
        } catch (IOException exception) {
            return -1;
        }
    }

    /**
     * App version, used to recopy bundled models after an update.
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

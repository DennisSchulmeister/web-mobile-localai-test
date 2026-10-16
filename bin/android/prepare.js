/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {cp, mkdir, rm} from "node:fs/promises";
import path from "node:path";
import * as utils from "../utils.js";

const webDir    = path.resolve("static");
const outputDir = path.resolve(".capacitor/www");
const config    = utils.readConfig({
    configFile: path.join(webDir, "config.json"),
    withModels: true,
});
const catalog = config.models.config;

const bundledModels = new Set(
    Object.values(catalog).flat()
        .filter(model => model.engines?.["onnx-android"]?.include === true)
        .map(model => model.modelId),
);

const modelDir         = config.models.downloadDir;
const relativeModelDir = path.relative(webDir, modelDir);

if (!relativeModelDir || relativeModelDir.startsWith(`..${path.sep}`)
        || relativeModelDir === ".." || path.isAbsolute(relativeModelDir)) {
    throw new Error("models.downloadDir muss ein Verzeichnis innerhalb von static sein.");
}

// Nur tatsächlich relevante Modelle kopieren, statt sie nach dem Kopieren wieder zu löschen
await rm(outputDir, {recursive: true, force: true});

await cp(webDir, outputDir, {
    recursive: true,
    filter: source => source !== modelDir,
});

const outputModelDir = path.join(outputDir, relativeModelDir);
await mkdir(outputModelDir, {recursive: true});

for (const modelId of bundledModels) {
    console.log(`Kopiere Android-Modell: ${modelId}`);
    await cp(path.join(modelDir, modelId), path.join(outputModelDir, modelId), {recursive: true});
}

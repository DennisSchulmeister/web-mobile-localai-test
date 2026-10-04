/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {cp, mkdir, readFile, rm} from "node:fs/promises";
import path from "node:path";

const webDir = path.resolve("static");
const outputDir = path.resolve(".capacitor/www");
const config = JSON.parse(await readFile(path.join(webDir, "config.json"), "utf8"));
const catalog = JSON.parse(await readFile(path.join(webDir, config.models.config), "utf8"));
const bundledModels = new Set(
    Object.values(catalog).flat()
        .filter(model => model.android?.include === true)
        .map(model => model.modelId),
);
const modelDir = path.resolve(webDir, config.models.downloadDir);
const relativeModelDir = path.relative(webDir, modelDir);

if (!relativeModelDir || relativeModelDir.startsWith(`..${path.sep}`)
        || relativeModelDir === ".." || path.isAbsolute(relativeModelDir)) {
    throw new Error("models.downloadDir must point to a directory inside static.");
}

// Skip the entire model tree before copying, rather than copying gigabytes only to delete them.
await rm(outputDir, {recursive: true, force: true});
await cp(webDir, outputDir, {
    recursive: true,
    filter: source => source !== modelDir,
});

const outputModelDir = path.join(outputDir, relativeModelDir);
await mkdir(outputModelDir, {recursive: true});

for (const modelId of bundledModels) {
    console.log(`Bundling Android model: ${modelId}`);
    await cp(path.join(modelDir, modelId), path.join(outputModelDir, modelId), {recursive: true});
}

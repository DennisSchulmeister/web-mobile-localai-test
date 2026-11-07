/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import path            from "node:path";
import process         from "node:process";
import shell           from "shelljs";
import {ModelRegistry} from "@huggingface/transformers";
import {Downloader}    from "nodejs-file-downloader";
import * as utils      from "../utils.js";

console.log("Download Language Models");
console.log("========================");
console.log("");

// Read the configuration.
if (process.argv.length < 3) {
    utils.logError("Too few arguments!");
    utils.logError(`Usage: ${process.argv[0]} ${process.argv[1]} <config.json>`);
    process.exit(1);
}

let config = utils.readConfig({
    configFile: process.argv[2],
    withModels: true,
});

// Download each model once.
let modelsById  = new Map();

for (let modelType in config.models.config) {
    for (let modelDefinition of config.models.config[modelType]) {
        let prevModelDefinition = modelsById.get(modelDefinition.modelId);

        if (!Array.isArray(modelDefinition.dtypes)) {
            modelDefinition.dtypes = [];
        }

        if (Array.isArray(prevModelDefinition?.dtypes)) {
            // Edge case: The same model is configured multiple times with different dtypes.
            let dtypes = new Set([...modelDefinition.dtypes, ...prevModelDefinition.dtypes]);
            modelDefinition.dtypes = [...dtypes.values()];
        }

        modelsById.set(modelDefinition.modelId, modelDefinition);
    }
}

for (let [modelId, modelDefinition] of modelsById.entries()) {
    console.log(`» ${modelId}`);

    // Check whether the requested dtypes are available for the model.
    let dtypes = await ModelRegistry.get_available_dtypes(modelId);
    console.log(`Available dtypes: ${dtypes.toLocaleString()}`);
    console.log(`Configured dtypes: ${modelDefinition.dtypes || ""}`);

    // Determine which files are needed for the download.
    let downloadFiles = new Set();

    if (!Array.isArray(modelDefinition.dtypes) || !modelDefinition.dtypes.length) {
        let files = await ModelRegistry.get_files(modelId);
        files.forEach(file => downloadFiles.add(file));
    } else {
        for (let dtype of modelDefinition.dtypes) {
            let files = await ModelRegistry.get_files(modelId, {dtype});
            files.forEach(file => downloadFiles.add(file));
        }
    }

    console.log();

    for (let downloadFile of downloadFiles) {
        console.log(` - ${downloadFile}`);
    }

    console.log();

    // Download missing files.
    for (let downloadFile of downloadFiles) {
        let modelPath = utils.modelPath(config, modelId);
        let localPath = path.join(modelPath, ...downloadFile.split("/"));
        let localDir  = path.dirname(localPath);
        let fileName  = path.basename(localPath);

        if (!shell.test("-e", localPath)) {
            // This URL should always return the file itself, whether it is hosted directly
            // on the Hub or on external storage due to its size.
            let remoteUrl = `https://huggingface.co/${modelId}/resolve/main/${downloadFile}?download=true`;
            console.log(`Download ${remoteUrl}`);

            try {
                let downloader = new Downloader({url: remoteUrl, directory: localDir, fileName});
                await downloader.download();
            } catch (error) {
                utils.logError(error.toString());
            }
        }
    }

    console.log();
}

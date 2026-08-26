/**
 * Web/Mobile-Test für lokale KI
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

console.log("Modelle Herunterladen");
console.log("=====================");
console.log("");

// Konfiguration einlesen
if (process.argv.length < 3) {
    utils.logError("Zu wenig Kommandozeilenparameter!");
    utils.logError(`Aufruf: ${process.argv[0]} ${process.argv[1]} <config.json>`);
    process.exit(1);
}

let config = utils.readConfig({
    configFile: process.argv[2],
    withModels: true,
});

// Jedes Modell einmal herunterladen
let modelsById  = new Map();

for (let modelType in config.models.config) {
    for (let modelDefinition of config.models.config[modelType]) {
        let prevModelDefinition = modelsById.get(modelDefinition.modelId);

        if (!Array.isArray(modelDefinition.dtypes)) {
            modelDefinition.dtypes = [];
        }

        if (Array.isArray(prevModelDefinition?.dtypes)) {
            // Edge Case: Selbes Modell mit unterschiedlichen dtypes mehrfach konfiguriert
            let dtypes = new Set([...modelDefinition.dtypes, ...prevModelDefinition.dtypes]);
            modelDefinition.dtypes = [...dtypes.values()];
        }

        modelsById.set(modelDefinition.modelId, modelDefinition);
    }
}

for (let [modelId, modelDefinition] of modelsById.entries()) {
    console.log(`» ${modelId}`);

    // Prüfen, ob die gewünschten dtypes für das Modell verfügbar sind
    let dtypes = await ModelRegistry.get_available_dtypes(modelId);
    console.log(`Verfügbare dtypes: ${dtypes.toLocaleString()}`);
    console.log(`Konfigurierte dtypes: ${modelDefinition.dtypes || ""}`);

    // Für den Download benötigte Dateien ermitteln
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

    // Fehlende Dateien herunterladen
    for (let downloadFile of downloadFiles) {
        let modelPath = utils.modelPath(config, modelId);
        let localPath = path.join(modelPath, ...downloadFile.split("/"));
        let localDir  = path.dirname(localPath);
        let fileName  = path.basename(localPath);

        if (!shell.test("-e", localPath)) {
            // Diese URL sollte immer die Datei selbst liefern, egal ob sie direkt im Hub
            // liegt oder aufgrund der Größe auf einem externen Speicher
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
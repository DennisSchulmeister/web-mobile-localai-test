/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import process         from "node:process";
import shell           from "shelljs";
import {ModelRegistry} from "@huggingface/transformers";
import * as utils      from "../utils.js";

console.log("Modelle Herunterladen");
console.log("=====================");
console.log("");

// Komoandozeilenparamter prüfen
if (process.argv.length < 4) {
    utils.logError("Zu wenig Kommandozeilenparameter!");
    utils.logError(`Aufruf: ${process.argv[0]} ${process.argv[1]} <models.json> <download_dir>`);
    process.exit(1);
}

// Jedes Modell nur einmal herunterladen
let models     = JSON.parse(shell.cat(process.argv[2]));
let cacheDir   = process.argv[3];
let modelsById = new Map();

for (let modelType in models) {
    for (let modelDefinition of models[modelType]) {
        let prevModelDefinition = modelsById.get(modelDefinition.repo);

        if (!Array.isArray(modelDefinition.dtypes)) {
            modelDefinition.dtypes = [];
        }

        if (Array.isArray(prevModelDefinition?.dtypes)) {
            // Edge Case: Selbes Modell mit unterschiedlichen dtypes mehrfach konfiguriert
            let dtypes = new Set([...modelDefinition.dtypes, ...prevModelDefinition.dtypes]);
            modelDefinition.dtypes = [...dtypes.values()];
        }

        modelsById.set(modelDefinition.repo, modelDefinition);
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
        for (let dtype in modelDefinition.dtypes) {
            let files = await ModelRegistry.get_files(modelId, {dtype});
            files.forEach(file => downloadFiles.add(file));
        }
    }

    console.log();

    for (let downloadFile of downloadFiles) {
        console.log(` - ${downloadFile}`);
    }

    // Fehlende Dateien herunterladen

    console.log();
}
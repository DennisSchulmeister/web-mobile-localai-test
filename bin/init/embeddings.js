/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs                from "node:fs/promises";
import path              from "node:path";
import process           from "node:process";
import shell             from "shelljs";
import * as transformers from '@huggingface/transformers';
import * as utils        from "../utils.js";

console.log("Texteinbettungen berechnen");
console.log("==========================");
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
    withData:   true,
});

transformers.env.localModelPath    = config.models.downloadDir;
transformers.env.allowRemoteModels = false;

let embeddingModels = config.models.config.sentenceEmbedding || [];

for (let embeddingModel of embeddingModels) {
    for (let dtype of embeddingModel.dtypes) {
        try{
            console.log(`» ${embeddingModel.modelId}(${dtype})`);
    
            let encoder   = await transformers.pipeline("feature-extraction", embeddingModel.modelId, {dtype});
            let paths     = utils.embeddingsPaths(config, embeddingModel.modelId, dtype);
            let keywords  = {};
            let sentences = {};
    
            for (let category of config.data.config) {
                for (let page of category.pages) {
                    console.log(`  - ${page._file}`);
                    
                    let pagePaths     = utils.preprocessPaths(config, page._file);
                    let pageKeywords  = [];
                    let pageSentences = [];

                    for (let keyword of utils.readJsonFile(pagePaths.keywords)) {
                        let embedding = await encoder(keyword, {pooling: "mean", normalize: true});
                        pageKeywords.push({text: keyword, embedding: [...embedding.data]});
                    }

                    for (let sentence of utils.readJsonFile(pagePaths.sentences)) {
                        let embedding = await encoder(sentence, {pooling: "mean", normalize: true});
                        pageSentences.push({text: sentence, embedding: [...embedding.data]});
                    }
                        
                    keywords[page._file] = pageKeywords;
                    sentences[page._file] = pageSentences;
                }
            }
    
            // Hier bewusst keine Formatierung der JSON-Daten, um die Dateigröße
            // kleiner zu halten. Spart hier rund 50%!
            shell.mkdir("-p", paths.dir);
            await fs.writeFile(paths.keywords,  JSON.stringify(keywords));
            await fs.writeFile(paths.sentences, JSON.stringify(sentences));

            console.log();
        } catch (error) {
            utils.logError(error.toString());
        }
    }
}
/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as transformers from '@huggingface/transformers';

/**
 * Konfigurierte KI-Modelle.
 */
class ModelState {
    config = $state({});
    models = $state({});
    
    /**
     * Datei `models/index.json` mit den konfigurierten KI-Modellen einlesen.
     */
    async reloadModelConfiguration() {
        try {
            this.config = await(await fetch("config.json")).json();
            this.models = await (await fetch(this.config.models.config)).json();

            transformers.env.localModelPath    = this.config.models.downloadDir;
            transformers.env.allowLocalModels  = true;
            transformers.env.allowRemoteModels = false;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Vgl. `/bin/utils.js → embeddingPaths()`
     * 
     * Verzeichnispfade für die Texteinbettungen aller Seiten eines spezifischen
     * KI-Modells ermitteln. Liefert ein Objekt mit den Attributen `dir`, `keywords`
     * und `sentences`. `dir` ist das  Verzeichnis, die anderen Dateien darin.
     * 
     * @param {string} modelId ID des KI-Modells
     * @param {string} dtype Datentype des KI-Modells (z.B. fp32, int8)
     * @returns {object} Verzeichnispfade
     */
    embeddingsPaths(modelId, dtype) {
        let dir = `${this.config.data.embeddingsDir}/${modelId}/${dtype}`;
    
        return {
            dir:       dir,
            keywords:  `${dir}/keywords.json`,
            sentences: `${dir}/sentences.json`,
        };
    }
}

export default new ModelState();
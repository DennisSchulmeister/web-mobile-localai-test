/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as transformers from '@huggingface/transformers';

/**
 * Optionale Debug-Logs zum Untersuchen von Performance-Problemen.
 * 
 * Sowohl beim Laden aus auch bei der Ausführung werden durch die
 * ONNX-Runtime umfangreiche Logs geschrieben, die Hinweise darauf
 * geben können, warum ein bestimmtes Modell nur sehr langsam läuft.
 * 
 * Hierfür sichert man die Browser Logs in eine Textdatei und nutzt
 * z.B. Copilot zur Auswertung.
 */
let sessionOptions = {};

if (window.ENABLE_DEBUG_LOGS) {
    transformers.env.logLevel = transformers.LogLevel.DEBUG;
    
    transformers.env.backends.onnx.webgpu.profiling = {
        mode: "default",
    };

    sessionOptions = {
        logSeverityLevel:  0,  // Verbose
        logVerbosityLevel: 1,
    };
}

/**
 * Konfigurierte KI-Modelle.
 */
class ModelState {
    /**
     * Inhalt der Konfigurationsdatei `static/config.js`.
     */
    config = $state({});

    /**
     * Konfiguration aller verfügbaren Modelle.
     */
    models = $state({});

    /**
     * Metadaten des aktuell geladenen Modells
     */
    loadedModel = $state({
        task:    "",            // Erster Parameter für `transformers.pipeline()`
        modelId: "",            // Modell-ID
        dtype:   "",            // Datentyp
        device:  "",            // Ausführumgebung
        status:  "not-loaded",  // "not-loaded", "loading", "ready", "error"
        message: "",            // Fehlermeldung bei status "error",
        config:  {},            // JSON-Konfiguration aus der Datei `models.json`
    });

    /**
     * Aktuell geladenes KI-Modell.
     */
    model = null;

    /**
     * Datei `models/index.json` mit den konfigurierten KI-Modellen einlesen.
     */
    async reloadModelConfiguration() {
        this.config = await(await fetch("config.json")).json();
        this.models = await (await fetch(this.config.models.config)).json();

        transformers.env.localModelPath    = this.config.models.downloadDir;
        transformers.env.allowLocalModels  = true;
        transformers.env.allowRemoteModels = false;
    }

    /**
     * Vgl. `/bin/utils.js → embeddingPaths()`
     * 
     * Verzeichnispfade für die Texteinbettungen aller Seiten eines spezifischen
     * KI-Modells ermitteln. Liefert ein Objekt mit den Attributen `dir`, `keywords`
     * und `sentences`. `dir` ist das  Verzeichnis, die anderen Dateien darin.
     * 
     * @param {string} modelId ID des KI-Modells
     * @param {string} dtype Datentyp des KI-Modells (z.B. fp32, int8)
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

    /**
     * KI-Modell laden. Da die Modelle sehr groß sind, wird immer nur das zuletzt
     * geladene Modell im Speicher behalten. Das Modell wird im Attribut `model`
     * abgelegt. `loadedModel` wird entsprechend mit den Metadaten aktualisiert.
     * 
     * Wir nutzen hier die high-level Pipeline API von transformers.js, da diese
     * für jede Modellart die typischen Verarbeitungsschritte kapselt. Sollte dies
     * für bestimmte Modelle nicht ausreichen, könnte man hier je nach Modellart in
     * eine neue Methode verzweigen, die die low-level Model/Tokenizer/…-Klassen
     * selbst nutzt.
     * 
     * @param {string} task Art des Modells
     * @param {string} modelId Model ID
     * @param {string} dtype Datentyp
     * @param {string} device Ausführumgebung
     */
    async loadModel({task, modelId, dtype, device} = {}) {
        try {
            if (modelId) {
                this.loadedModel.status = "loading";
                this.loadedModel.message = "";
    
                this.model = await transformers.pipeline(task, modelId, {
                    dtype:  dtype,
                    device: device,
                    session_options: { ...sessionOptions },
                });

                this.loadedModel.task    = task;
                this.loadedModel.modelId = modelId;
                this.loadedModel.dtype   = dtype;
                this.loadedModel.device  = device;
                this.loadedModel.status  = "ready";
                this.loadedModel.config  = this.models[task].find(e => e.modelId === modelId);
            }
        } catch (error) {
            this.loadedModel.status  = "error";
            this.loadedModel.message = error.toString();
            throw error;
        }
    }
}

export default new ModelState();

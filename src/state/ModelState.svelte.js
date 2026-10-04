/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import backends from "../backends/index.js";

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
     * Verfügbare Ausführumgebungen: Liste mit `{device: "", label: ""}`
     */
    devices = $state([]);

    /**
     * Mapping des internen Device-Strings auf ein Backend. 
     */
    #backendsByDevice = {};

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
        backend: null,          // Inferenz-Backend mit den Methoden zur Nutzung des Modells
    });

    /**
     * Datei `models/index.json` mit den konfigurierten KI-Modellen einlesen.
     */
    async reloadModelConfiguration() {
        this.config = await(await fetch("config.json")).json();
        this.models = await (await fetch(this.config.models.config)).json();

        this.#backendsByDevice = {};
        this.devices = [];
        let i = 0;

        for (let backend of backends) {
            backend.setConfig({config: this.config, models: this.models});

            for (let device of backend.devices) {
                let deviceId = `${i}::${device.device}`;

                this.devices.push({device: deviceId, label: device.label});
                this.#backendsByDevice[deviceId] = backend;
            }
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
                this.loadedModel.status  = "loading";
                this.loadedModel.message = "";
                this.loadedModel.config  = this.models[task].find(e => e.modelId === modelId);
                this.loadedModel.backend = this.#backendsByDevice[device];

                if (!this.loadedModel.backend) {
                    throw new Error(`Kein Backend für Device ${device} vorhanden!`);
                }

                let [_, backendDevice] = device.split("::");
                await this.loadedModel.backend.loadModel({task, modelId, dtype, device: backendDevice, config: this.loadedModel.config});
    
                this.loadedModel.task    = task;
                this.loadedModel.modelId = modelId;
                this.loadedModel.dtype   = dtype;
                this.loadedModel.device  = device;
                this.loadedModel.status  = "ready";
            }
        } catch (error) {
            this.loadedModel.status  = "error";
            this.loadedModel.message = error.toString();
            throw error;
        }
    }
}

export default new ModelState();

/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import backends from "../backends/index.js";

/**
 * Configured AI models.
 */
class ModelState {
    /**
     * Contents of the configuration file `static/config.js`.
     */
    config = $state({});

    /**
     * Configuration of all available models.
     */
    models = $state({});

    /**
     * Available backend instances.
     */
    backends = $state([]);

    /**
     * Available execution environments: list of `{device: "", label: ""}` objects
     */
    devices = $state([]);

    /**
     * Metadata of the currently loaded model
     */
    loadedModel = $state({
        task:    "",            // First parameter for `transformers.pipeline()`
        modelId: "",            // Model ID
        dtype:   "",            // Data type
        device:  "",            // Execution environment
        status:  "not-loaded",  // "not-loaded", "loading", "ready", "error"
        message: "",            // Error message when status is "error"
        config:  {},            // JSON configuration from the `models.json` file
        backend: null,          // Inference backend with methods for using the model
    });

    /**
     * Read the `models/index.json` file containing the configured AI models.
     */
    async reloadModelConfiguration() {
        this.config = await(await fetch("config.json")).json();
        this.models = await (await fetch(this.config.models.config)).json();

        this.backends = [];
        this.devices  = [];

        for (let backend of backends) {
            if (!backend.isSupported) continue;
            backend.setConfig({config: this.config, models: this.models});

            this.backends.push(backend);
            this.devices = backend.devices;
        }
    }

    /**
     * See `/app/bin/utils.js → embeddingPaths()`
     * 
     * Get directory paths for the text embeddings of all pages for a specific
     * AI model. Returns an object with the `dir`, `keywords`, and `sentences`
     * attributes. `dir` is the directory; the others are files within it.
     * 
     * @param {string} modelId AI model ID
     * @param {string} dtype AI model data type (e.g. fp32, int8)
     * @returns {object} Directory paths
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
     * Load an AI model. Since models are very large, only the most recently
     * loaded model is kept in memory. The model is stored in the `model`
     * attribute, and `loadedModel` is updated with the corresponding metadata.
     * 
     * Use the high-level pipeline API from transformers.js here because it
     * encapsulates the typical processing steps for each model type. If this
     * is insufficient for certain models, branch here by model type into a
     * new method that uses the low-level Model/Tokenizer/… classes that
     * transformers.js uses internally.
     * 
     * @param {string} task Model type
     * @param {string} modelId Model ID
     * @param {string} backendId Backend ID
     * @param {string} dtype Data type
     * @param {string} device Execution environment
     */
    async loadModel({task, modelId, backendId, dtype, device} = {}) {
        try {
            if (modelId) {
                this.loadedModel.status  = "loading";
                this.loadedModel.message = "";
                this.loadedModel.config  = this.models[task].find(e => e.modelId === modelId);
                this.loadedModel.backend = this.backends.find(e => e.id === backendId);

                if (!this.loadedModel.backend) {
                    throw new Error(`Kein Backend für Device ${device} vorhanden!`);
                }

                await this.loadedModel.backend.loadModel({task, modelId, dtype, device, config: this.loadedModel.config});
    
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

/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Base class for all inference backends.
 * 
 * The `device` and `dtype` parameters used to load a model, as well as the specific
 * pipeline parameters, should not really be part of the API because they expose the
 * transformers.js API. Instead, each backend should be able to define a dynamic list
 * of loading and pipeline parameters, with each parameter having an ID, display name,
 * data type, and possible values. However, that is too much work as long as no backends
 * other than transformers.js and ONNX Runtime are used.
 */
export default class BaseBackend {
    /**
     * Contents of the configuration file `app/static/config.json`.
     */
    config = {};

    /**
     * Configuration of all available models.
     */
    models = {};

    /**
     * Get the backend's technical ID.
     * @returns {string} Backend ID
     */
    get id() {
        return "";
    }

    /**
     * Get the backend's display name.
     * @returns {string} Backend name
     */
    get name() {
        return "Kein Name";
    }

    /**
     * Whether the backend is available on the current device.
     * @returns {boolean} Whether the backend is supported
     */
    get isSupported() {
        return false;
    }

    /**
     * Supported execution environments as name/value pairs. The value is passed
     * to the `device` parameter of `loadModel()` when a model is loaded.
     * 
     * Callers must await the result.
     * @returns {Array|Promise<Array>} List of `{device: "", label: ""}` objects
     */
    get devices() {
        return [];
    }

    /**
     * Return backend diagnostic information as a list of name/value pairs, for example
     * whether execution on the GPU or TPU is supported.
     * 
     * @returns {Array} List of `{field: "", icon: "", label: "", text: ""}` objects
     */
    async getInformation() {
        return [];
    }

    /**
     * Set the configuration.
     * 
     * @param {Object} config Global configuration from `app/static/config.json`
     * @param {Object} models Model configuration from `app/static/models/index.json`
     */
    setConfig({config, models} = {}) {
        this.config = config || {};
        this.models = models || {};
    }

    /**
     * Check whether the backend supports a particular model type.
     * @param {string} task Model type
     * Callers must await the result.
     * @returns {boolean|Promise<boolean>} Whether the model type is supported
     */
    supportsTask(task) {
        return false;
    }

    /**
     * Check whether the backend can load and run the requested AI model with the
     * given configuration.
     * 
     * @param {string} task Model type
     * @param {string} modelId Model ID
     * @param {object} config Model configuration
     * @returns {boolean} Whether loading and execution are possible
     */
    supportsModel({task, modelId, config} = {}) {
        return false;
    }

    /**
     * Load an AI model. Since the models are very large, only the most recently
     * loaded model is kept in memory.
     * 
     * @param {string} task Model type
     * @param {string} modelId Model ID
     * @param {string} dtype Data type
     * @param {string} device Execution environment
     * @param {object} config Model configuration
     */
    async loadModel({task, modelId, dtype, device, config} = {}) {
        throw new Error("Nicht implementiert!");
    }

    /**
     * AI inference: normalized word embeddings for cosine similarity
     * 
     * @param {string} input Input text
     * @returns {Array} Numeric embeddings
     */
    async runEmbeddingPipeline(input) {
        throw new Error("Nicht implementiert!");
    }

    /**
     * AI inference: answer a question about text
     * 
     * @param {string} question Question
     * @param {string} context Text context
     * @returns {string} Answer
     */
    async runQuestionAnsweringPipeline({question, context} = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * AI inference: summarize text
     * 
     * @param {string} input Input text
     * @param {number} maxNewTokens Maximum number of tokens
     * @returns {string} Summary
     */
    async runSummaryPipeline({input, maxNewTokens} = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * AI inference: translate text
     * 
     * @param {string} input Input text
     * @param {sourceLanguage} input Source language
     * @param {targetLanguage} input Target language
     * @returns {string} Translation
     */
    async runTranslationPipeline({input, sourceLanguage, targetLanguage} = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * AI inference: text generation / chat
     * 
     * The two callback functions can be used for real-time UI updates. They are
     * called with an array of the most recently generated tokens or a string
     * containing the most recently generated text fragment.
     * 
     * @param {string} question Question
     * @param {string} context Text context
     * @param {Function} tokenCallback Streaming callback: generated tokens
     * @param {Function} textCallback Streaming callback: generated text
     * @param {number} maxNewTokens Maximum number of tokens to generate
     * @param {number} maxLength Maximum response length
     * @param {boolean} doSample Whether to use sampling
     * @param {number} temperature Temperature
     * @param {number} repetitionPenalty Penalty for verbatim repetitions
     * @returns {string} Generated text
     */
    async runTextGenerationPipeline({question, context, tokenCallback, textCallback,
                                     maxNewTokens, maxLength, doSample, temperature, repetitionPenalty
                                    } = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * Stop the current text generation.
     */
    stopTextGeneration() {
        throw new Error("Nicht implementiert");
    }
}

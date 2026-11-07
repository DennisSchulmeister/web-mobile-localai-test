/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";
import path  from "node:path";
import shell from "shelljs";

/**
 * Print an error message to the console.
 * @param ...args Message text and elements to log
 */
export function logError(...args) {
    console.error(chalk.bold.red("FEHLER:"), ...args);
}

/**
 * Print a warning message to the console.
 * @param ...args Message text and elements to log
 */
export function logWarning(...args) {
    console.log(chalk.bold.blue("WARNUNG:"), ...args);
}

/**
 * Read and deserialize a JSON file.
 *
 * @param {string} filename File path
 * @returns Deserialized JSON data
 */
export function readJsonFile(filename) {
    return JSON.parse(shell.cat(filename));
}

/**
 * Read the main configuration file and optionally read the data and model configuration.
 * If `withData` and/or `withModels` are `true`, replace the `config` attribute at the
 * corresponding location with the contents of the respective file.
 * 
 * File paths are specified relative to the configuration file. When read, they are
 * resolved relative to the working directory. The original path is stored under the
 * same name, prefixed with an underscore.
 * 
 * @param {string} configFile Path to the main configuration file
 * @param {boolean} withModels Include the model configuration
 * @param {boolean} withData Include the data configuration
 * @returns Deserialized configuration
 */
export function readConfig({configFile, withModels, withData} = {}) {
    let config  = readJsonFile(configFile);
    let dirname = path.dirname(configFile);

    config.models._downloadDir = config.models.downloadDir;
    config.models.downloadDir  = path.join(dirname, config.models.downloadDir);

    config.data._preprocessDir = config.data.preprocessDir;
    config.data.preprocessDir  = path.join(dirname, config.data.preprocessDir);

    config.data._embeddingsDir = config.data.embeddingsDir;
    config.data.embeddingsDir  = path.join(dirname, config.data.embeddingsDir);

    if (withModels) {
        config.models._config = config.models.config;
        config.models.config  = readJsonFile(path.join(dirname, config.models.config));
    }

    if (withData) {
        let dataFile = path.join(dirname, config.data.config);
        let dataPath = path.dirname(dataFile);

        config.data._config = config.data.config;
        config.data.config = readJsonFile(dataFile);

        for (let category of config.data.config || []) {
            for (let page of category.pages || []) {
                page._file = page.file;
                page.file  = path.join(dataPath, page.file);
            }
        }
    }

    return config;
}

/**
 * Get the directory path for an AI model.
 * 
 * @param {object} config Deserialized configuration
 * @param {string} modelId AI model ID
 * @returns {string} Directory path
 */
export function modelPath(config, modelId) {
    return path.join(config.models.downloadDir, ...modelId.split("/"));
}

/**
 * Get directory paths for a page's preprocessed data.
 * Returns an object with the `dir`, `keywords`, and `sentences` attributes.
 * `dir` is the directory; the others are files within it.
 * 
 * @param {object} config Deserialized configuration
 * @param {string} dataFile Data file path
 * @returns {object} Directory paths
 */
export function preprocessPaths(config, dataFile) {
    let dir = path.join(config.data.preprocessDir, ...dataFile.split("/"));

    return {
        dir:       dir,
        keywords:  path.join(dir, "keywords.json"),
        sentences: path.join(dir, "sentences.json"),
    };
}

/**
 * See `/src/state/Model.svelte.js → ModelState::embeddingPaths()`
 * 
 * Get directory paths for the text embeddings of all pages for a specific
 * AI model. Returns an object with the `dir`, `keywords`, and `sentences`
 * attributes. `dir` is the directory; the others are files within it.
 * 
 * @param {object} config Deserialized configuration
 * @param {string} modelId AI model ID
 * @param {string} dtype AI model data type (e.g. fp32, int8)
 * @returns {object} Directory paths
 */
export function embeddingsPaths(config, modelId, dtype) {
    let dir = path.join(config.data.embeddingsDir, ...modelId.split("/"), dtype);

    return {
        dir:       dir,
        keywords:  path.join(dir, "keywords.json"),
        sentences: path.join(dir, "sentences.json"),
    };
}
/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";
import path  from "node:path";
import shell from "shelljs";

/**
 * Fehlermeldung auf der Konsole ausgeben.
 * @param ...args Meldungstext und zu loggende Elemente
 */
export function logError(...args) {
    console.error(chalk.bold.red("FEHLER:"), ...args);
}

/**
 * Warnmeldung auf der Konsole ausgeben.
 * @param ...args Meldungstext und zu loggende Elemente
 */
export function logWarning(...args) {
    console.log(chalk.bold.blue("WARNUNG:"), ...args);
}

/**
 * JSON-Datei einlesen und deserialisieren.
 *
 * @param {string} filename Dateipfad
 * @returns Deserialisierte JSON-Daten
 */
export function readJsonFile(filename) {
    return JSON.parse(shell.cat(filename));
}

/**
 * Hauptkonfigurationsdatei einlesen und optional auch die Daten- und Modellkonfiguration einlesen.
 * Wenn `withData` und/oder `withModels` gleich `true` sind, wird an der entsprechenden Stelle das
 * Attribut mit dem Namen `config` durch den Inhalt der jeweiligen Datei ersetzt.
 * 
 * Die Dateipfade sind relativ zur Konfigurationsdatei angegeben. Sie werden beim Einlesen relativ
 * zum Arbeitsverzeichnis gesetzt. Der Originalpfad wird unter demselben Namen mit vorangestelltem
 * Unterstrich gespeichert.
 * 
 * @param {string} configFile Dateipfad der Hauptkonfiguration
 * @param {boolean} withModels Modellkonfiguration einschließen
 * @param {boolean} withData Datenkonfiguration einschließen
 * @returns Deserialisierte Konfiguration
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
 * Verzeichnispfad für KI-Modell ermitteln.
 * 
 * @param {object} config Deserialisierte Konfiguration
 * @param {string} modelId ID des KI-Modells
 * @returns {string} Verzeichnispfad
 */
export function modelPath(config, modelId) {
    return path.join(config.models.downloadDir, ...modelId.split("/"));
}

/**
 * Verzeichnispfade für die vorverarbeiteten Daten einer Seite ermitteln.
 * Liefert ein Objekt mit den Attributen `dir`, `keywords` und `sentences`.
 * `dir` ist das  Verzeichnis, die anderen Dateien darin.
 * 
 * @param {object} config Deserialisierte Konfiguration
 * @param {string} dataFile Pfad der Datendatei
 * @returns {object} Verzeichnispfade
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
 * Verzeichnispfade für die Texteinbettungen aller Seiten eines spezifischen
 * KI-Modells ermitteln. Liefert ein Objekt mit den Attributen `dir`, `keywords`
 * und `sentences`. `dir` ist das  Verzeichnis, die anderen Dateien darin.
 * 
 * @param {object} config Deserialisierte Konfiguration
 * @param {string} modelId ID des KI-Modells
 * @param {ſtring} dtype Datentype des KI-Modells (z.B. fp32, int8)
 * @returns {object} Verzeichnispfade
 */
export function embeddingsPaths(config, modelId, dtype) {
    let dir = path.join(config.data.embeddingsDir, ...modelId.split("/"), dtype);

    return {
        dir:       dir,
        keywords:  path.join(dir, "keywords.json"),
        sentences: path.join(dir, "sentences.json"),
    };
}
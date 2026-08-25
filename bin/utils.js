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
 * zum Arbeitsverzeichnis gesetzt.
 * 
 * @param {string} configFile Dateipfad der Hauptkonfiguration
 * @param {boolean} withModels Modellkonfiguration einschließen
 * @param {boolean} withData Datenkonfiguration einschließen
 * @returns Deserialisierte Konfiguration
 */
export function readConfig({configFile, withModels, withData} = {}) {
    let config  = readJsonFile(configFile);
    let dirname = path.dirname(configFile);

    config.models.downloadDir = path.join(dirname, config.models.downloadDir);
    config.data.preprocessDir = path.join(dirname, config.data.preprocessDir);
    config.data.embeddingsDir = path.join(dirname, config.data.embeddingsDir);

    if (withModels) {
        config.models.config = readJsonFile(path.join(dirname, config.models.config));
    }

    if (withData) {
        let dataFile = path.join(dirname, config.data.config);
        let dataPath = path.dirname(dataFile);

        config.data.config = readJsonFile(dataFile);

        for (let category of config.data.config || []) {
            for (let page of category.pages || []) {
                page.file = path.join(dataPath, page.file);
            }
        }
    }

    return config;
}
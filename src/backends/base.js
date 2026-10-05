/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Basisklasse für alle Inferenz-Backends.
 */
export default class BaseBackend {
    /**
     * Inhalt der Konfigurationsdatei `static/config.js`.
     */
    config = {};

    /**
     * Konfiguration aller verfügbaren Modelle.
     */
    models = {};

    /**
     * Anzeigename des Backends ermitteln.
     * @returns {string} Name des Backends
     */
    get name() {
        return "Kein Name";
    }

    /**
     * Flag, ob das Backend auf dem aktuellen Gerät verfügbar ist.
     * @returns {boolean} Backend wird unterstützt
     */
    get isSupported() {
        return false;
    }

    /**
     * Unterstützte Ausführumgebungen als Name/Wert-Paare. Der Wert wird der Methode
     * `loadModel()` im Parameter `device` übergeben, wenn ein Modell geladen wird.
     * 
     * Aufrufer müssen das Ergebnis mit `await` auswerten.
     * @returns {Array|Promise<Array>} Liste mit `{device: "", label: ""}`-Objekten
     */
    get devices() {
        return [];
    }

    /**
     * Abfragen, ob eine bestimmte Modellart vom Backend unterstützt wird.
     * @param {string} task Art des Modells
     * Aufrufer müssen das Ergebnis mit `await` auswerten.
     * @returns {boolean|Promise<boolean>} Modellart wird unterstützt
     */
    supports(task) {
        return false;
    }

    /**
     * Diagnoseinformationen des Backends als Name/Wert-Liste zurückgeben, zum Beispiel
     * ob die Ausführung auf der GPU oder TPU unterstützt wird.
     * 
     * @returns {Array} Liste mit `{icon: "", label: "", text: ""}`-Objekten
     */
    async getInformation() {
        return [];
    }

    /**
     * Konfiguration setzen.
     * 
     * @param {Object} config Globale Konfiguration aus `static/config.json`
     * @param {Objet} models Modellkonfiguration aus `static/models/index.json`
     */
    setConfig({config, models} = {}) {
        this.config = config || {};
        this.models = models || {};
    }

    /**
     * KI-Modell laden. Da die Modelle sehr groß sind, wird immer nur das zuletzt
     * geladene Modell im Speicher behalten.
     * 
     * @param {string} task Art des Modells
     * @param {string} modelId Model ID
     * @param {string} dtype Datentyp
     * @param {string} device Ausführumgebung
     * @param {object} config Modellkonfiguration
     */
    async loadModel({task, modelId, dtype, device, config} = {}) {
        throw new Error("Nicht implementiert!");
    }

    /**
     * KI-Inferenz: Normalisierte Worteinbettungen für Cosinus-Vergleich
     * 
     * @param {string} input Eingabetext
     * @returns {Array} Nummerische Einbettungen
     */
    async runEmbeddingPipeline(input) {
        throw new Error("Nicht implementiert!");
    }

    /**
     * KI-Inferenz: Frage zu Text beantworten
     * 
     * @param {string} question Frage
     * @param {string} context Text-Kontext
     * @returns {string} Antwort
     */
    async runQuestionAnsweringPipeline({question, context} = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * KI-Inferenz: Text zusammenfassen
     * 
     * @param {string} input Eingabetext
     * @param {number} maxNewTokens Maximale Anzahl Tokens
     * @returns {string} Zusammenfassung
     */
    async runSummaryPipeline({input, maxNewTokens} = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * KI-Inferenz: Text übersetzen
     * 
     * @param {string} input Eingabetext
     * @param {sourceLanguage} input Quellsprache
     * @param {targetLanguage} input Zielsprache
     * @returns {string} Übersetzung
     */
    async runTranslationPipeline({input, sourceLanguage, targetLanguage} = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * KI-Inferenz: Textgenerierung / Chat
     * 
     * Die beiden Callback-Funktionen können für UI-Updates in Echtzeit genutzt werden.
     * Sie werden jeweils mit einem Array der zuletzt generierten Tokens bzw. einem
     * String mit dem zuletzt generierten Text-Schnippsel aufgerufen.
     * 
     * @param {string} question Frage
     * @param {string} context Text-Kontext
     * @param {Function} tokenCallback Streaming Callback: Generierte Tokens
     * @param {Function} textCallback Streaming Callback: Generierter Text
     * @param {number} maxNewTokens Maximale Anzahl zu generierender Tokens
     * @param {number} maxLength Maximale Länge der Antwort
     * @param {boolean} doSample Sampling ja/nein
     * @param {number} temperature Temperatur
     * @param {number} repetitionPenalty Bestrafung für wörtliche Wiederholungen
     * @returns {string} Generierter Text
     */
    async runTextGenerationPipeline({question, context, tokenCallback, textCallback,
                                     maxNewTokens, maxLength, doSample, temperature, repetitionPenalty
                                    } = {}) {
        throw new Error("Nicht implementiert");
    }

    /**
     * Laufende Textgenerierung abbrechen.
     */
    stopTextGeneration() {
        throw new Error("Nicht implementiert");
    }
}

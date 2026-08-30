/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Eine einfache Stoppuhr, mit der die Ausführung eines oder mehrerer
 * Schritte gemessen werden kann. Die dazugehörige `StoppWatch`-Komponente
 * zeigt die Messungen an.
 */
export default class StopWatchState {
    /**
     * Array mit Objekten. Die Objekte besitzen folgende Attribute:
     * 
     *  - `name`:      Name der Messung
     *  - `icon`:      Icon der Messung
     *  - `started`:   Startzeit der Messung (ms seit 1970)
     *  - `stopped`:   Stopzeit der Messing (ms seit 1970)
     *  - `runtime`:   Gemessene Zeit in Millisekunden
     *  - `formatted`: Formatierter Zeitstring
     */
    measurements = $state([]);

    /**
     * Status, ob die Messung läuft.
     */
    running = $state(false);

    /**
     * Intervall für UI-Updates in Millisekunden
     */
    interval = 100;

    /**
     * ID für den UI-Update-Timer.
     */
    #intervalId = null;

    /**
     * Formatierung der Zeitwerte
     */
    #formatter = new Intl.NumberFormat("de-DE", {minimumFractionDigits: 2, maximumFractionDigits: 2});

    /**
     * Konstruktor.
     * @param {number} interval Intervall für UI-Updates in Millisekunden (Default: 100)
     */
    constructor(interval) {
        if (interval) this.interval = interval;
    }

    /**
     * Neue Messung starten. Kann mehrfach hintereinander aufgerufen werden,
     * um mehrere Teilschritte zu messen. Die letzte Messung wird dann gestoppt
     * und eine neue Messung gestartet. Läuft gerade keine Messung, werden die
     * alten Messungen verworfen.
     * 
     * @param {string} name Name der Messumg
     * @param {string} icon Icon der Messung
     * @param {number?} interval Update-Intervall für das UI (default 100ms)
     */
    start(name, icon) {
        if (!this.running) {
            this.measurements = [];
            this.running = true;
        } else {
            this.#updateCurrentMeasurment();
        }

        this.measurements.push({
            name:      name || "",
            icon:      icon || "",
            started:   Date.now(),
            stopped:   0,
            runtime:   0,
            formatted: "",
        });

        if (!this.#intervalId) {
            this.#intervalId = window.setInterval(this.#updateCurrentMeasurment.bind(this), this.interval);
        }
    }

    /**
     * Messungen stoppen.
     */
    stop() {
        if (this.#intervalId) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }

        if (!this.running) return;
        this.running = false;

        this.#updateCurrentMeasurment();
    }

    /**
     * Aktuell laufende Messung aktualisieren. Aktualisiert die Datenfelder des letzten
     * Eintrags in `this.measurements[]`.
     */
    #updateCurrentMeasurment() {
        if (this.measurements.length > 0) {
            let lastMeasurement = this.measurements[this.measurements.length - 1];

            lastMeasurement.stopped   = Date.now();
            lastMeasurement.runtime   = lastMeasurement.stopped - lastMeasurement.started;
            lastMeasurement.formatted = this.#format(lastMeasurement.runtime);
        }
    }

    /**
     * Hilfsmethode zum Formatieren eines Zeitwerts.
     * 
     * @param {number} time Millisekunden
     * @returns {string} Sekunden mit zwei Nachkommastellen
     */
    #format(time) {
        let seconds = Math.round(time / 10) / 100.0;
        return `${this.#formatter.format(seconds)}s`;
    }
}
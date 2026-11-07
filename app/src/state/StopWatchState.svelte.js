/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {formatSeconds} from "../utils/formatter.js";

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
     * @param {string} name Name der Messung
     * @param {string} icon Icon der Messung
     * @param {number?} interval Update-Intervall für das UI (default 100ms)
     * @returns {this} Fluent API
     */
    start(name, icon) {
        if (!this.running) {
            this.measurements = [];
            this.running = true;
        } else {
            this.#updateCurrentMeasurement();
        }

        this.measurements.push({
            name:      name || "",
            icon:      icon || "",
            started:   performance.now(),
            stopped:   0,
            runtime:   0,
            formatted: "",
            status:    "running",       // running | stopped
        });

        if (!this.#intervalId) {
            this.#intervalId = window.setInterval(() => this.#updateCurrentMeasurement(), this.interval);
        }

        return this;
    }

    /**
     * Messungen stoppen.
     * @returns {this} Fluent API
     */
    stop() {
        if (this.#intervalId) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }

        if (!this.running) return;
        this.running = false;

        this.measurements.at(-1).status = "stopped";
        this.#updateCurrentMeasurement();

        return this;
    }

    /**
     * Messungen löschen.
     * @returns {this} Fluent API
     */
    reset() {
        this.measurements = []; //.splice(0);
        return this;
    }

    /**
     * Aktuell laufende Messung aktualisieren. Aktualisiert die Datenfelder des letzten
     * Eintrags in `this.measurements[]`.
     */
    #updateCurrentMeasurement() {
        if (this.measurements.length > 0) {
            let lastMeasurement = this.measurements.at(-1);

            lastMeasurement.stopped   = performance.now();
            lastMeasurement.runtime   = lastMeasurement.stopped - lastMeasurement.started;
            lastMeasurement.formatted = formatSeconds(lastMeasurement.runtime);
        }
    }
}

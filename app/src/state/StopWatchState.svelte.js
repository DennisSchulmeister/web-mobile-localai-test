/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {formatSeconds} from "../utils/formatter.js";

/**
 * A simple stopwatch for measuring the execution time of one or more steps.
 * The associated `StopWatch` component displays the measurements.
 */
export default class StopWatchState {
    /**
     * Array of objects. Each object has the following attributes:
     * 
     *  - `name`:      Measurement name
     *  - `icon`:      Measurement icon
     *  - `started`:   Measurement start time (ms since 1970)
     *  - `stopped`:   Measurement stop time (ms since 1970)
     *  - `runtime`:   Measured time in milliseconds
     *  - `formatted`: Formatted time string
     */
    measurements = $state([]);

    /**
     * Whether the measurement is running.
     */
    running = $state(false);

    /**
     * Interval for UI updates in milliseconds
     */
    interval = 100;

    /**
     * ID of the UI update timer.
     */
    #intervalId = null;

    /**
     * Constructor.
     * @param {number} interval Interval for UI updates in milliseconds (default: 100)
     */
    constructor(interval) {
        if (interval) this.interval = interval;
    }

    /**
     * Start a new measurement. Can be called multiple times in succession to
     * measure several steps. The previous measurement is stopped and a new one
     * is started. If no measurement is currently running, previous measurements
     * are discarded.
     * 
     * @param {string} name Measurement name
     * @param {string} icon Measurement icon
     * @param {number?} interval UI update interval (default 100ms)
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
     * Stop measurements.
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
     * Delete measurements.
     * @returns {this} Fluent API
     */
    reset() {
        this.measurements = []; //.splice(0);
        return this;
    }

    /**
     * Update the currently running measurement. Updates the data fields of the
     * last entry in `this.measurements[]`.
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

/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {formatInteger} from "../utils/formatter.js";
import {formatNumber}  from "../utils/formatter.js";
import {formatSeconds} from "../utils/formatter.js";

/**
 * Helper class for calculating common statistics such as tokens per second
 * during text generation. The statistics can be displayed in the UI with the
 * `StopWatch` component.
 */
export default class TextGenerationStatsState {
    /**
     * All statistics as a list for the `StopWatch` component.
     */
    values = $state([
        {
            name:      "Tokens",
            icon:      "bi-braces",
            value:     0,
            formatted: "",
        },
        {
            name:      "Erstes Token",
            icon:      "bi-stopwatch",
            value:     0.0,
            formatted: "",
        },
        {
            name:      "Tokens/Sek",
            icon:      "bi-speedometer",
            value:     0.0,
            formatted: "",
        },
    ]);

    /**
     * Number of generated tokens
     */
    numberTokens = this.values[0];

    /**
     * Time in seconds until the first token
     */
    timeToFirstToken = this.values[1];

    /**
     * Generated tokens per second (excluding prompt processing and therefore
     * measured only after the first token).
     */
    tokensPerSec = this.values[2];

    /**
     * Timestamps and counters for calculating statistics
     */
    startedAt    = 0;
    firstTokenAt = 0;
    finishedAt   = 0;
    tokenCount   = 0;

    /**
     * Start a new measurement.
     * @returns {this} Fluent API
     */
    start() {
        this.startedAt    = performance.now();
        this.firstTokenAt = 0;
        this.lastTokenAt  = 0;
        this.tokenCount   = 0;

        for (let value of this.values) {
            value.value     = 0.0;
            value.formatted = "";
        }

        return this;
    }

    /**
     * Update the measurement when new tokens are available. To save processing time,
     * `recalc` controls whether only the internal counters are updated or all metrics
     * are recalculated.
     * 
     * @param {Array} numTokens Number of tokens generated in the meantime
     * @param {boolean} recalc Recalculate all metrics
     * @returns {this} Fluent API
     */
    update(numTokens, recalc) {
        let now = performance.now();

        if (numTokens) {
            if (this.firstTokenAt == 0) this.firstTokenAt = now;

            this.lastTokenAt  = now;
            this.tokenCount  += numTokens;
        }

        if (recalc) this.#recalc();
        return this;
    }

    /**
     * Stop the measurement.
     * @returns {this} Fluent API
     */
    stop() {
        this.#recalc();
        return this;
    }

    /**
     * Recalculate metrics displayed in the UI.
     */
    #recalc() {
        this.numberTokens.value     = this.tokenCount;
        this.numberTokens.formatted = formatInteger(this.numberTokens.value);
        
        if (this.firstTokenAt) {
            this.timeToFirstToken.value     = (this.firstTokenAt - this.startedAt);
            this.timeToFirstToken.formatted = formatSeconds(this.timeToFirstToken.value);
        }

        let duration = this.lastTokenAt - this.firstTokenAt;

        if (duration && this.tokenCount) {
            this.tokensPerSec.value     = this.tokenCount / (duration / 1000.0);
            this.tokensPerSec.formatted = formatNumber(this.tokensPerSec.value);
        }
    }
}

/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {formatInteger} from "../utils/formatter.js";
import {formatNumber}  from "../utils/formatter.js";
import {formatSeconds} from "../utils/formatter.js";

/**
 * Hilfsklasse zur Berechnung typischer Statistiken wie Tokens/Sekunde während
 * der Textgenerierung. Die Statistiken können mit der `StopWatch`-Komponenten
 * im UI angezeigt werden.
 */
export default class TextGenerationStatsState {
    /**
     * Alle Statistiken als Liste für die `StopWatch`-Komponente.
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
     * Anzahl generierter Tokens
     */
    numberTokens = this.values[0];

    /**
     * Zeit in Sekunden bis zum ersten Token
     */
    timeToFirstToken = this.values[1];

    /**
     * Generierte Tokens je Sekunde (ohne Verarbeitung des Prompts und
     * daher erst ab dem ersten Token gemessen).
     */
    tokensPerSec = this.values[2];

    /**
     * Zeitstempel und Zähler zum Berechnen der Statistiken
     */
    startedAt    = 0;
    firstTokenAt = 0;
    finishedAt   = 0;
    tokenCount   = 0;

    /**
     * Neue Messung starten.
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
     * Messung aktualisieren, sobald neue Tokens vorliegen. Um Performance einzusparen
     * kann mit `recalc` gesteuert werden, ob nur die internen Zähle aktualisiert oder
     * alle Kennzahlen vollständig neu gerechnet werden.
     * 
     * @param {Array} tokens Zwischenzeitlich generierte Tokens
     * @param {boolean} recalc Kennzahlen vollständig neu rechnen
     * @returns {this} Fluent API
     */
    update(tokens, recalc) {
        let now = performance.now();

        if (tokens.length) {
            if (this.firstTokenAt == 0) this.firstTokenAt = now;

            this.lastTokenAt  = now;
            this.tokenCount  += tokens.length;
        }

        if (recalc) this.#recalc();
        return this;
    }

    /**
     * Messung beenden.
     * @returns {this} Fluent API
     */
    stop() {
        this.#recalc();
        return this;
    }

    /**
     * Im UI sichtbare Kennzahlen neurechnen.
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

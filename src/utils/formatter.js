/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Zahlenformatierung mit zwei Nachkommastellen fest.
 */
export const numberFormatter = new Intl.NumberFormat("de-DE", {minimumFractionDigits: 2, maximumFractionDigits: 2});

/**
 * Zahlformatierung für Ganzzahlen
 */
export const integerFormatter = new Intl.NumberFormat("de-DE", {minimumFractionDigits: 0, maximumFractionDigits: 0});

/**
 * Formatierung einer Ganzzahl.
 * 
 * @param {number} number Zahl
 * @returns {string} Formatierte Zahl
 */
export function formatInteger(number) {
    return integerFormatter.format(number);
}

/**
 * Formatierung einer Kommazahl ohne Umrechnung.
 * 
 * @param {number} number Zahl
 * @returns {string} Formatierte Zahl
 */
export function formatNumber(number) {
    return numberFormatter.format(number);
}

/**
 * Formatieren eines Zeitwerts, gemessen in Millisekunden, formatiert in Sekunden.
 * 
 * @param {number} number Millisekunden
 * @returns {string} Sekunden mit zwei Nachkommastellen
 */
export function formatSeconds(number) {
    let seconds = Math.round(number / 10) / 100.0;
    return `${numberFormatter.format(seconds)}s`;
}

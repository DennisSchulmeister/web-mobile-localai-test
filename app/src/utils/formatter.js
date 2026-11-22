/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Format a number with two decimal places.
 */
export const numberFormatter = new Intl.NumberFormat("de-DE", {minimumFractionDigits: 2, maximumFractionDigits: 2});

/**
 * Format an integer.
 */
export const integerFormatter = new Intl.NumberFormat("de-DE", {minimumFractionDigits: 0, maximumFractionDigits: 0});

/**
 * Format an integer.
 * 
 * @param {number} number Number
 * @returns {string} Formatted number
 */
export function formatInteger(number) {
    return integerFormatter.format(number);
}

/**
 * Format a decimal number without conversion.
 * 
 * @param {number} number Number
 * @returns {string} Formatted number
 */
export function formatNumber(number) {
    return numberFormatter.format(number);
}

/**
 * Format a time value measured in milliseconds as seconds.
 * 
 * @param {number} number Milliseconds
 * @returns {string} Seconds with two decimal places
 */
export function formatSeconds(number) {
    let seconds = Math.round(number / 10) / 100.0;
    return `${numberFormatter.format(seconds)}s`;
}

/**
 * Format a time value measured in milliseconds as a duration string expected
 * by the testrun API.
 * 
 * @param {number} number Milliseconds
 * @returns {string} Time duration string
 */
export function formatDuration(number) {
    let totalMicroseconds = Math.round(Math.abs(number) * 1000);
    let hours             = Math.floor(totalMicroseconds / 3_600_000_000);
    let minutes           = Math.floor(totalMicroseconds / 60_000_000) % 60;
    let seconds           = Math.floor(totalMicroseconds / 1_000_000) % 60;
    let microseconds      = totalMicroseconds % 1_000_000;
    let sign              = number < 0 ? "-" : "";

    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(microseconds).padStart(6, "0")}`;
}

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

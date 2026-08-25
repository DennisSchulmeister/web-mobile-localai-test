/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from "chalk";

/**
 * Fehlermeldung auf der Konsole ausgeben.
 * @param {string} message Meldungstext
 */
export function logError(message) {
    console.error(`${chalk.bold.red("FEHLER: ")} ${message}`);
}

/**
 * Warnmeldung auf der Konsole ausgeben.
 * @param {string} message Meldungstext
 */
export function logWarning(message) {
    console.log(`${chalk.bold.blue("WARNUNG: ")} ${message}`);
}
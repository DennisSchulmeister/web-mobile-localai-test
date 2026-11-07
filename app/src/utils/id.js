/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Zufällige ID zum Beispiel für stabile Listen in Svelte erzeugen.
 * 
 * @param {number} len Länge (Default: 6)
 * @returns {string} Zufällige ID
 */
export function randomId(len = 6) {
	const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array.from({ length: len }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
}

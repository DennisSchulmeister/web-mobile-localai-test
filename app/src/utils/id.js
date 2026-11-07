/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Generate a random ID, for example, for stable lists in Svelte.
 * 
 * @param {number} len Length (default: 6)
 * @returns {string} Random ID
 */
export function randomId(len = 6) {
	const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array.from({ length: len }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
}

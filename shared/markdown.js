/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fromMarkdown} from "mdast-util-from-markdown";
import {toMarkdown}   from "mdast-util-to-markdown";

/**
 * Markdown-Text parsen und mit Hilfe von `remark` einen Syntaxbaum
 * daraus erstellen. Dies dient als Grundlage für die nachfolgenden
 * Funktionen zur Arbeit mit den Markdown-Inhalten.
 * 
 * Siehe: https://github.com/syntax-tree/mdast
 * 
 * @param {string} mdText Text im Markdown-Format
 * @returns {object} Syntaxbaum des Dokuments
 */
export function parseMarkdown(mdText) {
    return fromMarkdown(mdText);
}

/**
 * Vereinfachen des Markdown-Inhalts, damit dieser besser von den KI-Modellen
 * verarbeitet werden kann:
 * 
 * - Hierfür werden alle Formatierungen für Fett und Kursiv entfernt.
 * - Links werden durch ihren Text ersetzt.
 * - Bilder, Tabellen, Codeblöcke und HTML-Blöcke werden entfernt.
 * 
 * @param {object} mdAst Syntaxbaum des Dokuments
 * @returns {object} Dieselbe Syntaxbaum-Instanz
 */
export function simplifyMarkdown(mdAst) {
    // TODO
    return mdAst;
}

/**
 * Markdown-Syntaxbaum zurück in einen String umwandeln.
 * 
 * @param {object} mdAst Syntaxbaum des Dokuments
 * @returns {string} Text im Markdown-Format
 */
export function stringifyMarkdown(mdAst) {
    return toMarkdown(mdAst);
}
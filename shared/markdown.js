/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fromMarkdown} from "mdast-util-from-markdown";
import {toMarkdown}   from "mdast-util-to-markdown";
import {toString}     from "mdast-util-to-string";
import {remove}       from "unist-util-remove";

/**
 * Markdown-Text parsen und mit Hilfe von `mdast` einen Syntaxbaum
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
    remove(mdAst, ["code", "definition", "html", "image", "imageReference", "thematicBreack"]);

    if (["strong", "emphasis", "link", "linkReference"].includes(mdAst.type)) {
        mdAst.value    = toString(mdAst);
        mdAst.type     = "text";
        mdAst.children = [];

        delete mdAst.title;
        delete mdAst.url;
        delete mdAst.identifier;
        delete mdAst.label;
        delete mdAst.referenceType;
    }

    return mdAst;
}

/**
 * Markdown-Syntaxbaum in einen String zurück wandeln.
 * 
 * @param {object} mdAst Syntaxbaum des Dokuments
 * @returns {string} Text im Markdown-Format
 */
export function stringifyMarkdown(mdAst) {
    return toMarkdown(mdAst);
}

/**
 * In einem Array mit Strings alle Zeilenumbrücke durch
 * Leerzeichen ersetzen.
 * 
 * @param {Array} strings Array mit Strings
 * @returns Modifiziertes Array mit Strings
 */
export function replaceLineBreaks(strings) {
    for (let i in strings) {
        strings[i] = strings[i].replaceAll("\r\n", "\n");
        strings[i] = strings[i].replaceAll("\r",   "\n");
        strings[i] = strings[i].replaceAll("\n",   " ");
    }

    return strings;
}
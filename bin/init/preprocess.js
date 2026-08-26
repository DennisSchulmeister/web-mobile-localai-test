/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs                  from "node:fs/promises";
import path                from "node:path";
import process             from "node:process";
import {SentenceTokenizer} from "natural/lib/natural/tokenizers/index.js";
import {toString}          from "mdast-util-to-string";
import shell               from "shelljs";

import * as utils          from "../utils.js";
import * as md             from "../../shared/markdown.js";

console.log("Daten vorverarbeiten");
console.log("====================");
console.log("");

// Konfiguration einlesen
if (process.argv.length < 3) {
    utils.logError("Zu wenig Kommandozeilenparameter!");
    utils.logError(`Aufruf: ${process.argv[0]} ${process.argv[1]} <config.json>`);
    process.exit(1);
}

let config = utils.readConfig({
    configFile: process.argv[2],
    withData:   true,
});

for (let category of config.data.config) {
    for (let page of category.pages) {
        try {
            console.log(`» ${page.file}`);

            let mdText    = shell.cat(page.file).toString();
            let mdAst     = md.parseMarkdown(mdText);
            let keywords  = md.replaceLineBreaks(extractKeywords(mdAst, [page.title]));
            let sentences = md.replaceLineBreaks(extractSentences(md.simplifyMarkdown(mdAst), []));

            let paths = utils.preprocessPaths(config, page._file);
            shell.mkdir("-p", paths.dir);

            await fs.writeFile(paths.keywords,  JSON.stringify([...new Set(keywords).values()], null, 4));
            await fs.writeFile(paths.sentences, JSON.stringify(sentences, null, 4));
        } catch (error) {
            utils.logError(error.toString());
        }
    }
}

/**
 * Schlüsselwörter für die semantische Suche aus dem übergebenen
 * Markdown-Syntaxbaum extrahieren. Der Einfachheit halber werden
 * hier einfach alle Überschriften und direkt formatierten Texte
 * (Fett, Kursiv) verwendet.
 * 
 * @param {object} mdAst Teil-Syntaxbaum des Dokuments
 * @param {Array} keywords Schon vorhandene Schlüsselwörter
 * @returns {Array} Erweiterte Schlüsselwörter
 */
function extractKeywords(mdAst, keywords) {
    if (["strong", "emphasis", "heading"].includes(mdAst.type)) {
        keywords = [...keywords, toString(mdAst)];
    } else {
        for (let child of mdAst.children || []) {
            keywords = extractKeywords(child, keywords);
        }
    }

    return keywords;
}

/**
 * Formatierung entferne und den Text in Sätze für das Question
 * Answering und die Volltextsuche splitten.
 * 
 * @param {object} mdAst Teil-Syntaxbaum des Dokuments
 * @param {Array} sentences Schon vorhandene Sätze
 * @returns {Array} Erweiterte Sätze
 */
function extractSentences(mdAst, sentences) {
    if (mdAst.type === "paragraph") {
        let text = toString(mdAst);
        let tokenizer = new SentenceTokenizer();
        sentences = [...sentences, ...tokenizer.tokenize(text)];
    } else {
        for (let child of mdAst.children || []) {
            sentences = extractSentences(child, sentences);
        }
    }

    return sentences;
}
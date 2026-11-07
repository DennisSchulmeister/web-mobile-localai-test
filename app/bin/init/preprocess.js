/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs                  from "node:fs/promises";
import process             from "node:process";
import {SentenceTokenizer} from "natural/lib/natural/tokenizers/index.js";
import {toString}          from "mdast-util-to-string";
import shell               from "shelljs";

import * as utils          from "../utils.js";
import * as md             from "../../shared/markdown.js";

console.log("Preprocess Data");
console.log("================");
console.log("");

// Read the configuration.
if (process.argv.length < 3) {
    utils.logError("Too few arguments!");
    utils.logError(`Usage: ${process.argv[0]} ${process.argv[1]} <config.json>`);
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
 * Extract keywords for semantic search from the provided Markdown syntax tree.
 * For simplicity, all headings and directly formatted text (bold, italic) are used.
 * 
 * @param {object} mdAst Partial document syntax tree
 * @param {Array} keywords Existing keywords
 * @returns {Array} Extended keywords
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
 * Remove formatting and split the text into sentences for question answering
 * and full-text search.
 * 
 * @param {object} mdAst Partial document syntax tree
 * @param {Array} sentences Existing sentences
 * @returns {Array} Extended sentences
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

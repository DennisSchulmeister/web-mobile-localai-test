/**
 * Web/Mobile Test for Local AI
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
 * Parse Markdown text and create a syntax tree with `mdast`. This serves as the
 * basis for the following functions that work with Markdown content.
 * 
 * See: https://github.com/syntax-tree/mdast
 * 
 * @param {string} mdText Text in Markdown format
 * @returns {object} Document syntax tree
 */
export function parseMarkdown(mdText) {
    return fromMarkdown(mdText);
}

/**
 * Simplify Markdown content so that AI models can process it more effectively:
 * 
 * - Remove all bold and italic formatting.
 * - Replace links with their text.
 * - Replace headings with paragraphs.
 * - Remove images, tables, code blocks, and HTML blocks.
 * 
 * @param {object} mdAst Document syntax tree
 * @returns {object} The same syntax tree instance
 */
export function simplifyMarkdown(mdAst) {
    remove(mdAst, ["code", "definition", "html", "image", "imageReference", "thematicBreack"]);

    function _simplify(node) {
        if (["strong", "emphasis", "link", "linkReference"].includes(mdAst.type)) {
            node.value    = toString(node);
            node.type     = "text";
            node.children = [];
    
            delete node.title;
            delete node.url;
            delete node.identifier;
            delete node.label;
            delete node.referenceType;
        } else if (node.type === "heading") {
            node.type = "paragraph";
            delete node.depth;
        }

        for (let child of node.children || []) {
            _simplify(child);
        }

        return node;
    }

    return _simplify(mdAst);
}

/**
 * Convert a Markdown syntax tree back into a string.
 * 
 * @param {object} mdAst Document syntax tree
 * @returns {string} Text in Markdown format
 */
export function stringifyMarkdown(mdAst) {
    return toMarkdown(mdAst);
}

/**
 * Replace all line breaks in an array of strings with spaces.
 * 
 * @param {Array} strings Array of strings
 * @returns Modified array of strings
 */
export function replaceLineBreaks(strings) {
    for (let i in strings) {
        strings[i] = strings[i].replaceAll("\r\n", "\n");
        strings[i] = strings[i].replaceAll("\r",   "\n");
        strings[i] = strings[i].replaceAll("\n",   " ");
    }

    return strings;
}

/**
 * Adjust relative URLs in the document so they also work within the web application,
 * where Markdown documents are located in a subdirectory of the SPA.
 * 
 * @param {object} mdAst Object syntax tree
 * @param {string} urlPrefix Prefix for relative URLs
 * @returns {object} The same syntax tree instance
 */
export function fixRelativeUrls(mdAst, urlPrefix) {
    if (mdAst.url && !mdAst.url.includes("://") && !mdAst.url.startsWith("/")) {
        mdAst.url = `${urlPrefix}${mdAst.url}`;
    }

    for (let child of mdAst.children || []) {
        fixRelativeUrls(child, urlPrefix);
    }

    return mdAst;
}

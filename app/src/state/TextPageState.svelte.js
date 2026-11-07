/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as md from "../../shared/markdown.js";

/**
 * Categories, available pages, and the current page's content.
 */
class TextPageState {
    categories  = $state([]);
    currentPage = $state({file: "", content: "", simplified: "", language: ""});
    wordCount   = $derived.by(this.estimateWordCount.bind(this));

    /**
     * Load `data/index.json`, which lists the text pages for each category.
     * This updates the reactive `categories` attribute.
     */
    async reloadCategories() {
        this.categories = await (await fetch("data/index.json")).json();
    }

    /**
     * Load the Markdown file containing the current page's content.
     * This updates the reactive `currentPage` attribute.
     * 
     * @param {string} pageFile Markdown path
     */
    async setCurrentPage(pageFile) {
        this.currentPage.content    = "";
        this.currentPage.simplified = "";
        this.currentPage.language   = "";
        this.currentPage.file       = pageFile;

        try {
            let pageDir = `data/${pageFile.split("/").slice(0, -1).join("/")}/`;
            let content = await (await fetch(`data/${pageFile}`)).text();
            let mdAst   = md.fixRelativeUrls(md.parseMarkdown(content), pageDir);
            
            this.currentPage.content    = md.stringifyMarkdown(mdAst);
            this.currentPage.simplified = md.stringifyMarkdown(md.simplifyMarkdown(mdAst));

            let page = this.findTextPage(pageFile);
            this.currentPage.language = page?.language || "";
        } catch (error) {
            this.currentPage.content  = error.toString();
            this.currentPage.language = "en";
            throw error;
        }
    }

    /**
     * Estimate the number of words in the current Markdown file.
     * @returns {number} Estimated number of words
     */
    estimateWordCount() {
        let text       = (this.currentPage.content || "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
        let count      = 0;
        let whitespace = true;
    
        for (let i = 0; i < text.length; i++) {
            let c = this.currentPage.content[i];

            if ([" ", "\t", "\n"].includes(c)) {
                if (!whitespace) count++;
                whitespace = true;
            } else {
                whitespace = false;
            }
        }

        if (count === 0 && this.currentPage.content) count = 1;
        return count;
    }

    /**
     * Find a page's index entry.
     * 
     * @param {string} pageFile Page file name
     * @returns Index entry with the page title
     */
    findTextPage(pageFile) {
        for (let category of this.categories || []) {
            for (let page of category.pages || []) {
                if (page.file === pageFile) return page;
            }
        }
    }

    /**
     * Get the URL for displaying a text page.
     * 
     * @param {string} pageFile Page file name
     * @returns URL for display
     */
    getTextPageUrl(pageFile) {
        return `#/page/${pageFile}/content`;
    }
}

export default new TextPageState();
/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as md from "../../shared/markdown.js";

/**
 * Kategorien, verfügbare Seiten und Inhalt der aktuellen Seite.
 */
class TextPageState {
    categories  = $state([]);
    currentPage = $state({file: "", content: "", simplified: "", language: ""});
    wordCount   = $derived.by(this.estimateWordCount.bind(this));

    /**
     * Datei `data/index.json` mit der Liste der Textseiten je Kategorie laden.
     * Dies verändert das reaktive Attribut `categories`.
     */
    async reloadCategories() {
        this.categories = await (await fetch("data/index.json")).json();
    }

    /**
     * Markdown-Datei mit dem darzustellenden Inhalt der aktuellen Seite laden.
     * Dies verändert das reaktive Attribute `currentPage`.
     * 
     * @param {string} pageFile Markdown-Pfad
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
     * Anzahl Wörter der aktuellen Markdown-Datei schätzen.
     * @returns {number} Geschätzte Anazhl Wörter
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
     * Indexeintrag eienr Seite finden.
     * 
     * @param {string} pageFile Dateiname der Seite
     * @returns Indexeintrag mit Seitentitel
     */
    findTextPage(pageFile) {
        for (let category of this.categories || []) {
            for (let page of category.pages || []) {
                if (page.file === pageFile) return page;
            }
        }
    }

    /**
     * URL zur Anzeige einer Textseite ermitteln.
     * 
     * @param {string} pageFile Dateiname der Seite
     * @returns URL zur Anzeige
     */
    getTextPageUrl(pageFile) {
        return `#/page/${pageFile}/content`;
    }
}

export default new TextPageState();
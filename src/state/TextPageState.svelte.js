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
    currentPage = $state({file: "", content: ""});

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
        this.currentPage.content = "";
        this.currentPage.file    = pageFile;

        try {
            let pageDir = `data/${pageFile.split("/").slice(0, -1).join("/")}/`;
            let content = await (await fetch(`data/${pageFile}`)).text();
            let mdAst   = md.fixRelativeUrls(md.parseMarkdown(content), pageDir);
            
            this.currentPage.content = md.stringifyMarkdown(mdAst);
        } catch (error) {
            this.currentPage.content = error.toString();
            throw error;
        }
    }

    /**
     * Indexeintrag eienr Seite finden.
     * 
     * @param {string} file Dateiname der Seite
     * @returns Indexeintrag mit Seitentitel
     */
    findTextPage(file) {
        for (let category of this.categories || []) {
            for (let page of category.pages || []) {
                if (page.file === file) return page;
            }
        }
    }

    /**
     * URL zur Anzeige einer Textseite ermitteln.
     * 
     * @param {string} file Dateiname der Seite
     * @returns URL zur Anzeige
     */
    getTextPageUrl(file) {
        return `#/page/${file}/content`;
    }
}

export default new TextPageState();
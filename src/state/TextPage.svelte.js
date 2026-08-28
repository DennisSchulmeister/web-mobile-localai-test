/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

export const textPages = $state({
    /**
     * Inhalt der Datei `data/index.json`.
     */
    categories: [],

    /**
     * Dateiname der aktuellen Textseite. Kann von außen gesetzt werden, um
     * eine neue Seite zu laden.
     */
    currentPageFile: "",

    /**
     * Markdown-Inhalt der aktuellen Seite.
     */
    currentPageContent: "",
});

/**
 * Datei `data/index.json` mit der Liste der Textseiten je Kategorie laden.
 */
export async function loadCategories() {
    textPages.categories = await (await fetch("data/index.json")).json();
    // TODO: Bild-URLs prefixen
}

/**
 * Markdown-Inhalt der aktuellen Seite. Wird in Abhängigkeit von `currentPageFile`
 * automatisch versorgt. => TODO: Funktioniert so nicht.
 */
$derived.by(async () => {
    try {
        if (textPages.currentPageFile.file) {
            let content = await (await fetch(`data/${textPages.currentPageFile.file}`)).text();
            textPages.currentPageContent = content;
        } else {
            textPages.currentPageContent = "";
        }
    } catch (error) {
        console.error(error);
        textPages.currentPageContent = error.toString();
    }
});


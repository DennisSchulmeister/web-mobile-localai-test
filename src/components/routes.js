/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap}            from "svelte-spa-router/wrap";
import {navigationState} from "../state/Navigation.svelte.js";

export default {
    "/": wrap({
        asyncComponent: () => import("./pages/Home.svelte"),
        conditions: [() => {
            navigationState.backLink       = "";
            navigationState.pageTitle      = "Home";
            navigationState.subPages       = getHomeSubPages("overview");
            navigationState.currentSubPage = "";
            return true;
        }],
    }),

    "*": wrap({
        asyncComponent: () => import("./pages/NotFound.svelte"),
        conditions: [() => {
            navigationState.backLink       = "#/";
            navigationState.pageTitle      = "Nicht gefunden";
            navigationState.subPages       = [];
            navigationState.currentSubPage = "";
            return true;
        }],
    }),
};

/**
 * Footer-Menü für die Home-Seite.
 * @returns {Array} Array mit Unterseiten
 */
function getHomeSubPages() {
    return [
        {
            id:     "overview",
            icon:   "bi-card-list",
            label:  "Übersicht",
            url:    "#/",
        },
        {
            id:     "search",
            icon:   "bi-search",
            label:  "Suche",
            url:    "#/search",
        },
    ];
}

/**
 * Footer-Menü für die TextPage-Seite.
 * 
 * @param {string} textPageId Sichtbare Textseite
 * @returns {Array} Array mit Unterseiten
 */
function getTextPageSubPages(textPageId) {
    return [
        {
            id:     "content",
            icon:   "bi-text-left",
            label:  "Inhalt",
            url:    `#/page/${textPageId}`,
        },
        {
            id:     "summary",
            icon:   "bi-list-ol",
            label:  "Zusammenfassen",
            url:    `#/page/${textPageId}/summary`,
        },
        {
            id:     "qa",
            icon:   "bi-chat",
            label:  "Fragen beantworten",
            url:    `#/page/${textPageId}/qa`,
        },
        {
            id:     "translation",
            icon:   "bi-translate",
            label:  "Übersetzen",
            url:    `#/page/${textPageId}/translation`,
        },
        {
            id:     "tts",
            icon:   "bi-speaker",
            label:  "Vorlesen",
            url:    `#/page/${textPageId}/tts`,
        },
    ];
}
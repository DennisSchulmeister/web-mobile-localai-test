/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 * Lizenziert unter CC0
 */

import { wrap }        from "svelte-spa-router/wrap";
import { navBarState } from "../state/NavBar.svelte.js";

export default {
    "/": wrap({
        asyncComponent: () => import("./pages/Home.svelte"),
        conditions: [() => {
            navBarState.backLink  = "";
            navBarState.pageTitle = "Home";
            return true;
        }],
    }),

    "/question-answering": wrap({
        asyncComponent: () => import("./pages/QuestionAnswering.svelte"),
        conditions: [() => {
            navBarState.backLink  = "#/";
            navBarState.pageTitle = "Fragen beantworten";
            return true;
        }],
    }),

    "/semantic-search": wrap({
        asyncComponent: () => import("./pages/SemanticSearch.svelte"),
        conditions: [() => {
            navBarState.backLink  = "#/";
            navBarState.pageTitle = "Semantische Suche";
            return true;
        }],
    }),

    "/summary": wrap({
        asyncComponent: () => import("./pages/Summary.svelte"),
        conditions: [() => {
            navBarState.backLink  = "#/";
            navBarState.pageTitle = "Zusammenfassung";
            return true;
        }],
    }),

    "/text-to-speach": wrap({
        asyncComponent: () => import("./pages/TextToSpeach.svelte"),
        conditions: [() => {
            navBarState.backLink  = "#/";
            navBarState.pageTitle = "Sprachausgabe";
            return true;
        }],
    }),

    "*": wrap({
        asyncComponent: () => import("./pages/NotFound.svelte"),
        conditions: [() => {
            navBarState.backLink  = "#/";
            navBarState.pageTitle = "Nicht gefunden";
            return true;
        }],
    }),
};
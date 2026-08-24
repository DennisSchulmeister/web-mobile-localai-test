/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 * Lizenziert unter CC0
 */

import { wrap }        from "svelte-spa-router/wrap";
import { navBarState } from "../state/NavBar.svelte.js";

export default {
    "/": wrap({
        asyncComponent: () => import("./pages/HomePage.svelte"),
        conditions: [() => {
            navBarState.backLink  = "";
            navBarState.pageTitle = "Home";
            return true;
        }],
    }),

    "*": wrap({
        asyncComponent: () => import("./pages/NotFoundPage.svelte"),
        conditions: [() => {
            navBarState.backLink  = "#/";
            navBarState.pageTitle = "Nicht gefunden";
            return true;
        }],
    }),
};
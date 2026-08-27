/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {router}          from "svelte-spa-router";
import {wrap}            from "svelte-spa-router/wrap";
import {navigationState} from "../state/Navigation.svelte.js";

const routes = new Map();
export default routes;

// Home mit Unterseiten
routes.set(/^\/(search)?$/, wrap({
    asyncComponent: () => import("./pages/Home.svelte"),
}));

// Textseite mit Unterseiten
routes.set(/^\/page\/(.*)\/(content|summary|qa|translation|tts)$/, wrap({
    asyncComponent: () => import("./pages/TextPage.svelte"),
}));

// Fehler 404
routes.set("*", wrap({
    asyncComponent: () => import("./pages/NotFound.svelte"),
}));

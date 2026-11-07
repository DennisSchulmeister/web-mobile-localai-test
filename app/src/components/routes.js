/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from "svelte-spa-router/wrap";

const routes = new Map();
export default routes;

// Home page with subpages
routes.set(/^\/(search|chat|info)?$/, wrap({
    asyncComponent: () => import("./pages/HomePage.svelte"),
}));

// Text page with subpages
routes.set(/^\/page\/(.*)\/(content|summary|qa|translation|chat)$/, wrap({
    asyncComponent: () => import("./pages/TextPage.svelte"),
}));

// 404 error
routes.set("*", wrap({
    asyncComponent: () => import("./pages/NotFoundPage.svelte"),
}));

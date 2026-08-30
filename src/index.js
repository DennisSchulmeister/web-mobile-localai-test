/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {mount}           from "svelte";

import ApplicationFrame  from "./components/app-frame/ApplicationFrame.svelte";
import modelState        from "./state/ModelState.svelte.js";
import textPageState     from "./state/TextPageState.svelte.js";

import "@picocss/pico/css/pico.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";

await modelState.reloadModelConfiguration();
await textPageState.reloadCategories();

mount(ApplicationFrame, {target: document.body});
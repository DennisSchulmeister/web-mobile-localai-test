/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TextStreamer}    from "@huggingface/transformers";

import modelState        from "../../../state/ModelState.svelte";
import StopWatchState    from "../../../state/StopWatchState.svelte.js";
import textPageState     from "../../../state/TextPageState.svelte.js";

/**
 * Gesicherter Zustand für die "Übersetzen" Seite, damit dieser bei der
 * Navigation nicht verloren geht.
 */
class TranslationPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready")
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    result          = $state("");

    /**
     * Text übersetzen
     */
    async execute() {
        try {
            if (!modelState.loadedModel.status === "ready") return;
            if (!modelState.loadedModel.task === "translation") return;
    
            this.stopWatchState.start("Antwort", "bi-pen");

            this.result       = true;
            this.answer       = "";
            this.errorMessage = "";

            // Kleine Pause, damit wenigstens der Loading-State im UI erscheint!
            await new Promise(resolve => window.setTimeout(resolve, 500));

            // TODO

            this.stopWatchState.stop();
            this.working = false;
        } catch (error) {
            this.errorMessage = error.toString();
            this.working      = false;

            this.stopWatchState.stop();
            throw error;
        }
    }
}

export default new TranslationPageState();
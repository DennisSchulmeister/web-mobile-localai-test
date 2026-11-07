/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import modelState     from "../../../state/ModelState.svelte";
import StopWatchState from "../../../state/StopWatchState.svelte.js";
import textPageState  from "../../../state/TextPageState.svelte.js";

/**
 * Persistent state for the "Translate" page so it is not lost during navigation.
 */
class TranslationPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready" || modelState.loadedModel.task !== "translation")
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    sourceLanguage  = $derived(textPageState.currentPage.language);
    targetLanguage  = $state("");
    result          = $derived(textPageState.currentPage.file ? "" : "");

    /**
     * Translate text.
     */
    async execute() {
        try {
            if (this.disabled) return;
    
            this.stopWatchState.start("Antwort", "bi-pen");

            this.working      = true;
            this.result       = "";
            this.errorMessage = "";

            // Briefly yield so the loading state can appear in the UI.
            await new Promise(resolve => window.setTimeout(resolve, 500));

            this.result = await modelState.loadedModel.backend.runTranslationPipeline({
                input:          textPageState.currentPage.simplified,
                sourceLanguage: this.sourceLanguage,
                targetLanguage: this.targetLanguage,
            });

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

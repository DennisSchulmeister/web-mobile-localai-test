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
 * Persistent state for the "Summarize" page so it is not lost during navigation.
 */
class SummaryPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready" || modelState.loadedModel.task !== "summarization")
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    answer          = $derived(textPageState.currentPage.file ? "" : "");
    minTokens       = $state(10);
    maxTokens       = $derived(textPageState.wordCount);
    maxNewTokens    = $derived(Math.round(this.maxTokens * 0.5));

    /**
     * Summarize text.
     */
    async execute() {
        try {
            if (this.disabled) return;
    
            this.stopWatchState.start("Antwort", "bi-pen");

            this.working      = true;
            this.answer       = "";
            this.errorMessage = "";

            // Briefly yield so the loading state can appear in the UI.
            await new Promise(resolve => window.setTimeout(resolve, 500));

            this.answer = await modelState.loadedModel.backend.runSummaryPipeline({
                input:        textPageState.currentPage.simplified,
                maxNewTokens: this.maxNewTokens,
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

export default new SummaryPageState();

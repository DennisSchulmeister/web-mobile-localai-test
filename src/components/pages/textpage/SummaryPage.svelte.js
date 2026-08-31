/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TextStreamer} from "@huggingface/transformers";

import modelState     from "../../../state/ModelState.svelte";
import StopWatchState from "../../../state/StopWatchState.svelte.js";
import textPageState  from "../../../state/TextPageState.svelte.js";

/**
 * Gesicherter Zustand für die "Zusammenfassen" Seite, damit dieser bei der
 * Navigation nicht verloren geht.
 */
class SummaryPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready")
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    answer          = $derived(textPageState.currentPage.file ? "" : "");
    minTokens       = $state(10);
    maxTokens       = $derived(textPageState.wordCount * 3);
    maxNewTokens    = $derived(this.maxTokens * 0.5);

    /**
     * Text zusammenfassen
     */
    async execute() {
        try {
            if (!modelState.loadedModel.status === "ready") return;
            if (!modelState.loadedModel.task === "summarization") return;
    
            this.stopWatchState.start("Antwort", "bi-pen");

            this.working     = true;
            this.answer       = "";
            this.errorMessage = "";

            // Kleine Pause, damit wenigstens der Loading-State im UI erscheint!
            await new Promise(resolve => window.setTimeout(resolve, 500));

            let prompt = textPageState.currentPage.simplified;

            if (modelState.loadedModel.config?.prefix) {
                prompt = `${modelState.loadedModel.config?.prefix} ${prompt}`;
            }

            let streamer = new TextStreamer(modelState.model.tokenizer, {
                skip_prompt: true,
                callback_function: (text) => this.answer += text,
            });

            let answer = await modelState.model(prompt, {
                max_new_tokens: this.maxNewTokens,
                do_sample:      false,
                streamer:       streamer,
            });

            this.answer = answer?.[0]?.summary_text || "";

            if (!this.answer) {
                console.error("Ungültige Antort des Modells", answer);
                this.errorMessage = "Das Modell hat keinen Text erzeugt";
            }

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
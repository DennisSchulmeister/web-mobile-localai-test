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
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready" || modelState.loadedModel.task !== "translation")
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    src_language    = $derived(textPageState.currentPage.language);
    dst_language    = $state("");
    result          = $derived(textPageState.currentPage.file ? "" : "");

    /**
     * Text übersetzen
     */
    async execute() {
        try {
            if (this.disabled) return;
    
            this.stopWatchState.start("Antwort", "bi-pen");

            this.working      = true;
            this.result       = "";
            this.errorMessage = "";

            // Kleine Pause, damit wenigstens der Loading-State im UI erscheint!
            await new Promise(resolve => window.setTimeout(resolve, 500));

            let streamer = new TextStreamer(modelState.model.tokenizer, {
                skip_prompt: true,
                callback_function: (text) => this.result += text,
            });

            let answer = await modelState.model(textPageState.currentPage.simplified, {
                src_lang: this.src_language,
                tgt_lang: this.dst_language,
                streamer: streamer,
            });

            this.result = answer?.[0]?.translation_text || answer?.translation_text || "";

            if (!this.result) {
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

export default new TranslationPageState();
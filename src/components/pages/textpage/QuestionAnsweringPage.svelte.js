/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as transformers from '@huggingface/transformers';

import modelState        from "../../../state/ModelState.svelte";
import StopWatchState    from "../../../state/StopWatchState.svelte.js";
import textPageState     from "../../../state/TextPageState.svelte.js";

/**
 * Gesicherter Zustand für die "Fragen beantworten" Seite, damit dieser bei der
 * Navigation nicht verloren geht.
 */
class QuestionAnsweringPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready")
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    query           = $state("");
    answer          = $state("");

    /**
     * Eingegebene Frage beantworten
     */
    async answerQuestion() {
        try {
            if (!this.query) return;
            if (!modelState.loadedModel.status === "ready") return;
            if (!modelState.loadedModel.task === "question-answering") return;
    
            this.stopWatchState.start("Antwort", "bi-pen");
            this.working = true;

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

export default new QuestionAnsweringPageState();
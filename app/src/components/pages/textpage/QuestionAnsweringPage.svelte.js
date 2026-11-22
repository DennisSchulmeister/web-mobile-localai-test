/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import testRunAPI       from "../../../api/TestRun.svelte.js";
import modelState       from "../../../state/ModelState.svelte";
import StopWatchState   from "../../../state/StopWatchState.svelte.js";
import textPageState    from "../../../state/TextPageState.svelte.js";
import i18n             from "../../../state/i18n.svelte.js";
import {formatDuration} from "../../../utils/formatter.js";

/**
 * Persistent state for the "Question Answering" page so it is not lost during navigation.
 */
class QuestionAnsweringPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready" || modelState.loadedModel.task !== "question-answering")
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    question        = $state("");
    answer          = $derived(textPageState.currentPage.file ? "" : "");

    /**
     * Answer the entered question.
     */
    async execute() {
        let rethrow = null;

        try {
            if (!this.question) return;
            if (this.disabled) return;
    
            this.stopWatchState.start(i18n.text.textPage?.qa?.answer, "bi-pen");

            this.working     = true;
            this.answer       = "";
            this.errorMessage = "";

            // Briefly yield so the loading state can appear in the UI.
            await new Promise(resolve => window.setTimeout(resolve, 500));

            let question = this.question.trim();
            let context  = textPageState.currentPage.simplified;
            this.answer  = await modelState.loadedModel.backend.runQuestionAnsweringPipeline({question, context});

            this.stopWatchState.stop();
            this.working = false;
        } catch (error) {
            this.errorMessage = error.message || error.toString();
            this.working      = false;

            this.stopWatchState.stop();
            rethrow = error;
        }

        // Log run pipeline event
        let event = await testRunAPI.saveEvent("run_pipeline", {
            status:    rethrow ? "ERROR" : "SUCCESS",
            page_file: textPageState.currentPage.file,
            model:     modelState.loadedModel.event?.id || 0,
            query:     this.question,
            context:   textPageState.currentPage.simplified,
            result:    this.answer,
            runtime:   formatDuration(this.stopWatchState.measurements[0].runtime),
        });

        if (rethrow) {
            await testRunAPI.saveEventException(event.id, rethrow);
            throw rethrow;
        }
    }
}

export default new QuestionAnsweringPageState();

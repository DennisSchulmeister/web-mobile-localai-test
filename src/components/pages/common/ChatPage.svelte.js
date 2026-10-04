/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import modelState                      from "../../../state/ModelState.svelte";
import StopWatchState                  from "../../../state/StopWatchState.svelte.js";
import TextGenerationStatsState        from "../../../state/TextGenerationStatsState.svelte.js";
import textPageState                   from "../../../state/TextPageState.svelte.js";
import {randomId}                      from "../../../utils/id.js";

/**
 * Gesicherter Zustand für den Chat, damit dieser bei der Navigation nicht verloren geht.
 */
class ChatPageState {
    TASKS             = ["text-generation", "text2text-generation"];

    working           = $state(false);
    disabled          = $derived(this.working || modelState.loadedModel.status !== "ready" || !this.TASKS.includes(modelState.loadedModel.task))
    errorMessage      = $state("");
    
    question          = $state("");
    maxNewTokens      = $state(0);
    temperature       = $state(0.3);
    repetitionPenalty = $state(1.1);
    doSample          = $state(true);

    /**
     * Notwendig, damit die Arrays reaktiv sind. `$derived(... [])` gibt keine
     * reaktiven Arrays zurück.
     */
    #cb = () => {
        modelState.loadedModel.modelId;

        let messages = $state([]);
        return messages;
    };

    textPage          = $state(false);
    messagesHome      = $derived.by(this.#cb);
    messagesTextPage  = $derived.by(() => {textPageState.currentPage.file; return this.#cb()});
    messages          = $derived(this.textPage ? this.messagesTextPage : this.messagesHome);

    /**
     * Textaufgabe generieren
     */
    async execute() {
        let response;

        try {
            if (this.disabled) return;

            this.working = true;

            // Kleine Pause, damit wenigstens der Loading-State im UI erscheint!
            await new Promise(resolve => window.setTimeout(resolve, 500));

            let question = this.question.trim();
            let context  = this.textPage ? textPageState.currentPage.content : "";

            this.messages.push({
                id:        randomId(),
                role:      "user",
                content:   question,
                stopWatch: null,
                stats:     null
            });

            this.messages.push({
                id:        randomId(),
                role:      "assistant",
                content:   "",
                stopWatch: new StopWatchState().start("Antwort", "bi-pen"),
                stats:     new TextGenerationStatsState().start()
            });

            let response = this.messages.at(-1);

            response.content = await modelState.loadedModel.backend.runTextGenerationPipeline({
                question:           question,
                context:            context,
                maxNewTokens:       this.maxNewTokens,
                doSample:           this.doSample,
                repetition_penalty: this.repetitionPenalty,
                tokenCallback:      (tokens) => response.stats.update(tokens.length, true),
                textCallback:       (text)   => response.content += text,
            });

            response.stopWatch.stop();
            response.stats.stop();

            this.working  = false;
            this.question = "";
        } catch (error) {
            this.errorMessage = error.toString();
            this.working      = false;

            if (response) {
                response.stopWatch.stop();
                response.stats.stop();
            }
            
            throw error;
        }
    }

    /**
     * Laufende Generierung stoppen.
     */
    stop() {
        modelState.loadedModel.backend.stopTextGeneration();
    }

    /**
     * Nachrichten zurücksetzen.
     */
    reset() {
        this.messages.splice(0);
    }
}

export default new ChatPageState();

/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import testRunAPI               from "../../../api/TestRun.svelte.js";
import i18n                     from "../../../state/i18n.svelte.js";
import modelState               from "../../../state/ModelState.svelte";
import StopWatchState           from "../../../state/StopWatchState.svelte.js";
import TextGenerationStatsState from "../../../state/TextGenerationStatsState.svelte.js";
import textPageState            from "../../../state/TextPageState.svelte.js";
import {randomId}               from "../../../utils/id.js";
import {formatDuration}         from "../../../utils/formatter.js";

/**
 * Persistent state for the chat so it is not lost during navigation.
 */
class ChatPageState {
    TASKS             = ["text-generation", "text2text-generation"];
    working           = $state(false);
    disabled          = $derived(this.working || modelState.loadedModel.status !== "ready" || !this.TASKS.includes(modelState.loadedModel.task))   
    question          = $state("");
    maxNewTokens      = $state(1000);
    temperature       = $state(0.3);
    repetitionPenalty = $state(1.1);
    doSample          = $state(true);

    /**
     * Required to make the arrays reactive. `$derived(... [])` does not return
     * reactive arrays.
     */
    #messagesCallback = () => {
        modelState.loadedModel.modelId;

        let messages = $state([]);
        return messages;
    };

    #errorCallback = () => {
        modelState.loadedModel.modelId;

        let error = $state({message: ""});
        return error;
    }

    textPage                  = $state(false);
    
    #messagesHome             = $derived.by(this.#messagesCallback);
    #messagesTextPage         = $derived.by(() => {textPageState.currentPage.file; return this.#messagesCallback()});
    messages                  = $derived(this.textPage ? this.#messagesTextPage : this.#messagesHome);
    
    #errorHome                = $derived.by(this.#errorCallback);
    #errorTextPage            = $derived.by(() => {textPageState.currentPage.file; return this.#errorCallback()});
    error                     = $derived(this.textPage ? this.#errorTextPage : this.#errorHome);

    #startChatEventIdHome     = $state(0);
    #startChatEventIdTextPage = $derived.by(() => {textPageState.currentPage.file; return 0});
    #startChatEventId         = $derived(this.textPage ? this.#startChatEventIdTextPage : this.#startChatEventIdHome);

    /**
     * Generate text for the current task.
     */
    async execute() {
        let question;
        let context;
        let response;
        let rethrow;

        try {
            if (this.disabled) return;
            if (!this.#startChatEventId) await this.reset();

            this.working       = true;
            this.error.message = "";

            // Briefly yield so the loading state can appear in the UI.
            await new Promise(resolve => window.setTimeout(resolve, 500));

            question = this.question.trim();
            context  = this.textPage ? textPageState.currentPage.content : "";

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

            response = this.messages.at(-1);

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
            this.error.message = error.message || error.toString();
            this.working       = false;

            if (response) {
                response.stopWatch.stop();
                response.stats.stop();
            }
            
            rethrow = error;
        }

        // Log chat message event
        let measurements = {
            firstToken:      "",
            runtime:         formatDuration(response.stopWatch?.measurements?.[0]?.runtime || 0.0),
            numberTokens:    0,
            tokensPerSecond: 0.0,
        }

        for (let value of response?.stats?.values || []) {
            switch (value.name) {
                case i18n.text.textGenerationStats?.numberTokens:
                    measurements.numberTokens = value.value;
                    break;
                case i18n.text.textGenerationStats?.firstToken:
                    measurements.firstToken = formatDuration(value.value);
                    break;
                case i18n.text.textGenerationStats?.tokensPerSecond:
                    measurements.tokensPerSecond = value.value;
                    break;
            }
        }

        let event = await testRunAPI.saveEvent("chat_message", {
            status:            rethrow ? "ERROR" : "SUCCESS",
            chat:              this.#startChatEventId,
            model:             modelState.loadedModel.event?.id || 0,
            user_message:      question,
            context:           context,
            max_tokens:        this.maxNewTokens,
            sampling:          this.doSample,
            assistant_message: response?.content || "",
            first_token:       measurements.firstToken,
            runtime:           measurements.runtime,
            tokens:            measurements.numberTokens,
            tokens_per_second: measurements.tokensPerSecond,
        });

        if (rethrow) {
            await testRunAPI.saveEventException(event.id, rethrow);
            throw rethrow;
        }
    }

    /**
     * Stop the current generation.
     */
    async stop() {
        try {
            await modelState.loadedModel.backend.stopTextGeneration();
        } catch (error) {
            this.error.message = error.message || error.toString();
            throw error;
        }
    }

    /**
     * Reset the messages.
     */
    async reset() {
        this.messages.splice(0);
        this.error.message = "";

        // Log start chat event
        let event = await testRunAPI.saveEvent("start_chat", {
            status:    "SUCCESS",
            page_file: textPageState.currentPage?.file || "",
        });

        if (this.textPage) {
            this.#startChatEventIdTextPage = event?.id || 0;
        } else {
            this.#startChatEventIdHome = event?.id || 0;
        }
    }
}

export default new ChatPageState();

/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */
import modelState        from "../../../state/ModelState.svelte";
import StopWatchState    from "../../../state/StopWatchState.svelte.js";

export const TASKS = ["text2text-generation", "text-generation"];

/**
 * Gesicherter Zustand für den Chat, damit dieser bei der Navigation nicht verloren geht.
 */
class ChatPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready" || TASKS.includes(modelState.loadedModel.task))
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();

    question        = $state("");
    maxNewTokens    = $state(100);
    messages        = $derived(modelState.loadedModel.modelId ? [] : []);

    /**
     * Textaufgabe generieren
     */
    async execute() {
        try {
            if (this.disabled) return;
   
            this.stopWatchState.start("Text-Generierung", "bi-pen");
            this.working = true;

            // Kleine Pause, damit wenigstens der Loading-State im UI erscheint!
            await new Promise(resolve => window.setTimeout(resolve, 500));

            let question = this.question.trim();

            this.messages.push({role: "user", content: question});
            this.messages.push({role: "assistant", content: ""});

            let input    = null;
            let output   = null;
            let response = this.messages.at(-1);

            let streamer = new TextStreamer(modelState.model.tokenizer, {
                skip_prompt:         true,
                skip_special_tokens: true,
                callback_function:   (text) => response.content += text,
            });

            switch (modelState.loadedModel.task) {
                case "text2text-generation":
                    // T5-Style: Encoder-decoder / Seq2Seq
                    if (modelState.loadedModel.config?.prefix?.question) {
                        input = `${modelState.loadedModel.config.prefix.question} ${question}`;
                    } else {
                        input = question;
                    }
                    break;
                case "text-generation":
                    // GPT-Style: Decoder-only / Causal LM
                    input = [
                        {role: "system", content: modelState.loadedModel.config?.systemPrompt || "Du bist ein hilfreicher Assistent."},
                        {role: "user",   content: question},
                    ];
                    break;
            }

            output = await modelState.model(question, {
                max_new_tokens: this.maxNewTokens,
                do_sample:      false,
                streamer:       streamer,
            });

            response.content = output?.[0]?.generated_text || output?.generated_text || "";

            if (!response.content) {
                console.error("Ungültige Antwort des Modells", output);
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

export default new ChatPageState();

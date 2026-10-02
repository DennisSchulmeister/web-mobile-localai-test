/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */
import {InterruptableStoppingCriteria} from "@huggingface/transformers";
import {TextStreamer}                  from "@huggingface/transformers";

import modelState                      from "../../../state/ModelState.svelte";
import StopWatchState                  from "../../../state/StopWatchState.svelte.js";
import {randomId}                      from "../../../utils/id.js";

/**
 * Gesicherter Zustand für den Chat, damit dieser bei der Navigation nicht verloren geht.
 */
class ChatPageState {
    TASKS             = ["text-generation", "text2text-generation"];

    working           = $state(false);
    disabled          = $derived(this.working || modelState.loadedModel.status !== "ready" || !this.TASKS.includes(modelState.loadedModel.task))
    errorMessage      = $state("");
    stopWatchState    = new StopWatchState();
    stoppingCriteria  = new InterruptableStoppingCriteria();
    
    question          = $state("");
    maxNewTokens      = $state(0);
    temperature       = $state(0.3);
    repetitionPenalty = $state(1.1);

    messages = $derived.by(() => {
        modelState.loadedModel.modelId;
        this.stopWatchState.reset();

        // Damit die Array-Einträge reaktive Proxies sind.
        // $derived(... ? [] : []) würde das Array direkt (nicht-reaktiv) zurückgeben.
        let messages = $state([]);
        return messages;
    });

    /**
     * Textaufgabe generieren
     */
    async execute() {
        try {
            if (this.disabled) return;
   
            this.stopWatchState.start("Text-Generierung", "bi-pen");
            this.stoppingCriteria.reset();
            this.working = true;

            // Kleine Pause, damit wenigstens der Loading-State im UI erscheint!
            await new Promise(resolve => window.setTimeout(resolve, 500));

            let question = this.question.trim();

            this.messages.push({id: randomId(), role: "user", content: question});
            this.messages.push({id: randomId(), role: "assistant", content: ""});

            let input    = null;
            let output   = null;
            let response = this.messages.at(-1);

            let streamer = new TextStreamer(modelState.model.tokenizer, {
                skip_prompt:         true,
                skip_special_tokens: true,
                callback_function:   (text) => response.content += text,
            });

            if (modelState.loadedModel.config.instructionTuned) {
                // Chat-Modelle: Diese enden oft auf `-instruct`, da sie "instruction tuned" sind.
                // Das heißt, sie vervollständigen nicht einfach nur einen Eingabetext, sondern der
                // Eingabetext muss ein spezielles Format besitzen, um eine Chat-Struktur abzubilden.
                // Das Modell liefert dann ein Chat-Template mit, so dass eine Liste von Chat-Nachrichten
                // in die richtige Nur-Text-Form umgewandelt werden kann.
                //
                // In der Regel handelt es sich hier um CausalLM (Decoder-Only) Modelle, wie die GPT-Familie.
                // Seq2Seq-Modelle wie die T5-Familie sind in der Regel nicht Instruction Tuned.
                input = [
                    {role: "system", content: modelState.loadedModel.config?.systemPrompt || "Du bist ein hilfreicher Assistent."},
                    {role: "user",   content: question},
                ];
            } else if (modelState.loadedModel.config?.prefix?.question) {
                input = `${modelState.loadedModel.config.prefix.question} ${question}`;
            } else {
                input = question;
            }

            output = await modelState.model(input, {
                tokenizer_encode_kwargs: modelState.loadedModel.config?.tokenizerArgs || null,
                max_new_tokens:          this.maxNewTokens || null,
                max_length:              null,
                do_sample:               true,
                temperature:             this.temperature,
                repetition_penalty:      this.repetitionPenalty,
                streamer:                streamer,
                stopping_criteria:       [this.stoppingCriteria],
            });

            let generatedText = output?.[0]?.generated_text || output?.generated_text || ""; 

            response.content = Array.isArray(generatedText)
                             ? generatedText.at(-1)?.content ?? "" 
                             : generatedText;

            if (!response.content) {
                console.error("Ungültige Antwort des Modells", output);
                this.errorMessage = "Das Modell hat keinen Text erzeugt";
            }

            this.stopWatchState.stop();
            this.working  = false;
            this.question = "";
        } catch (error) {
            this.errorMessage = error.toString();
            this.working      = false;

            this.stopWatchState.stop();
            throw error;
        }
    }

    /**
     * Laufende Generierung stoppen.
     */
    stop() {
        if (this.working) {
            this.stoppingCriteria.interrupt();
        }
    }

    /**
     * Nachrichten zurücksetzen.
     */
    reset() {
        this.messages.splice(0);
        this.stopWatchState.reset();
    }
}

export default new ChatPageState();

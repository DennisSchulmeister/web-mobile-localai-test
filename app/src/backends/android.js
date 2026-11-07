/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import BaseBackend from "./base.js";
import {Capacitor, registerPlugin} from "@capacitor/core";

const nativeInference = registerPlugin("NativeInference");
let nextRequestId = 0;

/**
 * Additional inference backend for the Android app. It communicates with native
 * Java code through a Capacitor plugin to run inference with a native library
 * outside the WebView. This should theoretically have several benefits:
 * 
 * 1. Fewer memory issues because it avoids the browser's memory model.
 * 2. Faster execution, especially when TPU devices can be used.
 */
export default class AndroidBackend extends BaseBackend {
    /**
     * ID of the running text generation, used to associate streaming events.
     */
    #generationRequestId = null;

    /**
     * Whether text generation has already been passed to the native plugin.
     */
    #generationStarted = false;

    /**
     * Cancellation request made while registering the streaming listener.
     */
    #cancelRequested = false;

    get id() {
        return "onnx-android";
    }

    get name() {
        return "ONNX Runtime (Android native)";
    }

    get isSupported() {
        return Capacitor.isNativePlatform()
            && Capacitor.getPlatform() === "android"
            && Capacitor.isPluginAvailable("NativeInference");
    }

    get devices() {
        return nativeInference.getDevices().then(({devices}) => devices);
    }

    async getInformation() {
        const {information} = await nativeInference.getInformation();
        return information;
    }

    async supportsTask(task) {
        const {supported} = await nativeInference.supports({task});
        return supported;
    }

    supportsModel({task, modelId, config} = {}) {
        return config?.engines?.["onnx-android"]?.supported || false;
    }

    async loadModel({task, modelId, dtype, device, config} = {}) {
        await nativeInference.loadModel({
            task:        task,
            modelId:     modelId,
            dtype:       dtype,
            device:      device,
            modelConfig: config,
            config:      this.config,
            models:      this.models,
        });
    }

    async runEmbeddingPipeline(input) {
        const {embedding} = await nativeInference.runEmbeddingPipeline({input});
        return embedding;
    }

    async runQuestionAnsweringPipeline({question, context} = {}) {
        const {text} = await nativeInference.runQuestionAnsweringPipeline({question, context});
        return text;
    }

    async runSummaryPipeline({input, maxNewTokens} = {}) {
        const {text} = await nativeInference.runSummaryPipeline({input, maxNewTokens});
        return text;
    }

    async runTranslationPipeline({input, sourceLanguage, targetLanguage} = {}) {
        const {text} = await nativeInference.runTranslationPipeline({input, sourceLanguage, targetLanguage});
        return text;
    }

    async runTextGenerationPipeline({question, context, tokenCallback, textCallback,
                                     maxNewTokens, maxLength, doSample, temperature, repetitionPenalty
                                    } = {}) {
        if (this.#generationRequestId !== null) {
            throw new Error("Textgenerierung läuft bereits.");
        }

        const requestId = `generation-${++nextRequestId}`;
        this.#generationRequestId = requestId;
        let listener;

        try {
            listener = await nativeInference.addListener("generationChunk", chunk => {
                if (chunk.requestId !== requestId) return;
                if (chunk.tokens && tokenCallback) tokenCallback(chunk.tokens);
                if (typeof chunk.text === "string" && textCallback) textCallback(chunk.text);
            });

            if (this.#cancelRequested) {
                throw new Error("Textgenerierung abgebrochen.");
            }

            this.#generationStarted = true;
            const {text} = await nativeInference.runTextGenerationPipeline({
                requestId, question, context, maxNewTokens, maxLength,
                doSample, temperature, repetitionPenalty,
            });

            return text;
        } finally {
            try {
                if (listener) await listener.remove();
            } finally {
                this.#generationRequestId = null;
                this.#generationStarted   = false;
                this.#cancelRequested     = false;
            }
        }
    }

    async stopTextGeneration() {
        if (this.#generationRequestId === null) return;

        if (!this.#generationStarted) {
            this.#cancelRequested = true;
            return;
        }

        await nativeInference.stopTextGeneration({requestId: this.#generationRequestId});
    }
}

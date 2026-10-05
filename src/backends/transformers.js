/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {InterruptableStoppingCriteria} from "@huggingface/transformers";
import {TextStreamer}                  from "@huggingface/transformers";
import * as transformers               from '@huggingface/transformers';

import BaseBackend                     from "./base.js";
import {formatNumber}                  from "../utils/formatter.js";

/**
 * Inferenz-Backend basierend auf Transformers.js (ONNX) im Browser. Dies ist
 * das Standard-Backend, das die Inferenz direkt im Browser ausführt.
 */
export default class TransformersBackend extends BaseBackend {
    /**
     * Optionale Debug-Logs zum Untersuchen von Performance-Problemen.
     * 
     * Sowohl beim Laden aus auch bei der Ausführung werden durch die
     * ONNX-Runtime umfangreiche Logs geschrieben, die Hinweise darauf
     * geben können, warum ein bestimmtes Modell nur sehr langsam läuft.
     * 
     * Hierfür sichert man die Browser Logs in eine Textdatei und nutzt
     * z.B. Copilot zur Auswertung.
     */
    #sessionOptions = {};

    /**
     * Aktuell geladenes KI-Modell.
     */
    #model = null;

    /**
     * Konfiguration des aktuell geladenen Modells.
     */
    #modelConfig = null;

    /**
     * Hilfsobjekt zum Stoppen der aktuellen Textgenerierung.
     */
    #stoppingCriteria = new InterruptableStoppingCriteria();

    /**
     * Textgenerierung läuft
     */
    #running = false;

    get name() {
        return "Transformers.js";
    }

    get isSupported() {
        return true;
    }

    get devices() {
        return [
            navigator.ml  ? {device: "webnn",  label: "WebNN"}  : null,
            navigator.gpu ? {device: "webgpu", label: "WebGPU"} : null,
                            {device: "wasm",   label: "WASM"},
        ].filter(e => e !== null);
    }

    supports(task) {
        return true;
    }

    async getInformation() {
        let devices = [];

        for (let device of this.devices) {
            devices.push(device.label);
        }

        let userAgentData = "Nicht verfügbar";

        if (navigator.userAgentData) {
            let data = {
                brands:   navigator.userAgentData.brands,
                mobile:   navigator.userAgentData.mobile,
                platform: navigator.userAgentData.platform,
            };

            if (typeof navigator.userAgentData.getHighEntropyValues === "function") {
                try {
                    Object.assign(data, await navigator.userAgentData.getHighEntropyValues([
                        "architecture",
                        "bitness",
                        "model",
                        "platformVersion",
                        "uaFullVersion",
                        "fullVersionList",
                        "wow64",
                    ]));
                } catch (error) {
                    data.highEntropyError = error?.message || String(error);
                }
            }

            userAgentData = JSON.stringify(data, null, 2);
        }

        let platform            = navigator.platform || navigator.userAgentData?.platform || "Nicht verfügbar";
        let deviceMemory        = typeof navigator.deviceMemory === "number" ? `ca. ${formatNumber(navigator.deviceMemory)} GiB`  : "Nicht verfügbar";
        let hardwareConcurrency = typeof navigator.hardwareConcurrency === "number" ? String(navigator.hardwareConcurrency) : "Nicht verfügbar";

        let adapter      = null;
        let adapterError = null;

        if (navigator.gpu) {
            try {
                adapter = await navigator.gpu.requestAdapter();
            } catch (error) {
                adapterError = error?.message || String(error);
            }
        }

        let gpuCount = !navigator.gpu
            ? "Nicht verfügbar (WebGPU wird nicht unterstützt)"
            : adapter
                ? "1 WebGPU-Adapter"
                : adapterError
                    ? `Nicht verfügbar (${adapterError})`
                    : "0 WebGPU-Adapter";

        let gpuDescription = "Nicht verfügbar";
        let maxBufferSize = "Nicht verfügbar";
        let maxStorageBufferBindingSize = "Nicht verfügbar";

        if (adapter) {
            let info = adapter.info;

            if (!info && typeof adapter.requestAdapterInfo === "function") {
                try {
                    info = await adapter.requestAdapterInfo();
                } catch (error) {
                    gpuDescription = `Nicht verfügbar (${error?.message || String(error)})`;
                }
            }

            let description = {
                vendor:       info?.vendor,
                architecture: info?.architecture,
                device:       info?.device,
                description:  info?.description,
            };

            let availableInfo = Object.fromEntries(
                Object.entries(description).filter(([, value]) => value),
            );

            if (Object.keys(availableInfo).length > 0 && gpuDescription === "Nicht verfügbar") {
                gpuDescription = JSON.stringify(availableInfo);
            }

            if (typeof adapter.limits?.maxBufferSize === "number") {
                maxBufferSize = `${formatNumber(adapter.limits.maxBufferSize / 1024 / 1024 / 1024.0)} GiB`;
            }

            if (typeof adapter.limits?.maxStorageBufferBindingSize === "number") {
                maxStorageBufferBindingSize = `${formatNumber(adapter.limits.maxStorageBufferBindingSize / 1024 / 1024 / 1024.0)} GiB`;
            }
        } else if (adapterError) {
            maxBufferSize = `Nicht verfügbar (${adapterError})`;
            maxStorageBufferBindingSize = `Nicht verfügbar (${adapterError})`;
        }

        return [
            {icon: "bi-terminal",    label: "Backend-Typ",                     text: "Browser"},
            {icon: "bi-cpu",         label: "Ausführung",                      text: devices.join(", ")},
            {icon: "bi-info-circle", label: "User Agent",                      text: userAgentData},
            {icon: "bi-display",     label: "Plattform",                       text: platform},
            {icon: "bi-memory",      label: "Device Memory",                   text: deviceMemory},
            {icon: "bi-cpu",         label: "Hardware-Nebenläufigkeit",        text: hardwareConcurrency},
            {icon: "bi-gpu-card",    label: "GPU-Adapter",                     text: gpuCount},
            {icon: "bi-gpu-card",    label: "GPU-Beschreibung",                text: gpuDescription},
            {icon: "bi-memory",      label: "Max Buffer Size",                 text: maxBufferSize},
            {icon: "bi-memory",      label: "Max Storage Buffer Binding Size", text: maxStorageBufferBindingSize},
        ];
    }

    setConfig({config, models} = {}) {
        super.setConfig({config, models});

        transformers.env.localModelPath    = this.config.models.downloadDir;
        transformers.env.allowLocalModels  = true;
        transformers.env.allowRemoteModels = window.ALLOW_REMOTE_MODELS;

        if (window.ENABLE_DEBUG_LOGS) {
            transformers.env.logLevel = transformers.LogLevel.DEBUG;
            
            transformers.env.backends.onnx.webgpu.profiling = {
                mode: "default",
            };

            this.#sessionOptions = {
                logSeverityLevel:  0,  // Verbose
                logVerbosityLevel: 1,
            };
        } else {
            delete transformers.env.logLevel;
            delete transformers.env.backends.onnx.webgpu.profiling;

            this.#sessionOptions = {};
        }
    }

    async loadModel({task, modelId, dtype, device, config} = {}) {
        this.#model = await transformers.pipeline(task, modelId, {
            dtype:  dtype,
            device: device,
            session_options: { ...this.#sessionOptions },
        });

        this.#modelConfig = config;
    }

    async runEmbeddingPipeline(input) {
        return (await this.#model(input, {pooling: "mean", normalize: true})).data;
    }

    async runQuestionAnsweringPipeline({question, context} = {}) {
        if (this.#modelConfig.prefix?.question) {
            question = `${this.#modelConfig.prefix.question} ${question}`;
        }

        if (this.#modelConfig?.prefix?.context) {
            context = `${this.#modelConfig.prefix.context} ${context}`;
        }

        let output = await this.#model(question, context);
        let result = output?.answer || "";

        if (!result) {
            console.error("Ungültige Antwort des Modells", output);
            this.errorMessage = "Das Modell hat keinen Text erzeugt";
        }

        return result;
    }

    async runSummaryPipeline({input, maxNewTokens} = {}) {
        if (this.#modelConfig.prefix) {
            input = `${this.#modelConfig.prefix} ${input}`;
        }

        let output = await this.#model(input, {
            max_new_tokens: maxNewTokens,
            do_sample:      false,
        });

        let result = output?.[0]?.summary_text || "";

        if (!result) {
            console.error("Ungültige Antwort des Modells", output);
            this.errorMessage = "Das Modell hat keinen Text erzeugt";
        }

        return result;
    }

    async runTranslationPipeline({input, sourceLanguage, targetLanguage} = {}) {
        let output = await this.#model(input, {
            src_lang: sourceLanguage,
            tgt_lang: targetLanguage,
        });

        let result = output?.[0]?.translation_text || output?.translation_text || "";

        if (!result) {
            console.error("Ungültige Antwort des Modells", output);
            this.errorMessage = "Das Modell hat keinen Text erzeugt";
        }

        return result;
    }

    async runTextGenerationPipeline({question, context, tokenCallback, textCallback,
                                     maxNewTokens, maxLength, doSample, temperature, repetitionPenalty
                                    } = {}) {
        
        if (this.#running) {
            throw new Error("Textgenerierung läuft bereits");
        }
        
        try {
            this.#stoppingCriteria.reset();
            this.#running = true;

            if (this.#modelConfig.prefix?.question) {
                question = `${this.#modelConfig.prefix.question} ${question}`;
            }

            if (this.#modelConfig.prefix?.context) {
                context = `${this.#modelConfig.prefix.context} ${context}`;
            }

            let input  = null;
            let output = null;

            let streamer = new TextStreamer(this.#model.tokenizer, {
                skip_prompt:             true,
                skip_special_tokens:     true,
                token_callback_function: tokenCallback || null,
                callback_function:       textCallback  || null,
            });

            if (this.#modelConfig.instructionTuned) {
                // Chat-Modelle: Diese enden oft auf `-instruct`, da sie "instruction tuned" sind.
                // Das heißt, sie vervollständigen nicht einfach nur einen Eingabetext, sondern der
                // Eingabetext muss ein spezielles Format besitzen, um eine Chat-Struktur abzubilden.
                // Das Modell liefert dann ein Chat-Template mit, so dass eine Liste von Chat-Nachrichten
                // in die richtige Nur-Text-Form umgewandelt werden kann.
                //
                // In der Regel handelt es sich hier um CausalLM (Decoder-Only) Modelle, wie die GPT-Familie.
                // Seq2Seq-Modelle wie die T5-Familie sind in der Regel nicht Instruction Tuned.
                input = [
                    {role: "system", content: this.#modelConfig.systemPrompt || "Du bist ein hilfreicher Assistent."},
                    {role: "user",   content: question}
                ];

                if (context) {
                    input[0].content += `\n\n${context}`;
                }
            } else if (context) {
                input = `${context}\n\n${question}`;
            } else {
                input = question;
            }

            output = await this.#model(input, {
                tokenizer_encode_kwargs: this.#modelConfig.tokenizerArgs || null,
                max_new_tokens:          maxNewTokens || null,
                max_length:              maxLength    || null,
                do_sample:               doSample,
                temperature:             temperature,
                repetition_penalty:      repetitionPenalty,
                streamer:                streamer,
                stopping_criteria:       [this.#stoppingCriteria],
            });

            let generatedText = output?.[0]?.generated_text || output?.generated_text || ""; 

            let result = Array.isArray(generatedText)
                            ? generatedText.at(-1)?.content ?? "" 
                            : generatedText;

            if (!result) {
                console.error("Ungültige Antwort des Modells", output);
                this.errorMessage = "Das Modell hat keinen Text erzeugt";
            }

            return result;
        } finally {
            this.#running = false;
        }
    }

    stopTextGeneration() {
        this.#stoppingCriteria.interrupt();
        this.#running = false;
    }
}

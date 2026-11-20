/**
 * Web/Mobile Test for Local AI
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
import i18n                            from "../state/i18n.svelte.js";

/**
 * Inference backend based on Transformers.js (ONNX) in the browser. This is
 * the default backend, which runs inference directly in the browser.
 */
export default class TransformersBackend extends BaseBackend {
    /**
     * Optional debug logs for investigating performance issues.
     * 
     * ONNX Runtime writes extensive logs while loading and running a model.
     * These may help explain why a particular model is running very slowly.
     * 
     * To investigate, save the browser logs to a text file and use, for example,
     * Copilot to analyze them.
     */
    #sessionOptions = {};

    /**
     * Currently loaded AI model.
     */
    #model = null;

    /**
     * Configuration of the currently loaded model.
     */
    #modelConfig = null;

    /**
     * Helper object for stopping the current text generation.
     */
    #stoppingCriteria = new InterruptableStoppingCriteria();

    /**
     * Text generation is running.
     */
    #running = false;

    get id() {
        return "transformers.js";
    }
    
    get name() {
        return i18n.text.backend?.transformers?.name;
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

    async getInformation() {
        let devices = [];

        for (let device of this.devices) {
            devices.push(device.label);
        }

        let userAgentData = i18n.text.backend?.transformers?.info?.notAvailable;

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

        let platform            = navigator.platform || navigator.userAgentData?.platform || i18n.text.backend?.transformers?.info?.notAvailable;
        let deviceMemory        = typeof navigator.deviceMemory === "number" ? `ca. ${formatNumber(navigator.deviceMemory)} GiB`  : i18n.text.backend?.transformers?.info?.notAvailable;
        let hardwareConcurrency = typeof navigator.hardwareConcurrency === "number" ? String(navigator.hardwareConcurrency) : i18n.text.backend?.transformers?.info?.notAvailable;

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
            ? i18n.text.backend?.transformers?.info?.noWebGpuSupport
            : adapter
                ? i18n.text.backend?.transformers?.info?.webGpuCount1
                : adapterError
                    ? `${i18n.text.backend?.transformers?.info?.notAvailable} (${adapterError})`
                    : i18n.text.backend?.transformers?.info?.webGpuCount0;

        let gpuDescription = i18n.text.backend?.transformers?.info?.notAvailable;
        let maxBufferSize = i18n.text.backend?.transformers?.info?.notAvailable;
        let maxStorageBufferBindingSize = i18n.text.backend?.transformers?.info?.notAvailable;

        if (adapter) {
            let info = adapter.info;

            if (!info && typeof adapter.requestAdapterInfo === "function") {
                try {
                    info = await adapter.requestAdapterInfo();
                } catch (error) {
                    gpuDescription = `${i18n.text.backend?.transformers?.info?.notAvailable} (${error?.message || String(error)})`;
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

            if (Object.keys(availableInfo).length > 0 && gpuDescription === i18n.text.backend?.transformers?.info?.notAvailable) {
                gpuDescription = JSON.stringify(availableInfo);
            }

            if (typeof adapter.limits?.maxBufferSize === "number") {
                maxBufferSize = `${formatNumber(adapter.limits.maxBufferSize / 1024 / 1024 / 1024.0)} GiB`;
            }

            if (typeof adapter.limits?.maxStorageBufferBindingSize === "number") {
                maxStorageBufferBindingSize = `${formatNumber(adapter.limits.maxStorageBufferBindingSize / 1024 / 1024 / 1024.0)} GiB`;
            }
        } else if (adapterError) {
            maxBufferSize = `${i18n.text.backend?.transformers?.info?.notAvailable} (${adapterError})`;
            maxStorageBufferBindingSize = `${i18n.text.backend?.transformers?.info?.notAvailable} (${adapterError})`;
        }

        return [
            {
                field: "backendType",
                icon:  "bi-terminal",
                label: i18n.text.backend?.transformers?.info?.backendType,
                text:  i18n.text.backend?.transformers?.info?.browser
            },
            {
                field: "devices",
                icon:  "bi-cpu",
                label: i18n.text.backend?.transformers?.info?.devices,
                text:  devices.join(", ")
            },
            {
                field: "userAgentData",
                icon:  "bi-info-circle",
                label: i18n.text.backend?.transformers?.info?.userAgentData,
                text:  userAgentData
            },
            {
                field: "platform",
                icon:  "bi-display",
                label: i18n.text.backend?.transformers?.info?.platform,
                text:  platform
            },
            {
                field: "deviceMemory",
                icon:  "bi-memory",
                label: i18n.text.backend?.transformers?.info?.deviceMemory,
                text:  deviceMemory
            },
            {
                field: "hardwareConcurrency",
                icon:  "bi-cpu",
                label: i18n.text.backend?.transformers?.info?.hardwareConcurrency,
                text:  hardwareConcurrency
            },
            {
                field: "gpuCount",
                icon:  "bi-gpu-card",
                label: i18n.text.backend?.transformers?.info?.gpuCount,
                text:  gpuCount
            },
            {
                field: "gpuDescription",
                icon:  "bi-gpu-card",
                label: i18n.text.backend?.transformers?.info?.gpuDescription,
                text:  gpuDescription
            },
            {
                field: "maxBufferSize",
                icon:  "bi-memory",
                label: i18n.text.backend?.transformers?.info?.maxBufferSize,
                text:  maxBufferSize
            },
            {
                field: "maxStorageBufferBindingSize",
                icon:  "bi-memory",
                label: i18n.text.backend?.transformers?.info?.maxStorageBufferBindingSize,
                text:  maxStorageBufferBindingSize
            },
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

    supportsTask(task) {
        return true;
    }

    supportsModel({task, modelId, config} = {}) {
        return config?.engines?.["transformers.js"]?.supported || false;
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
            console.error(i18n.text.backend?.transformers?.invalidAnswer, output);
            this.errorMessage = i18n.text.backend?.transformers?.noTextOutput;
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
            console.error(i18n.text.backend?.transformers?.invalidAnswer, output);
            this.errorMessage = i18n.text.backend?.transformers?.noTextOutput;
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
            console.error(i18n.text.backend?.transformers?.invalidAnswer, output);
            this.errorMessage = i18n.text.backend?.transformers?.noTextOutput;
        }

        return result;
    }

    async runTextGenerationPipeline({question, context, tokenCallback, textCallback,
                                     maxNewTokens, maxLength, doSample, temperature, repetitionPenalty
                                    } = {}) {
        
        if (this.#running) {
            throw new Error(i18n.text.backend?.transformers?.alreadyRunning);
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
                // Chat models often end in `-instruct` because they are instruction-tuned.
                // This means they do not simply complete an input text; the input must
                // have a specific format to represent a chat structure. The model
                // provides a chat template to convert a list of chat messages into
                // the correct plain-text format.
                //
                // These are usually CausalLM (decoder-only) models, such as the GPT family.
                // Seq2Seq models such as the T5 family are generally not instruction-tuned.
                input = [
                    {role: "system", content: this.#modelConfig.systemPrompt || i18n.text.backend?.transformers?.defaultPrompt},
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
                console.error(i18n.text.backend?.transformers?.invalidAnswer, output);
                this.errorMessage = i18n.text.backend?.transformers?.noTextOutput;
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

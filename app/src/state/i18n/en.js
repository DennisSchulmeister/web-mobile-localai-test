/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
    homePage: {
        index: {
            shortName: "Pages",
            pageTitle: "Table of Contents",
            loading:   "Loading list …",
        },
        search: {
            shortName:   "Search",
            pageTitle:   "Semantic Search",
            placeholder: "Search Query",
            searchAll:   "Full-text Search",
            matchText:   "Direct String Comparison",
            submit:      "Search",
            download:    "Download",
            embedding:   "Embedding",
            search:      "Search",
        },
        info: {
            shortName: "Info",
            pageTitle: "Available Backends",
            loading:   "Loading …",
        },
    },
    notFoundPage: {
        pageTitle: "Not Found",
        title:     "Page Not Found",
        message:   "The requested page could not be found.",
        backLink:  "Back to the Start Page",
    },
    textPage: {
        content: {
            shortName: "Content",
            pageTitle: "Display Page",
            submit:    "Start",
            working:   "Generating answer",
        },
        summary: {
            shortName: "Summarize",
            pageTitle: "Summarize Page",
            length:    "Length",
            tokens:    "Tokens",
            submit:    "Start",
            working:   "Generating answer",
            answer:    "Answer",
        },
        qa: {
            shortName:   "Ask",
            pageTitle:   "Answer Questions",
            placeholder: "Question",
            submit:      "Start",
            working:     "Generating answer",
            answer:      "Answer",
        },
        translation: {
            shortName: "Translate",
            pageTitle: "Translate Page",
            source:    "From",
            target:    "To",
            submit:    "Start",
            working:   "Generating answer",
            answer:    "Answer",
        },
    },
    welcomePage: {
        title:      "Welcome",
        language:   "Language",
        accessCode: "Access Code",
        hint:       "Leave empty to start the app without recording tests.",
        start:      "Start Application",
    },
    chatPage: {
        shortName:         "Chat",
        titleTextPage:     "Chat with Page",
        titleHome:         "Context-Free Chat",
        placeholder1:      "Ask something (in English).",
        placeholder2:      "Note:",
        placeholder3:      "I answer your questions, but cannot remember our conversation. This means, each question must be answerable without knowledge of previous messages. Besides that I make many mistakes. Therefore, check all my answers. Sometimes I tell nonsense. In that case simply ask the same question again. 🙃",
        roleUser:          "User",
        roleAssistant:     "Assistant",
        reset:             "New Chat",
        message:           "Message",
        options:           "Options",
        maxTokens:         "Max Tokens",
        temperature:       "Temperature",
        repetitionPenalty: "Don't Repeat",
        sampling:          "Sampling",
    },
    modelSelector: {
        title: "Language Model",
        current: {
            title:      "Currently Used",
            loading:    "Model is being loaded.",
            noneLoaded: "No model has been loaded."
        },
        load: {
            title:   "Load Model",
            backend: "Inference Backend",
            model:   "Language Model",
            dtype:   "Data Type",
            device:  "Execution",
            load:    "Load",
        }
    },
    backend: {
        base: {
            noName:         "No Name",
            notImplemented: "Not implemented!",
        },
        android: {
            name:               "ONNX Runtime (Android native)",
            alreadyRunning:     "Text generation is already running.",
            generationCanceled: "Text generation was cancelled.",
        },
        transformers: {
            name:           "Transformers.js",
            alreadyRunning: "Text generation is already running.",
            invalidAnswer:  "Invalid response from model",
            noTextOutput:   "The model didn't produce any text",
            defaultPrompt:  "You are a helpful assistant.",
            info: {
                notAvailable:                "Not available",
                noWebGpuSupport:             "Not available (WebGPU not supported)",
                webGpuCount0:                "0 WebGPU adapters",
                webGpuCount1:                "1 WebGPU adapter",
                browser:                     "Browser",
                backendType:                 "Backend Type",
                devices:                     "Execution",
                userAgentData:               "User Agent",
                platform:                    "Platform",
                deviceMemory:                "Main Memory",
                hardwareConcurrency:         "Hardware Concurrency",
                gpuCount:                    "GPU Adapters",
                gpuDescription:              "GPU Description",
                maxBufferSize:               "Maximum Buffer Size",
                maxStorageBufferBindingSize: "Maximum Buffer Binding Size",
            },
        },
    },
    textGenerationStats: {
        numberTokens:    "Tokens",
        firstToken:      "First Token",
        tokensPerSecond: "Tokens/Sec",
    },
};

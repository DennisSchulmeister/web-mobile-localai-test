# Learnings About the Platforms

These are observations from the prototype and its tested environments, not guarantees
for every browser or device.

* [Future Web APIs](#future-web-apis)
* [Web platform](#web-platform)
* [Android](#android)
* [Browser and operating-system differences](#browser-and-operating-system-differences)
* [General constraints and outlook](#general-constraints-and-outlook)

## Future Web APIs

The web platform currently offers no native APIs for running machine-learning models
locally. However, this could change in the future:

* **W3C Web Machine Learning Group**
  * [Website](https://webmachinelearning.github.io/)
  * [W3C page](https://www.w3.org/groups/cg/webmachinelearning/)
  * [GitHub](https://github.com/webmachinelearning/)

* **Proposed APIs (selection)**
  * [Web Neural Network API](https://www.w3.org/TR/webnn/)
  * [Dynamic AI Offloading Protocol](https://github.com/webmachinelearning/daop)
  * [Prompt API](https://github.com/webmachinelearning/prompt-api)
  * [Writing Assistance API](https://github.com/webmachinelearning/writing-assistance-apis)
  * [WebMPC](https://github.com/webmachinelearning/webmcp)

## Web platform

* `Uint8Array.fromBase64()` is not consistently supported by Android WebView. Older
  devices that have not received updates may lack Base64 methods and require a more
  compatible implementation.

* Running models of around 300 MB or larger with WebAssembly can block the browser's
  main thread. Rendering stops while inference runs, so timers and streamed text do not
  visibly update. This was observed in Firefox Desktop and Chrome Desktop.

* Performance drops sharply when the model does not fit in RAM and the operating system
  uses swap. Switching between models in one session can also create memory pressure.

* The browser may fail to allocate enough memory, for example:
  `Error: Can't create a session. ERROR_CODE: 6, ERROR_MESSAGE: std::bad_alloc`.

## Android

* The Android Emulator with 2 GB RAM terminates the app while loading the Qwen model
  (about 885.2 MB). ONNX Runtime briefly needs about 2.2 GB to load it. Without graph
  optimizations, it would need about 1.5 GB, but generation is roughly six times slower.

* WebGPU was detected in the Android Emulator, but model loading failed with:

  ```text
  Error: no available backend found.
  ERR: [webgpu] Error: Failed to get GPU adapter.
  You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.
  ```

  The same message also appeared when attempting to load a model for CPU execution with
  WebAssembly.

* The Android ONNX Runtime does not yet have stable GPU/TPU support. On Qualcomm
  Snapdragon devices, `onnxruntime-android-qnn` and models compiled specifically for it
  may help, but this is not a general solution.

* ONNX GenAI currently has to be built from source, and its API is still evolving.

* The ONNX Runtime GenAI Java interface crashes if `null` is passed as the template to
  `applyChatTemplate()`. Passing an empty string uses the model's template.

## Browser and operating-system differences

* In the tested mobile browsers, Chrome Mobile worked best. Firefox Mobile worked worst,
  with crashes and missing WASM SIMD support on older devices.

* On desktop Linux, Firefox 155+ performed significantly better than Chromium 154 in
  the tested setup. WebGPU support had to be enabled through `chrome://flags` in
  Chromium, and performance was about 0.2 tokens/second versus about 9 tokens/second
  in Firefox.

* On Windows, Firefox had a slow cold start: the first Qwen3 request took about five
  seconds and semantic search about 1.5 seconds. Later requests were closer to Linux
  performance, but Qwen3 was slower at about six tokens/second. Chrome on Windows did
  not show the same cold-start issue and reached about ten tokens/second for Qwen3.

## General constraints and outlook

* Memory is limited. Keeping multiple models resident at once is often impractical;
  models must be reloaded, adding wait time and network traffic.

* WebAssembly CPU inference can freeze the browser during execution, so it is most
  useful for very small models such as the semantic-search embedding model.

* Fine-tuning or developing specialized models may improve quality, but fitting a
  medium-sized 17B–33B model on a mobile device is not currently a realistic near-term
  expectation. More compact 1.5-bit models, such as `Bonsai-27B-mlx-1bit`, are an
  interesting direction.

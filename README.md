Web/Mobile Test for Local AI
=============================

1. [Description](#description)
1. [Preparations](#preparations)
1. [Starting the Application](#starting-the-application)
1. [Building the Android App](#building-the-android-app)
1. [Technical Implementation](#technical-implementation)
1. [Future Web APIs](#future-web-apis)
1. [Lessons Learned](#lessons-learned)
1. [Test Questions](#test-questions)
1. [TODOs](#todos)
1. [Conclusion](#conclusion)
1. [Copyright](#copyright)

Description
-----------

This is an experiment to find out whether small AI language models can also be run
in the browser on mobile devices with acceptable performance. Of course, only simple
use cases can be supported this way, but they also work 100% offline and locally (in a
Progressive Web App), ensuring data privacy.

The following use cases are to be tested here:

1. Summarize text (Summarization)
1. Translate text (Translation)
1. Answer questions (Question Answering)
1. Semantic search (Sentence Similarity)
1. Chat (Text Generation / Text2Text Generation)

<table>
    <tr>
        <td>
            <a href="./doc/img/screenshot1.png">
                <img src="./doc/img/screenshot1.png" width="200" alt="Screenshot: Select text page">
            </a>
        </td>
        <td>
            <a href="./doc/img/screenshot2.png">
                <img src="./doc/img/screenshot2.png" width="200" alt="Screenshot: View text page">
            </a>
        </td>
        <td>
            <a href="./doc/img/screenshot3.png">
                <img src="./doc/img/screenshot3.png" width="200" alt="Screenshot: Semantic search">
            </a>
        </td>
    </tr>
    <tr>
        <td>
            <a href="./doc/img/screenshot4.png">
                <img src="./doc/img/screenshot4.png" width="200" alt="Screenshot: Chat introduction">
            </a>
        </td>
        <td>
            <a href="./doc/img/screenshot5.png">
                <img src="./doc/img/screenshot5.png" width="200" alt="Screenshot: Load language model">
            </a>
        </td>
        <td>
            <a href="./doc/img/screenshot6.png">
                <img src="./doc/img/screenshot6.png" width="200" alt="Screenshot: Ongoing chat">
            </a>
        </td>
    </tr>
    <tr>
        <td>
            <a href="./doc/img/screenshot7.png">
                <img src="./doc/img/screenshot7.png" width="200" alt="Screenshot: System information">
            </a>
        </td>
        <td colspan="2">
            <a href="./doc/img/android-studio.png">
                <img src="./doc/img/android-studio.png" width="400" alt="Screenshot: Running in the Android Emulator">
            </a>
        </td>
    </tr>
</table>

Preparations
------------

The web application is located in `app/`; its dependencies are installed there with
`npm --prefix app ci`. The Capacitor CLI and Android platform dependencies are located
under `android/` and are installed with `npm --prefix android ci`.

The following steps must be performed before the application can be started:

1. **Download models:** To simulate a realistic deployment scenario, the web application
   does not download the models from the HuggingFace Model Hub. Instead, the models are
   hosted as part of the web application. To do this, they must be downloaded locally
   to the web server once.

2. **Prepare test data:** In preparation for the next step, keywords are extracted from
   the example pages and the pages are split into individual sentences. For simplicity,
   all headings and text marked in bold or italics are used as keywords. This allows
   text embeddings to be calculated for both in the next step, thereby building an index
   for semantic search.

3. **Calculate word embeddings:** Semantic search is based on the classic cosine
   similarity of word embeddings. During a search, the embedding of the search term is
   calculated and compared with the embeddings of the context blocks generated from the
   test documents. See [Lessons Learned](#semantic-search) below. Since the latter only
   change when the test data changes, they must be precomputed once before running the app.

All three steps can be run together with `npm --prefix app run init`.
Alternatively, the steps can be run individually:

1. `npm --prefix app run init:download`: Download models
2. `npm --prefix app run init:preprocess`: Prepare test data
3. `npm --prefix app run init:embeddings`: Calculate word embeddings

Whenever the test data changes, steps 2 and 3 must be run. If the feature extraction
models being used change (and only then), steps 1 and 3 must be run.

Since the data must be accessible to the client-side web application, the results of
these steps are stored in the `app/static` directory, but are excluded from Git version
control.

Starting the Application
------------------------

The development server can be started with `npm --prefix app start` or
`npm --prefix app run watch`. The application can then be opened in a browser at
http://localhost:8888.

For a static deployment, the application can be built with `npm --prefix app run build`.
The contents of the `app/static` directory can then be copied to a web server.

Docker Compose
--------------

The entire project can easily be deployed using the included Docker Compose setup in
the `compose.yml` file. The setup supports various scenarios, depending on whether all
or only some components are to run as Docker containers. The containers run the local
source code in temporary runtime containers without packaging the code itself into
containers:

1. Django backend in Docker, everything else locally
2. Django backend and database in Docker, everything else locally
3. Django backend and database in Docker, build the web app in Docker but host it locally
4. Django backend, database, and web app completely in Docker

Before the first start, the Django settings must be adjusted and the containers configured.
This is done by copying the following two files:

```sh
cp .env.template .env
cp server/wmlt/local_settings.py.template server/wmlt/local_settings.py
```

In `.env`, select the desired database driver. You may also need to adjust the connection
details for the database server. The available settings are documented in the corresponding
comments. In `server/wmlt/local_settings.py`, only the `SECRET_KEY` needs to be replaced.
The other settings can be left unchanged, but may be adjusted if needed. The containers
can then be started as follows:

```sh
# Django with an external database
docker compose --profile external up --build

# Django with PostgreSQL in the Compose network
docker compose --profile postgres up --build

# External database and frontend initialization/build
docker compose --profile external --profile node up --build

# PostgreSQL and frontend initialization/build
docker compose --profile postgres --profile node up --build

# Fully containerized: PostgreSQL, Django, frontend, and Caddy
docker compose --profile full up --build
```

The first start usually takes a little longer (several minutes), since all dependencies
must be installed and the language models downloaded.

Building the Android App
------------------------

The application can optionally also be packaged as an installable APK file for Android
using [Capacitor](https://capacitorjs.com/). To do this, the application must have been
initialized as described above and built at least once during local development. The
native Android project and its helper scripts are located under `android/`; the Gradle
project can be opened directly in Android Studio via `android/app/`.

The Android source files can then be updated with the following command. This must be
done whenever the web sources or the contents of the `app/static/` directory change.

```sh
npm --prefix android run android:sync
```

To build the app, it is best to open the `android/app/` directory in Android Studio and
select _Build → Generate App Bundles or APKs_.

To ensure that the APK does not exceed the size limits of the ZIP32 format, `android:sync`
prepares a separate `.capacitor/www/` directory after the web build. This is configured
as `webDir` in `android/capacitor.config.ts` and contains all web assets, but only
pre-downloaded models marked with `"engines": {"onnx-android": {"include": true}}` in
`app/static/models/index.json`.

The selected models must have been downloaded before syncing with
`npm --prefix app run init:download`. The staging directory is recreated on every sync
so that no outdated models are included.

Missing models are downloaded from the HuggingFace Hub by the Android app. To prevent
this, the affected features can be disabled in `app/static/config.json`.

Technical Implementation
------------------------

The implementation is deliberately kept as minimal as possible so as not to distract
from the actual experiment. The web interface uses:

* **Bundler:** [Esbuild](https://picocss.com/)
* **UI:** [Svelte](https://svelte.dev/)
* **Styling:** [Pico CSS](https://picocss.com/)
* **Icons:** [Bootstrap Icons](https://icons.getbootstrap.com/)

The following libraries and models are used for AI:

* **Runtime:** [transformers.js](https://huggingface.co/docs/transformers.js/index) (based on [ONNX](https://onnxruntime.ai/))
* **AI models:** See [app/static/models/index.json](app/static/models/index.json)

The application uses the high-level Pipeline API of transformers.js, since it encapsulates
the typical processing steps for each model type. If needed, however, the low-level
`Model`/`Tokenizer`/... classes could be used by adapting the `TransformersBackend` class.

The app can also be packaged as an Android app. This uses:

* **Capacitor:** https://capacitorjs.com/
* **Android SDK:** https://developer.android.com/

For native inference on Android, the ONNX Runtime is used directly to reproduce the
behavior of the relevant transformers.js pipelines. The code is anything but trivial,
however, and could only be created with the help of Copilot. Unfortunately, there is
not yet a port of HuggingFace Transformers for Android.

Future Web APIs
---------------

The web platform currently offers no native APIs for running machine learning models
locally. However, this could change in the future:

* __W3C Web Machine Learning Group__
  * [Website](https://webmachinelearning.github.io/)
  * [W3C page](https://www.w3.org/groups/cg/webmachinelearning/)
  * [GitHub](github.com/webmachinelearning/)

* __Proposed APIs (selection)__
  * [Web Neural Network API](https://www.w3.org/TR/webnn/)
  * [Dynamic AI Offloading Protocol](https://github.com/webmachinelearning/daop)
  * [Prompt API](https://github.com/webmachinelearning/prompt-api)
  * [Writing Assistance API](https://github.com/webmachinelearning/writing-assistance-apis)
  * [WebMPC](https://github.com/webmachinelearning/webmcp)

Lessons Learned
---------------

### Web Platform

* `Uint8Array.fromBase64()` is not yet consistently supported by the Android WebView.
  Older devices that have not received updates for a year (a scourge in the Android
  ecosystem!) lack the Base64 methods, so a more complicated implementation has to be
  used instead.

* Running large models (already around 300 MB) with Web Assembly blocks the browser so
  severely that it interrupts all other processes in the meantime. In particular, no
  rendering takes place. This is why our stopwatch appears not to run and the streamed
  text is not displayed. Tested with Firefox Desktop and Chrome Desktop.

* Memory pressure: Performance drops drastically if a model cannot be loaded entirely
  into RAM and the operating system has to use swap space. This can also happen when
  switching between multiple models in a session.

* Sometimes the browser may simply be unable to allocate enough memory:
  `Error: Can't create a session. ERROR_CODE: 6, ERROR_MESSAGE: std::bad_alloc`.

### Android

* The Android Emulator crashes when the Capacitor app loads the Qwen model (approx.
  885.2 MB). Even with the native runtime, the app is terminated by the Low Memory
  Killer in the emulator with 2 GB of RAM: the ONNX Runtime briefly needs approx.
  2.2 GB when loading the model. Without graph optimizations, it would need only approx.
  1.5 GB, but generation would then be about 6x slower.

* WebGPU does not seem to work in the Android Emulator. It is detected, but loading a
  model (SmolLM2) produces the following message:

  ```text
  Error: no available backend found.
  ERR: [webgpu] Error: Failed to get GPU adapter.
  You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.
  ```

  Interestingly, the message also appears when attempting to load a model for CPU
  execution with Web Assembly.

* Unfortunately, there is no port of the Transformers library for Android yet. As a
  result, the core functionality had to be reimplemented with Copilot, amounting to
  around 3000 LoC! The implementation also runs only on the CPU, because the ONNX Runtime
  for Android does not yet have stable GPU/TPU support.

* On devices with Qualcomm Snapdragon, `onnxruntime-android-qnn` could be used together
  with models compiled specifically for this runtime to accelerate the models. However,
  this is not a general solution.

* ONNX GenAI currently has to be built from source code. The API is also still in flux.

* The Java interface of ONNX Runtime GenAI crashes if `null` is passed as the template
  to `applyChatTemplate()`. An empty string uses the model's template.

### transformers.js and HuggingFace

* transformers.js requires models in ONNX format, since it is essentially a wrapper
  around ONNX.

* This is a general lesson about using ML models: each runtime (inference engine)
  defines its own data format for models. Conversion is often possible, but must be
  checked individually for each model.

* To find all compatible models, you have to search for both separately under
  "Libraries" on HuggingFace, since ONNX and transformers.js are two separate filters.
  However, selecting both only returns results that declare both in their metadata.

* The models must have a fixed directory structure to be usable:

  * `/config.json`
  * `/tokenizer_config.json`
  * `onnx/model.onnx`
  * `onnx/model_{dtype}.onnx`

  For example, if the `config.json` file is missing, transformers.js throws an error
  while downloading the model.

* The model filenames do not always indicate which data types (`dtype`) are supported.
  Therefore, the `app/bin/init/download.js` script calls the
  `ModelRegistry.get_available_dtypes()` function to retrieve the available data types
  and display them in the console.

* Sometimes models support German, even if this is not explicitly stated in the metadata.
  For example, `onnx-community/text_summarization-ONNX`.

* However, models for German seem to be rare overall. Most models are trained in English.
  For example, `Xenova/distilbart-xsum-12-1` generates only gibberish for German text.

* For many models, transformers.js has fixed configurations in its code that are not
  mentioned in the documentation. The hope is that other models can still be used.

* transformers.js version 4.2.0, based on ONNX Runtime 1.25+: with Web Assembly, only
  FP32 models can be loaded. Attempts to load a quantized model fail with
  "TransposeDQWeightsForMatMulNBits Missing required scale" because an optimization
  pass was introduced in ONNX that expects certain scale tensors in quantized models,
  which older quantized exports do not provide.

  Fixed as of transformers.js 4.3.0: [GitHub Issue](https://github.com/huggingface/transformers.js/issues/1707#issuecomment-4684921369)

* Models that are not yet available in ONNX format can be automatically converted and
  uploaded to HuggingFace with the following online tool. If you do not provide your
  own write token, they are uploaded under the `onnx-community` organization:

  [Space: Convert to ONNX](https://huggingface.co/spaces/onnx-community/convert-to-onnx)

### Semantic Search

* Many modern language models have a Transformer encoder that generates context-dependent
  token representations from input text. This is made accessible, for example, through
  a feature-extraction pipeline. However, not all language models or their representations
  are equally suitable for semantic search. In particular, the generated token
  representations are not automatically trained to produce meaningful semantic
  similarities through a simple vector comparison.

* Sentence Transformer models are particularly well suited to semantic search, since
  they are specifically trained to map semantically similar texts close together in
  the embedding space. This uses appropriate training methods and an embedding output
  suitable for comparison.

* For example, if you pass a single string to a model such as
  `sentence-transformers/all-MiniLM-L6-v2`, feature extraction returns a tensor with
  dimensions `(1, 15, 384)`. This means:

  * `1` input string
  * `15` tokens (depending on the input text)
  * `384` values per token (depending on the model)

* In the example, the output therefore consists of `1 × 15 × 384 = 5760` values. To
  obtain a uniform representation of the entire string from sequences of different
  lengths, the token embeddings are combined using mean pooling into a vector with
  384 values. This is the intended approach for `all-MiniLM-L6-v2`.

* The actual comparison of two embeddings can be performed using cosine similarity.
  Geometrically, it corresponds to the cosine of the angle between the two vectors and
  ranges from `-1` to `1`:

  * `-1` → opposite directions (`180°`)
  * `0` → orthogonal vectors (`90°`)
  * `1` → same direction (`0°`)

  See [Wikipedia: Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) <br>
  See [transformers.js: maths.cos_sim()](https://huggingface.co/docs/transformers.js/api/utils/maths#utilsmathscossimarr1-arr2--number)

* If the vectors are also normalized to unit length, calculating cosine similarity
  reduces to the dot product of the two vectors.

  See [transformers.js: maths.dot()](https://huggingface.co/docs/transformers.js/api/utils/maths#module_utils/maths.dot)

* As expected, the quality of semantic search depends on the embedding model used and
  on whether it recognizes synonyms for the terms used. For example, the small model
  `sentence-transformers/all-MiniLM-L6-v2` seems to recognize `WWW` and `World Wide Web`
  as synonyms, but not `IoT` and `Internet of Things`. Nevertheless, the probability of
  finding a match drops significantly when searching for `WWW` but the text says
  `World Wide Web`.

### Text Summarization

* The models available in ONNX format on HuggingFace have all been trained only on
  English texts. German texts are therefore reproduced verbatim and cut off at a fixed
  length.

* Only `Shahm/bart-german` seems to have been trained on a German dataset. However, the
  repository does not have the structure expected by transformers.js.

* There is at least a small selection in other formats. `deutsche-telekom/mt5-small-sum-de-en-v2`
  was converted to ONNX format for this test. However, the FP32 variant is 1.8 GB in size.

  * int8: approx. 1.4 GB. The tab crashes while loading in Firefox Desktop.

  * q4f16: approx. 600 MB. However, it cannot be loaded.

    ```text
    Error: Can't create a session. ERROR_CODE: 1, ERROR_MESSAGE: Type Error: Type (tensor(float16)) of output arg (/block.0/layer.0/layer_norm/Cast_output_0) of node (/block.0/layer.0/layer_norm/Cast) does not match expected type (tensor(float)).
    ```

  * fp16: approx. 817 MB. Cannot be loaded with the same error message.

  * q4: approx. 1.1 GB. It can be loaded, but the `tokenizer_config.json` file is
    missing. Generation therefore fails with `TypeError: tokenizer is not a function`.

  It appears that the ONNX Runtime does not support fp16.

* `Shahm/t5-small-german` was successfully converted and tested. However, the particularly
  small `q4` and `bnb4` variants do not generate any text. And the summaries are almost
  always just one sentence long. 🙂

* If the model is allowed to generate too few tokens (for example, only ten), the text
  is cut off. In general, the model seems designed to extract a passage from the request.

* In general, there do not seem to be any good German-language models, or they are too
  large for use in the browser (1.5 GB and more). Thus, "summarization" with
  `Shahm/t5-small-german` is possible, but the summary is too short.

  `onnx-community/bart-german-ONNX` returns somewhat longer texts of up to three sentences.
  That is still too short. And the model inserts nonsensical artifacts (incorrect word
  fragments with technical terms unrelated to the context), which were presumably in
  the training data. This significantly impairs readability.

* Both models also seem to consider only the beginning of the texts and sometimes
  reproduce it verbatim.

### Question Answering

* The models try to find a single passage of text that seems to answer the given question.
  It is reproduced almost verbatim, even if it is only sentence fragments.

* The small model `onnx-community/all-MiniLM-L12-v2-qa-all-ONNX` performs relatively
  well, but returns only a very small excerpt of text. However, it seems to have problems
  with umlauts and capitalization, since the answers are always lowercase and contain
  no umlauts.

* The larger model `dewdev/mdeberta-v3-base-squad2-onnx` returns much larger answers,
  but they often do not fit the question asked.

### Text Translation

* `huggingworld/m2m100_418M` generates only gibberish for input that is too large.
  The page "What Makes Up a Computer?" works well, even though the translation is not
  perfect. The other pages are probably too large. It keeps repeating the same initial
  string.

* The slightly smaller `casawolice/small100-onnx` seems to behave similarly. For large
  texts, it sometimes provides no translation at all or only meaningless strings. For
  small texts, it produces a translation, but the grammar is incorrect and it contains
  many spelling errors.

* Firefox 157 on Linux does not generate a response when the model is run on the GPU.
  Apparently, no data is ever transferred back to the CPU, so it does not detect when
  the model is finished.

### Chat

* There are essentially two types of conversational models, which must be used with
  different pipelines:

  * T5-style: [`text2text-generation` pipeline](https://huggingface.co/docs/transformers.js/main/en/api/pipelines?utm_source=chatgpt.com#module_pipelines.Text2TextGenerationPipeline)
  * GPT-style (CausalLM): [`text-generation` pipeline](https://huggingface.co/docs/transformers.js/main/en/api/pipelines?utm_source=chatgpt.com#module_pipelines.TextGenerationPipeline)

* The `text2text-generation` pipeline simply expects the input message as a string or
  as a string array with multiple messages.

* Alternatively, the `text-generation` pipeline can accept `Chat` objects that assign
  a role such as `system` or `user` to the messages:

  ```js
  const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Write me a poem about Machine Learning.' },
  ];
  ```

* However, `Chat` objects require a chat template to be translated into the token
  structure expected by the model. From the
  [Transformer documentation](https://huggingface.co/docs/transformers/main/en/chat_templating):

  ```text
  The critical insight needed to understand chat models is this: All causal
  LMs, whether chat-trained or not, continue a sequence of tokens. When causal
  LMs are trained, the training usually begins with “pre-training” on a huge
  corpus of text, which creates a “base” model. These base models are then
  often “fine-tuned” for chat, which means training them on data that is
  formatted as a sequence of messages. The chat is still just a sequence of
  tokens, though! The list of role and content dictionaries that you pass to a
  chat model get converted to a token sequence, often with control tokens like
  <|user|> or <|assistant|> or <|end_of_message|>, which allow the model to see
  the chat structure. There are many possible chat formats, and different
  models may use different formats or control tokens, even if they were
  fine-tuned from the same base model!
  ```

* Whether a model is "instruction-tuned" and thus expects a chat structure as input
  depends on the model. If a model is not "instruction-tuned", it also has no chat
  template and consequently can only be called with a simple string as input.

* `onnx-community/Qwen3-0.6B-ONNX` and `LiquidAI/LFM2.5-1.2B-Instruct-ONNX` also speak
  German. However, Qwen's answers to questions in German are much worse in content
  (it talks nonsense) than its answers to questions in English. The same is probably
  true of LiquidAI, although its German answers seem better than Qwen's. The answers
  from both models are more detailed (in all languages) than those from the other models.

* Qwen also seems to provide fairly good answers based on a text page as context.
  Overall, it performs best among the mini-LLMs tested.

* `onnx-community/SmolLM2-135M-Instruct-ONNX` has good speed. The model is also very
  small (approx. 200 MB). The quality of the answers varies greatly, from good to more
  or less nonsensical.

* `Xenova/LaMini-Flan-T5-783M` generates very short answers. Nevertheless, it is very slow.

* `teapotai/teapotllm` is actually trained to answer only questions about a given context.
  To do this, the question must be on its own line below the context, separated by a
  blank line. Without context, the model answers from its internal knowledge, but even
  more briefly than `Xenova/LaMini-Flan-T5-783M`. With context, it provides longer and
  better answers, but overall they are still unsatisfactory.

* The tested `text2text-generation` models all perform worse than the LLM-like
  `text-generation` models. The answers are short (only one or two sentences) and take
  a long time to generate.

#### Test Case: "What is HTML?"

To obtain a repeatable test, the browser is restarted for each model, and only the chat
page for a free chat without context is opened and the model loaded. The following
messages are then entered:

1. What is HTML?
2. What is CSS?
3. What is JavaScript?

Only performance is measured, not the quality of the answer. The parameters are:

* Max Tokens: Unlimited
* Temperature: 0.3
* Repetition penalty: 1.1
* Sampling: Enabled
* Execution: WebGPU
* Quantization: q4

The following measurements were taken on Fedora Linux with Firefox 157 on a Lenovo E580
with the following specifications: 4x Intel(R) Core(TM) i7-8550U CPU @ 1.80GHz (with
Hyper-Threading), 16 GB RAM, 2 GB GPU, built in 2018.

| Type      | Model                                                     | Size      | Question | Tokens | First token | Tokens/Sec | Duration  |
|-----------|-----------------------------------------------------------|----------:|---------:|-------:|------------:|-----------:|----------:|
| Text-Gen  | `onnx-community/SmolLM2-135M-Instruct-ONNX`                |  175.6 MB |        1 |    323 |       0.31s |       8.79 |    37.06s |
|           |                                                           |           |        2 |    351 |       0.23s |       9.25 |    38.16s |
|           |                                                           |           |        3 |    312 |       0.21s |       8.69 |    36.12s |
|           | `onnx-community/Qwen3-0.6B-ONNX`                          |  885.2 MB |        1 |    116 |       0.45s |       9.94 |    12.12s |
|           |                                                           |           |        2 |    103 |       0.38s |       9.47 |    11.27s |
|           |                                                           |           |        3 |    254 |       0.47s |       9.91 |    25.81s |
|           | `LiquidAI/LFM2.5-1.2B-Instruct-ONNX`                      |  814.0 MB |        1 |    114 |       0.83s |       7.65 |    15.74s |
|           |                                                           |           |        2 |    147 |       0.73s |       9.35 |    16.46s |
|           |                                                           |           |        3 |    173 |       0.73s |       9.69 |    18.58s |
|           | `onnx-community/Apertus-v1.1-0.5B-Instruct-QAD-INT4-ONNX` |    790 MB |        1 |    404 |       0.46s |       9.83 |    41.58s |
|           |                                                           |           |        2 | > 3105 |       0.40s |       7.76 | < 400.00s |
|           |                                                           |           |        2 |     78 |       0.40s |      10.05 |     8.81s |
|           |                                                           |           |        3 | > 1007 |       0.38s |       9.88 | < 102.37s |
|           | `onnx-community/Apertus-v1.1-1.5B-Instruct-QAD-INT4-ONNX` | 1780.9 MB |        1 |    102 |       0.84s |       5.29 |    20.14s |
|           |                                                           |           |        2 |    301 |       0.74s |       5.28 |    57.80s |
|           |                                                           |           |        3 |     94 |       0.73s |       5.46 |    17.96s |
| Text2Text | `Xenova/LaMini-Flan-T5-783M`                              |  702.6 MB |        1 |     25 |       1.02s |       2.52 |    10.94s |
|           |                                                           |           |        2 |     49 |       0.86s |       2.52 |    20.30s |
|           |                                                           |           |        3 |     20 |       0.95s |       2.47 |     9.06s |
|           | `teapotai/teapotllm`                                      |  702.7 MB |        1 |     20 |       0.94s |       2.46 |     9.05s |
|           |                                                           |           |        2 |     25 |       0.93s |       2.60 |    10.54s |
|           |                                                           |           |        3 |     18 |       0.76s |       2.49 |     7.99s |

`Apertus-v1.1-0.5B-Instruct-QAD-INT4-ONNX` occasionally fails to generate the stop token,
especially when sampling is enabled. The tests were therefore stopped after 400 seconds
or 1000 tokens.

#### Test Case: Text Summarization

Same test conditions as above. However, the "English / Internet of Things" page is opened.
The request to the model is: "Please summarize."

| Type      | Model                                       | Tokens | First token | Tokens/Sec | Duration |
|-----------|---------------------------------------------|-------:|------------:|-----------:|---------:|
| Text-Gen  | `onnx-community/SmolLM2-135M-Instruct-ONNX` |    204 |       1.14s |       8.71 |   24.57s |
|           | `onnx-community/Qwen3-0.6B-ONNX`            |     91 |       2.71s |       5.93 |   18.07s |
|           | `LiquidAI/LFM2.5-1.2B-Instruct-ONNX`        |     97 |       7.30s |       6.74 |   21.69s |
| Text2Text | `Xenova/LaMini-Flan-T5-783M`                |     29 |       2.16s |       2.33 |   14.61s |
|           | `teapotai/teapotllm`                        |     82 |       2.00s |       2.38 |   36.44s |

#### Linux vs. Windows

On Windows, Firefox has a slow cold start. The first request to a model takes a
comparatively long time (approx. 5 seconds for Qwen3, 1.5 seconds for semantic search).
From the second request onward, performance is similar to Linux, but a little slower
(Qwen3 approx. 6 tokens/second).

Chrome on Windows does not have the cold-start issues and is sometimes even a little
faster than Firefox on Linux (Qwen3 approx. 10 tokens/second).

### All Models

Unlike most LLMs, the small models used here are not good at processing or generating
Markdown syntax. Among the LLMs tested, all can handle it except `teapotai/teapotllm`.

The models can be classified into three basic architectures, as shown in the table below.

| Model architecture       | High-Level Pipelines                                      | Low-Level AutoModel           |
|--------------------------|-----------------------------------------------------------|-------------------------------|
| Encoder-only             | e.g. `feature-extraction`, `text-classification`          | `AutoModel` / task-specific   |
| Encoder-decoder / Seq2Seq | `text2text-generation`, `translation`, `summarization`   | `AutoModelForSeq2SeqLM`       |
| Decoder-only / Causal LM | `text-generation`                                         | `AutoModelForCausalLM`        |

The performance of a model does not depend only on its size. It is also crucial whether
the model (or its ONNX export) can be run efficiently on the GPU, as the following table
shows:

| Model                                                     | Size (q4) | Tokens/Sec |
|-----------------------------------------------------------|----------:|-----------:|
| `onnx-community/SmolLM2-135M-Instruct-ONNX`                |   175.6 MB |     ~ 8.91 |
| `onnx-community/Qwen3-0.6B-ONNX`                           |   885.2 MB |     ~ 9.80 |
| `BananaMind/BananaMind-2-Medium-Chat-ONNX`                 |    54.9 MB |     ~ 0.80 |
| `onnx-community/Apertus-v1.1-0.5B-Instruct-QAD-INT4-ONNX` |   702.6 MB |     ~ 9.88 |
| `onnx-community/Apertus-v1.1-1.5B-Instruct-QAD-INT4-ONNX` |  1780.9 MB |     ~ 5.34 |

Although Qwen is the largest model, it runs the fastest because it has a highly optimized
architecture compared to SmolLM2: fewer nodes and also higher-level nodes that combine
complex calculations in a single step.

The problem with BananaMind is that it contains explicit `IsNaN` checks after every
Attention Layer, which the ONNX Runtime can only execute on the CPU. This means that
after every Attention Layer there are explicit data transfers from GPU to CPU and back
again. These take significantly more time than the remaining calculations on the GPU.
When run with WASM, performance increases to approx. 6.3 tokens/second. However, the
browser freezes completely (as with all models run with WASM).

The numbers were determined from the debug logs generated when loading the models and
with Copilot. The logs are located under `doc/logs/**/debug-loading.log`. Tested with
Firefox 157 on Fedora Linux.

| Graph nodes             | SmolLM2 | Qwen3 | BananaMind |
|-------------------------|--------:|------:|-----------:|
| Transformer Layer       |      30 |    28 |         12 |
| Total nodes             |    2668 |   376 |       1646 |
| WebGPU nodes            |    1987 |   369 |       1027 |
| CPU nodes               |     681 |     7 |        619 |
| CPU → GPU data transfers |       5 |     2 |         28 |
| GPU → CPU data transfers |       0 |     0 |         13 |
| CPU IsNaN nodes         |       0 |     0 |         12 |
| Fused attention nodes   |       0 |    28 |          0 |

In addition, `q4f16` does not seem to be a good format for running on the web. Models in
this format cannot be run on my Linux computer (Device not supported), and run very
slowly on Windows (AMD Ryzen) at only 0.42 tokens/second.

Test Questions
--------------

Good test questions for checking hallucinations (of which there are quite a few with
the small LLMs):

1. What is HTML?
2. What is the Internet of Things?
3. How did the Yamaha DX7 work?
4. What happened to the rock band Dire Straits?

The DX7 sometimes becomes a tiny electric guitar (Qwen) 🤣:

> The Yamaha DX7 is an electric guitar that was designed by Yama, a Japanese musician known for
> is musical style and production of music in Japan. It was created to be used as a companion
> instrument in the band "Yama" during their time on the road. The DX7 has a unique design with
> a small, rectangular body and a 60mm (24cm) scale. Its sound is characterized by its low, resonant
> tone and a bright, clear vibrato effect.
>
> In terms of playing, the DX7 is played using either a standard tuning system or a modified one
> where the tuning is adjusted to match the player's preference. The instrument is often used in
> pop and rock genres, especially with the addition of a small, portable speaker to enhance the
> listening experience. The DX7 has been widely popular since its release in the early 1980s, even
> though it was later replaced by other models like the DX5 and DX6.
>
> If you have any specific questions about how the DX7 works or its features, feel free to ask!

Confidently delivered nonsense.

Test questions about a specific page (request with context):

1. __English / Internet of Things:__ Please summarize.
2. __English / What Makes Up a Computer?:__ How does this relate to a generic laptop or PC?
3. __English / The Idea Behind the World Wide Web:__ Which HTML version was used for Beethoven's 5th symphony?

Qwen3 shows a sense of humor 🎶 (it does not catch the typo in "Beethoven"):

> __User:__ _Which HTML version was used for Bethovens 5th symphony?_
>
> __Assistant:__ The HTML version used for Bethovens' 5th Symphony is HTML 5.

Apertus0.5b without the typo 🤖:

> __User:__ _Which HTML version was used for Beethovens 5th symphony?_
>
> __Assistant:__ The HTML version used for Beethoven's 5th symphony is 1.0.0.
> It was the first version of HTML that was widely used for web pages. It was
> the foundation for the HTML 2.0, 3.0, and 4.0 versions that followed.

TODOs
-----

Measure performance as above, and additionally evaluate quality with questions such as
(each assessed on an ordinal scale with fixed criteria):

* Is the generated Markdown code syntactically correct?
* Is the answer linguistically correct (spelling, grammar, punctuation)?
* Is the answer factually correct?
* Does the answer address the meaning of the question?
* Is the length of the answer appropriate?

The qualitative evaluation must be carried out both for questions without context
("What is HTML?" ...) and for questions with context ("Please summarize" ...).

Conclusion
----------

Smaller use cases that can be handled by models under 1 GB can be run locally on mobile
devices within a web application. However, there are limitations:

* The ecosystem is evolving rapidly. As a result, it is not always stable, as shown by
  the error messages triggered by ONNX 1.25, which went unfixed in Transformers.js for
  months.

* It does not work with every browser. Chrome Mobile has worked best so far. Firefox
  Mobile has worked worst (crashes, no WASM SIMD support on older devices, ...).

* On desktop Linux, the situation is currently exactly the opposite: Firefox 155+
  performs significantly better than Chromium 154, since WebGPU is almost fully
  supported. In Chromium, WebGPU support currently still has to be enabled under
  [chrome://flags](chrome://flags) by selecting `Unsafe WebGPU Support`. Performance is
  abysmal, however (only 0.2 tokens/second compared to 9 tokens/second in Firefox).

* Memory is very limited. It is therefore not practical to keep several models in
  memory at the same time; they have to be reloaded regularly. Besides the wait time,
  this also increases traffic.

* WASM: The browser freezes while a model is running. No rendering takes place and
  therefore the display is not updated while a model is running. CPU execution therefore
  makes sense only for very small models, such as those used for semantic search.

* The small models tested for specialized applications (translation, summarization,
  question answering) are comparatively slow and do not produce satisfactory results.
  The small LLMs tested here were both faster and better.

* Fine-tuning or developing custom models would be the next logical steps for creating
  small models for specialized requirements. The goal would probably have to be to slim
  down a medium-sized LLM (17B to 33B) enough to run on the device and deliver reasonably
  satisfactory results. In the foreseeable future, this is unlikely for mobile devices
  and execution in a web browser.

* 1.5-bit models could be interesting approaches in this direction, since they are
  significantly more compact than conventional models, e.g. `Bonsai-27B-mlx-1bit`.

* In general, most smaller open models are trained in English. Explicitly German-language
  models are rare, and their quality is not very high either.

Copyright
---------

**Web/Mobile Test for Local AI** <br>
© 2026 Dennis Schulmeister-Zimolong <[dennis@wpvs.de](mailto:dennis@wpvs.de)> <br>
[Source code licensed under BSD 3-Clause](.LICENCE) <br>
Example data licensed under CC-BY 4.0, http://creativecommons.org/licenses/by/4.0/

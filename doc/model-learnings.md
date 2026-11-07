# Learnings About AI Models and Use Cases

The observations below come from experiments with transformers.js, ONNX models, and
small language models. Model support and runtime behavior can change between versions.

* [transformers.js and HuggingFace](#transformersjs-and-huggingface)
* [Semantic search](#semantic-search)
* [Summarization](#summarization)
* [Question answering](#question-answering)
* [Translation](#translation)
* [Chat and text generation](#chat-and-text-generation)
* [Model architecture and execution](#model-architecture-and-execution)
* [Overall conclusion](#overall-conclusion)

## transformers.js and HuggingFace

* transformers.js requires ONNX models; it is essentially a wrapper around ONNX Runtime.
  Each inference runtime defines its own model format, and conversion must be verified
  for each model.

* To find compatible models on HuggingFace, search the "Libraries" filters for both
  ONNX and transformers.js. Selecting both filters returns models whose metadata
  declares both.

* Models need the expected directory structure:

  ```text
  /config.json
  /tokenizer_config.json
  onnx/model.onnx
  onnx/model_{dtype}.onnx
  ```

  For example, without `config.json`, transformers.js fails while downloading the model.

* Model filenames do not always identify supported data types. The
  `app/bin/init/download.js` script uses `ModelRegistry.get_available_dtypes()` to list
  them.

* Some models support German even when this is not stated in their metadata, such as
  `onnx-community/text_summarization-ONNX`. However, most models are trained in English;
  `Xenova/distilbart-xsum-12-1`, for example, produces gibberish for German text.

* transformers.js includes model-specific configurations that are not always documented.

* With transformers.js 4.2.0 and ONNX Runtime 1.25+, WebAssembly accepted only FP32
  models in the tested setup. Quantized models failed with
  `TransposeDQWeightsForMatMulNBits Missing required scale`, because the ONNX
  optimization expected scale tensors absent from older quantized exports. This was
  fixed in transformers.js 4.3.0:
  [GitHub issue](https://github.com/huggingface/transformers.js/issues/1707#issuecomment-4684921369).

* Models not yet in ONNX format can be converted with the
  [Convert to ONNX HuggingFace Space](https://huggingface.co/spaces/onnx-community/convert-to-onnx).
  Without a write token, converted models are uploaded under `onnx-community`.

## Semantic search

* A feature-extraction pipeline produces contextual token representations, but not all
  model representations are trained to give useful semantic similarities by simple
  vector comparison. Sentence Transformer models are designed to place semantically
  similar texts close together in embedding space.

* For `sentence-transformers/all-MiniLM-L6-v2`, extracting features from one example
  string produced a tensor of shape `(1, 15, 384)`: one input, 15 tokens, and 384 values
  per token. That is `1 × 15 × 384 = 5760` values in total. To obtain a uniform
  representation of the entire string, mean pooling combines the token embeddings into
  one 384-value vector. For `all-MiniLM-L6-v2`, this is the intended approach.

* The similarity between two embeddings can be calculated using cosine similarity. It
  is geometrically the cosine of the angle between the two vectors and ranges from
  `-1` to `1`:

  * `-1` → opposite directions (`180°`)
  * `0` → orthogonal vectors (`90°`)
  * `1` → same direction (`0°`)

  See [Wikipedia: Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
  and [transformers.js: maths.cos_sim()](https://huggingface.co/docs/transformers.js/api/utils/maths#utilsmathscossimarr1-arr2--number).

* If the vectors are also normalized to unit length, calculating cosine similarity
  reduces to the dot product of the two vectors. See
  [transformers.js: maths.dot()](https://huggingface.co/docs/transformers.js/api/utils/maths#module_utils/maths.dot).

* The small `sentence-transformers/all-MiniLM-L6-v2` model seemed to recognize `WWW`
  and `World Wide Web` as synonyms, but not `IoT` and `Internet of Things`. Search
  matching still dropped when the query and document used different terms.

## Summarization

* The ONNX summarization models found on HuggingFace were trained on English. In tests,
  they reproduced German text verbatim and then cut it off.

* `Shahm/bart-german` appeared to be trained on German, but its repository did not have
  the structure expected by transformers.js.

* `deutsche-telekom/mt5-small-sum-de-en-v2` was converted to ONNX for testing. The FP32
  model was 1.8 GB. The 1.4 GB int8 variant crashed the Firefox Desktop tab during load.
  The 600 MB q4f16 and 817 MB fp16 variants failed with a float16/float type mismatch.
  The 1.1 GB q4 variant loaded, but lacked `tokenizer_config.json` and failed during
  generation with `TypeError: tokenizer is not a function`.

* `Shahm/t5-small-german` converted and ran, but q4 and bnb4 produced no text and its
  summaries were usually one sentence. With too few output tokens, the answer was cut
  off; the model seemed to extract a passage from the prompt.

* `onnx-community/bart-german-ONNX` returned up to three sentences, but inserted
  unrelated technical word fragments and appeared to focus on the beginning of the
  input. German models were either low quality or too large for browser use.

## Question answering

* The tested models generally returned a passage that seemed to answer the question,
  nearly verbatim and sometimes as a fragment.

* `onnx-community/all-MiniLM-L12-v2-qa-all-ONNX` performed relatively well but returned
  a very short extract. Answers were lowercase and omitted umlauts.

* `dewdev/mdeberta-v3-base-squad2-onnx` returned longer answers, but they often did not
  match the question.

## Translation

* `huggingworld/m2m100_418M` produced gibberish for inputs that were too large. The
  "What Makes Up a Computer?" page worked reasonably, but other pages were apparently
  too large and caused repetition of an initial string.

* The smaller `casawolice/small100-onnx` behaved similarly: large texts yielded no
  translation or meaningless strings; short translations contained grammar and spelling
  errors.

* Firefox 157 on Linux did not return a response when the model ran on the GPU. The
  observed issue suggested completion was not detected after GPU execution.

## Chat and text generation

* The `text2text-generation` pipeline accepts a string or an array of strings.
  `text-generation` can also accept chat messages with roles such as `system` and `user`.
  Chat messages need a model-compatible chat template. Models that are not
  instruction-tuned may not have one and may only accept a plain string.

* `onnx-community/Qwen3-0.6B-ONNX` and `LiquidAI/LFM2.5-1.2B-Instruct-ONNX` support
  German. Qwen's German answers were substantially worse than its English answers;
  LiquidAI's German answers seemed better, though this was not systematically assessed.
  Both produced more detailed answers than the other tested models. Qwen gave the best
  contextual answers among the tested mini-LLMs.

* `onnx-community/SmolLM2-135M-Instruct-ONNX` was fast and small (about 200 MB), but
  answer quality varied from good to nonsensical.

* `Xenova/LaMini-Flan-T5-783M` was very slow and generated short answers.
  `teapotai/teapotllm` works best with a context followed by a blank line and a question;
  without context, it answered from internal knowledge but briefly. With context its
  answers were longer and better, but still not satisfactory overall.

* In these tests, text2text-generation models were slower and less useful than the
  LLM-style text-generation models. Answers were typically one or two sentences.

* Small models are generally not good at processing or generating Markdown syntax;
  among the tested chat LLMs, `teapotai/teapotllm` was the exception.

## Model architecture and execution

| Model architecture        | High-level pipelines                                   | Low-level AutoModel         |
|---------------------------|--------------------------------------------------------|-----------------------------|
| Encoder-only              | `feature-extraction`, `text-classification`            | `AutoModel` / task-specific |
| Encoder-decoder / Seq2Seq | `text2text-generation`, `translation`, `summarization` | `AutoModelForSeq2SeqLM`     |
| Decoder-only / Causal LM  | `text-generation`                                      | `AutoModelForCausalLM`      |

Model size alone does not determine performance. The efficiency of its ONNX graph and
GPU execution also matter. In particular, CPU/GPU data transfers and CPU-only graph
operations can dominate inference time. See the [initial test results](initial-test-results.md)
for the measured graph-node counts and throughput.

## Overall conclusion

For simple tasks, models under 1 GB can run locally in a mobile web app, but the
specialized summarization, translation, and question-answering models tested were often
slow or unsatisfactory. The tested small chat LLMs were generally faster and more useful,
but quality varied and German-language capability was limited. Most smaller open models
were trained in English.

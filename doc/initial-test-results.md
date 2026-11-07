# Initial Test Results

These are early exploratory measurements, not a standardized benchmark. The structured
evaluation criteria are defined in the [test plan](test-plan.md).

* [Chat throughput: "What is HTML?"](#chat-throughput-what-is-html)
* [Contextual summarization](#contextual-summarization)
* [Average throughput and graph composition](#average-throughput-and-graph-composition)
* [Hallucination examples](#hallucination-examples)

## Chat throughput: "What is HTML?"

For each model, the browser was restarted, a context-free chat was opened, and the model
was loaded. The following prompts were then sent:

1. What is HTML?
2. What is CSS?
3. What is JavaScript?

Only performance was measured, not answer quality. Settings: unlimited max tokens,
temperature 0.3, repetition penalty 1.1, sampling enabled, WebGPU execution, q4
quantization.

Test environment: Fedora Linux, Firefox 157, Lenovo E580, Intel Core i7-8550U
(4 cores with Hyper-Threading, 1.80 GHz), 16 GB RAM, 2 GB GPU, built in 2018.

| Type      | Model                                                     |      Size | Question | Tokens | First token | Tokens/sec | Duration   |
|-----------|-----------------------------------------------------------|----------:|---------:|-------:|------------:|-----------:|-----------:|
| Text-Gen  | `onnx-community/SmolLM2-135M-Instruct-ONNX`               | 175.6 MB  |        1 |    323 |      0.31 s |       8.79 |    37.06 s |
|           |                                                           |           |        2 |    351 |      0.23 s |       9.25 |    38.16 s |
|           |                                                           |           |        3 |    312 |      0.21 s |       8.69 |    36.12 s |
|           | `onnx-community/Qwen3-0.6B-ONNX`                          | 885.2 MB  |        1 |    116 |      0.45 s |       9.94 |    12.12 s |
|           |                                                           |           |        2 |    103 |      0.38 s |       9.47 |    11.27 s |
|           |                                                           |           |        3 |    254 |      0.47 s |       9.91 |    25.81 s |
|           | `LiquidAI/LFM2.5-1.2B-Instruct-ONNX`                      | 814.0 MB  |        1 |    114 |      0.83 s |       7.65 |    15.74 s |
|           |                                                           |           |        2 |    147 |      0.73 s |       9.35 |    16.46 s |
|           |                                                           |           |        3 |    173 |      0.73 s |       9.69 |    18.58 s |
|           | `onnx-community/Apertus-v1.1-0.5B-Instruct-QAD-INT4-ONNX` |   790 MB  |        1 |    404 |      0.46 s |       9.83 |    41.58 s |
|           |                                                           |           |        2 | > 3105 |      0.40 s |       7.76 | < 400.00 s |
|           |                                                           |           |        2 |     78 |      0.40 s |      10.05 |     8.81 s |
|           |                                                           |           |        3 | > 1007 |      0.38 s |       9.88 | < 102.37 s |
|           | `onnx-community/Apertus-v1.1-1.5B-Instruct-QAD-INT4-ONNX` | 1780.9 MB |        1 |    102 |      0.84 s |       5.29 |    20.14 s |
|           |                                                           |           |        2 |    301 |      0.74 s |       5.28 |    57.80 s |
|           |                                                           |           |        3 |     94 |      0.73 s |       5.46 |    17.96 s |
| Text2Text | `Xenova/LaMini-Flan-T5-783M`                              | 702.6 MB  |        1 |     25 |      1.02 s |       2.52 |    10.94 s |
|           |                                                           |           |        2 |     49 |      0.86 s |       2.52 |    20.30 s |
|           |                                                           |           |        3 |     20 |      0.95 s |       2.47 |     9.06 s |
|           | `teapotai/teapotllm`                                      | 702.7 MB  |        1 |     20 |      0.94 s |       2.46 |     9.05 s |
|           |                                                           |           |        2 |     25 |      0.93 s |       2.60 |    10.54 s |
|           |                                                           |           |        3 |     18 |      0.76 s |       2.49 |     7.99 s |

`Apertus-v1.1-0.5B-Instruct-QAD-INT4-ONNX` sometimes failed to generate a stop token,
especially with sampling enabled. The tests were stopped after 400 seconds or 1000
tokens. The original measurements list one overlong run for question 2 followed by a
shorter run of 78 tokens.

## Contextual summarization

Same setup as above, using the "English / Internet of Things" page as context and the
prompt "Please summarize."

| Type      | Model                                       | Tokens | First token | Tokens/sec | Duration |
|-----------|---------------------------------------------|-------:|------------:|-----------:|---------:|
| Text-Gen  | `onnx-community/SmolLM2-135M-Instruct-ONNX` |    204 |      1.14 s |       8.71 |  24.57 s |
|           | `onnx-community/Qwen3-0.6B-ONNX`            |     91 |      2.71 s |       5.93 |  18.07 s |
|           | `LiquidAI/LFM2.5-1.2B-Instruct-ONNX`        |     97 |      7.30 s |       6.74 |  21.69 s |
| Text2Text | `Xenova/LaMini-Flan-T5-783M`                |     29 |      2.16 s |       2.33 |  14.61 s |
|           | `teapotai/teapotllm`                        |     82 |      2.00 s |       2.38 |  36.44 s |

## Average throughput and graph composition

| Model                                                     | Size (q4) | Tokens/sec |
|-----------------------------------------------------------|----------:|-----------:|
| `onnx-community/SmolLM2-135M-Instruct-ONNX`               |  175.6 MB |      ~8.91 |
| `onnx-community/Qwen3-0.6B-ONNX`                          |  885.2 MB |      ~9.80 |
| `BananaMind/BananaMind-2-Medium-Chat-ONNX`                |   54.9 MB |      ~0.80 |
| `onnx-community/Apertus-v1.1-0.5B-Instruct-QAD-INT4-ONNX` |  702.6 MB |      ~9.88 |
| `onnx-community/Apertus-v1.1-1.5B-Instruct-QAD-INT4-ONNX` | 1780.9 MB |      ~5.34 |

Although Qwen is larger than SmolLM2, it ran faster in this test. Its graph had fewer
nodes and used higher-level nodes that combine calculations. BananaMind included
`IsNaN` checks after each attention layer that ran on the CPU, causing frequent GPU/CPU
transfers. On WASM, BananaMind reached about 6.3 tokens/second, but froze the browser.

Graph counts were read from model-loading debug logs in `doc/logs/**/debug-loading.log`,
using Firefox 157 on Fedora Linux:

| Graph nodes              | SmolLM2 | Qwen3 | BananaMind |
|--------------------------|--------:|------:|-----------:|
| Transformer layers       |      30 |    28 |         12 |
| Total nodes              |    2668 |   376 |       1646 |
| WebGPU nodes             |    1987 |   369 |       1027 |
| CPU nodes                |     681 |     7 |        619 |
| CPU → GPU data transfers |       5 |     2 |         28 |
| GPU → CPU data transfers |       0 |     0 |         13 |
| CPU IsNaN nodes          |       0 |     0 |         12 |
| Fused attention nodes    |       0 |    28 |          0 |

`q4f16` did not work on the tested Linux computer ("Device not supported") and ran at
only 0.42 tokens/second on Windows with an AMD Ryzen system.

## Hallucination examples

Useful context-free prompts for checking hallucinations:

1. What is HTML?
2. What is the Internet of Things?
3. How did the Yamaha DX7 work?
4. What happened to the rock band Dire Straits?

For "How did the Yamaha DX7 work?", Qwen confidently described the DX7 as a tiny
electric guitar, including invented details about a band, tuning, and dimensions:

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

This is an example of fluent but fabricated output.

Contextual prompts used:

1. **English / Internet of Things:** Please summarize.
2. **English / What Makes Up a Computer?:** How does this relate to a generic laptop or PC?
3. **English / The Idea Behind the World Wide Web:** Which HTML version was used for Beethoven's 5th symphony?

For the third prompt, Qwen interpreted the misspelling "Bethovens" as a question about
HTML 5:

> **User:** _Which HTML version was used for Bethovens 5th symphony?_
>
> **Assistant:** The HTML version used for Bethovens' 5th Symphony is HTML 5.

Apertus 0.5B answered without the typo, but still fabricated an answer and history of
HTML versions:

> **User:** _Which HTML version was used for Beethovens 5th symphony?_
>
> **Assistant:** The HTML version used for Beethoven's 5th symphony is 1.0.0.
> It was the first version of HTML that was widely used for web pages. It was
> the foundation for the HTML 2.0, 3.0, and 4.0 versions that followed.

Both answers demonstrate that a plausible-sounding response is not evidence of factual
correctness.

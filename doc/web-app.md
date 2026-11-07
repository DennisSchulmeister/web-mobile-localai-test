# Building and Running the Web App

The web application is in `app/`. It uses Svelte, Esbuild, Pico CSS, Bootstrap Icons,
and transformers.js (based on ONNX Runtime).

* [Install dependencies](#install-dependencies)
* [Prepare models and test data](#prepare-models-and-test-data)
* [Run in development](#run-in-development)
* [Build for static hosting](#build-for-static-hosting)
* [Implementation notes](#implementation-notes)

## Install dependencies

From the repository root:

```sh
npm --prefix app ci
```

## Prepare models and test data

To keep the deployment realistic, models are hosted as part of the application rather
than downloaded from the HuggingFace Model Hub at runtime. Initialize the app before
running it:

```sh
npm --prefix app run init
```

This runs the following steps in order:

1. Download models (`npm --prefix app run init:download`).

2. Preprocess the test data (`npm --prefix app run init:preprocess`): extract keywords
   from headings and bold or italic text, and split pages into sentences.

3. Calculate word embeddings (`npm --prefix app run init:embeddings`) for the semantic
   search index.

The generated files are written under `app/static` and are excluded from Git. If test
data changes, rerun preprocessing and embedding generation. If a feature-extraction
model changes, download models again as well.

## Run in development

```sh
npm --prefix app start
```

The development server serves the application at <http://localhost:8888>. The equivalent
watch command is `npm --prefix app run watch`.

## Build for static hosting

```sh
npm --prefix app run build
```

The generated site is in `app/static` and can be copied to a web server.

## Implementation notes

The app uses the high-level transformers.js Pipeline API, which encapsulates common
processing steps for each model type. The `TransformersBackend` can be adapted to use
lower-level `Model` and `Tokenizer` classes instead.

The model catalogue is maintained in [`app/static/models/index.json`](../app/static/models/index.json).
See [AI model and use-case learnings](model-learnings.md) for observations about the
models and the supported tasks.

# Structured Test Plan

> **Stub:** This document captures initial evaluation ideas. The detailed procedure,
> datasets, scoring rubric, and acceptance criteria still need to be specified.

* [Objective](#objective)
* [Initial quality dimensions](#initial-quality-dimensions)
* [To be specified](#to-be-specified)

## Objective

Evaluate the performance and response quality of the local AI models in the web and
Android applications. Keep this plan separate from the exploratory measurements in
[Initial Test Results](initial-test-results.md).

## Initial quality dimensions

Score each item using an ordinal scale with fixed criteria (to be defined):

* Is the generated Markdown syntactically correct?
* Is the answer linguistically correct (spelling, grammar, and punctuation)?
* Is the answer factually correct?
* Does the answer address the intent of the question?
* Is the answer an appropriate length?

Assess both context-free prompts (for example, "What is HTML?") and context-based
prompts (for example, "Please summarize").

## To be specified

* Scoring scale, anchors, and how to aggregate reviewer scores
* Prompt and context dataset, including expected answers or reference facts
* Model versions, quantization, runtime, browser/device, and execution backend
* Warm-up, cold-start, repetition, timeout, and failure-handling procedures
* Performance metrics (including time to first token, throughput, and total duration)
* Quality-review process and criteria for factuality
* Acceptance thresholds and result-reporting format

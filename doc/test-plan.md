# Test Plan

The purpose of the tests is to evaluate the capabilities of the chosen language models
as well as their technical performance on different machines. Both evaluations are
performed using the same test cases. This document describes the test cases, test
procedure and evaluation steps.

1. [Data Collection](#data-collection)
2. [Quality Evaluation](#quality-evaluation)
3. [Performance Evaluation](#performance-evaluation)
4. [Test Cases](#test-cases)

## Data Collection

Tests are recorded using the provided server backend, which is deployed on a public
host with Docker Compose. The backend records test runs which contain events for each
test step. Access is granted via access codes, which are recorded as part of the test
runs. The first step is therefore to log into the administration UI and create access
codes for each tested device.

1. Log into the administration UI
2. Create new access code

Recording can be started by entering the access code during app startup. The collected
test data can be analyzed in the administration backend of the server.

## Quality Evaluation

### Procedure

The response quality of the language models is evaluated using a reference dataset
recorded on the development machine. In theory the machine type, runtime type, OS
and browser should make no difference. Thus, the reference dataset can also be included
in the performance evaluation to avoid recording the same tests twice.

1. Create a new access code for the reference dataset.
2. Using the access code, perform all test cases on the development machine.
3. Manually evaluate the response quality in the administration UI (human judge).
4. Create additional LLM-assisted evaluations in the administration UI (AI judge).

To create a human quality assessment:

1. Open the administration UI and go to "Chat Message Events".
2. Open the chat message exchange to be evaluated.
3. Click on “Quality Assessments” and create a new entry.
4. Fill in all evaluation criteria and save the chat message.

To create an AI-assisted quality assessment:

1. Go back to the "Chat Message Events" list.
2. Select all chat messages.
3. Run action “Run AI Quality Assessments”.

If the AI quality assessments cannot complete within the request/response timeout,
they can be run asynchronously from the command line with `./manage.py run_ai_assessments`.
This command allows you to optionally specify one or more chat message IDs. If no ID is
given, assessments will be created for all chat messages.

In any case, only missing assessments will be created. Existing AI-based quality
assessments will never be changed by any of these steps. To recreate an assessment,
it must therefore be deleted first.

### Assessment Criteria

Assessment is based on five criteria, which are rated on ordinal scales. Points are
awarded for each rating. The reasoning can be recorded as a textual comment for each
criterion:

1. __Correct Syntax:__ Is the markdown and HTML syntax of the response formally correct?

   0. Completely Wrong
   1. Minor Flaws
   2. No Errors Found

2. __Correct Lingua:__ Are language, punctuation and grammar correct?

   0. Completely Wrong
   1. Minor Flaws
   2. No Errors Found

3. __Correct Content:__ Is the answer factually correct, complete and easy to understand?

   0. Completely Wrong
   1. Minor Flaws
   2. No Errors Found

4. __Thematic Relevance:__ To what extent does the answer relate to the original question?

   0. Unrelated Answer
   1. Loosely Related Answer
   2. Answer Beyond Scope
   3. Perfect Fit

5. __Message Length:__ Is the length of the answer appropriate for the question?
   Is the answer short enough to be generated locally on mobile devices, but not too short?

   0. Empty Response
   1. Too Short
   2. Too Long
   3. Perfect Size

## Performance Evaluation

To measure the execution time and generation speed of the models, the test runs are
recorded on different device classes, operating systems, browsers and runtimes.
Roughly speaking, these can be divided into mobile devices and desktop computers
for comparison.

* __Device Types:__ Laptop Computer, Desktop Computer, Smartphone, Tablet
* __Operating Systems:__ Linux, Windows, Android, Sailfish
* __Application Runtimes:__ Capacitor (Android), Firefox, Chrome, Edge, Opera

Where possible, different OS versions and devices with varying performance levels are
tested, with a preference for older laptops and low- to mid-end mobile devices. When
acceleration (e.g. through WebGPU) is available, it is sufficient to run only the tests
with acceleration enabled. As a baseline reference, one test run can be performed
without acceleration on the development machine.

A broad selection of mobile devices can be rented at
[Telekom Mobile Device Cloud](https://mobiledevice.cloud/) for about 100 € per 5 hours.
Dedicated Mac Mini desktop computers can be rented for 10 to 20 EUR per day at
[Scaleway](https://www.scaleway.com).

Useful reporting (which currently is not automated) can cluster the language models,
e.g., by device type and runtime, showing the minimum, maximum and average of each
measurement value recorded with the relevant test events.

## Test Cases

Each test should be run for each available language model and data type. Before
loading a new model, the browser should be closed and reopened to prevent biases
from memory bottlenecks.

Only semantic search and chat-based interactions are tested, as the specialized
language models for summarization, question answering and translation perform
poorly on the test data. Hence, they have not been ported to the Android inference
backend. Default parameters are used unless stated otherwise.

### Semantic Search

Semantic search can be tested with the following questions:

1. Wie funktioniert ein Computer?
2. How does a computer work?
3. Was ist das Internet?
4. What is the Internet?

Notice how switching languages from English to German yields different results.
Sometimes the English question returns German pages, too.

### Context-Free Chat

During the same chat, ask the following questions about web development:

1. What is HTML?
2. What is CSS?
3. What is JavaScript?

Next, start a new chat and ask the following more detailed questions:

1. What are parallel minor chords?
2. Explain the 2-5-1 chord progression using an example.

Notice all the hallucinations and nonsense the models will output here.

And finally, again in a new chat:

1. How are leap years calculated?

### Chat With Page

Using the English "Internet of Things" page, start a new chat and enter the following
prompts:

1. Please summarize.
2. Are IoT devices and embedded devices the same?

On the English "Embedded Systems" page, ask:

1. Translate to German.

### Switching Models

On the context-free chat page, a separate test can be performed to check if switching models
without closing the web page, browser or app degenerates performance, e.g. due to memory leaks.
For this test, which is recorded in a dedicated test run, each model is loaded and the same
question is asked.

* Question: "Was Einstein good at math?"
* Max Tokens: 100

The exact answer doesn't matter. Only the performance measurements are of interest.

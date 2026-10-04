/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, readdir, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {test} from "node:test";
import {fileURLToPath} from "node:url";

const script = fileURLToPath(new URL("./prepare.js", import.meta.url));
const smol = "onnx-community/SmolLM2-135M-Instruct-ONNX";
const qwen = "onnx-community/Qwen3-0.6B-ONNX";
const excluded = "onnx-community/bart-german-ONNX";

async function write(root, file, content) {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), {recursive: true});
    await writeFile(target, content);
}

async function fixture(t, downloadDir = "_generated/models", catalogPath = "models/index.json") {
    const root = await mkdtemp(path.join(os.tmpdir(), "localai-android-"));
    t.after(() => rm(root, {recursive: true, force: true}));
    await write(root, "static/config.json", JSON.stringify({models: {downloadDir, config: catalogPath}}));
    await write(root, `static/${catalogPath}`, JSON.stringify({
        "text-generation": [
            {modelId: smol, android: {include: true}},
            {modelId: qwen, android: {include: true}},
            {modelId: excluded},
            {modelId: "LiquidAI/LFM2.5-1.2B-Instruct-ONNX", android: {include: false}},
        ],
    }));
    await write(root, "static/index.html", "<html>App</html>");
    await write(root, "static/_bundle/index.js", "app");
    await write(root, "static/_generated/embeddings/index.json", "embeddings");
    await write(root, "static/_generated/preprocessed/index.json", "preprocessed");

    for (const model of [smol, qwen, excluded, "LiquidAI/LFM2.5-1.2B-Instruct-ONNX"]) {
        await write(root, `static/${downloadDir}/${model}/config.json`, model);
        await write(root, `static/${downloadDir}/${model}/onnx/model_q4.onnx`, `weights:${model}`);
    }

    return root;
}

function prepare(root) {
    return spawnSync(process.execPath, [script], {cwd: root, encoding: "utf8"});
}

test("bundles only flagged models while preserving web assets and the full catalog", async t => {
    const root = await fixture(t);
    const result = prepare(root);
    assert.equal(result.status, 0, result.stderr);

    const output = path.join(root, ".capacitor/www");
    const models = path.join(output, "_generated/models");
    assert.deepEqual(await readdir(models), ["onnx-community"]);
    assert.deepEqual((await readdir(path.join(models, "onnx-community"))).sort(), [
        "Qwen3-0.6B-ONNX", "SmolLM2-135M-Instruct-ONNX",
    ]);

    for (const file of [
        "config.json", "models/index.json", "index.html", "_bundle/index.js",
        "_generated/embeddings/index.json", "_generated/preprocessed/index.json",
        ...[smol, qwen].flatMap(model => [
            `_generated/models/${model}/config.json`,
            `_generated/models/${model}/onnx/model_q4.onnx`,
        ]),
    ]) {
        assert.deepEqual(await readFile(path.join(output, file)), await readFile(path.join(root, "static", file)));
    }

    assert.equal(await readFile(path.join(root, `static/_generated/models/${excluded}/config.json`), "utf8"), excluded);
});

test("uses the configured model directory and removes stale staged assets on each sync", async t => {
    const root = await fixture(t, "downloads");
    await write(root, `.capacitor/www/downloads/${excluded}/config.json`, "stale model");
    await write(root, ".capacitor/www/obsolete.js", "stale asset");
    assert.equal(prepare(root).status, 0);
    await assert.rejects(readFile(path.join(root, ".capacitor/www/obsolete.js")), {code: "ENOENT"});
    await assert.rejects(readFile(path.join(root, `.capacitor/www/downloads/${excluded}/config.json`)), {code: "ENOENT"});
    assert.equal(await readFile(path.join(root, `.capacitor/www/downloads/${qwen}/config.json`), "utf8"), qwen);
});

test("fails explicitly when a bundled model is missing", async t => {
    const root = await fixture(t);
    await rm(path.join(root, `static/_generated/models/${qwen}`), {recursive: true});
    const result = prepare(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ENOENT/);
    assert.match(result.stderr, /Qwen3-0\.6B-ONNX/);
});

test("reads the configured catalog, follows changed flags, and deduplicates model IDs", async t => {
    const root = await fixture(t, "downloads", "models/custom.json");
    assert.equal(prepare(root).status, 0);
    await write(root, "static/models/custom.json", JSON.stringify({
        summarization: [
            {modelId: excluded, android: {include: true}},
            {modelId: smol, android: {include: false}},
        ],
        "text-generation": [
            {modelId: excluded, android: {include: true}},
            {modelId: qwen, android: {include: "true"}},
        ],
    }));

    const result = prepare(root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.split(`Bundling Android model: ${excluded}`).length - 1, 1);
    assert.deepEqual(await readdir(path.join(root, ".capacitor/www/downloads/onnx-community")), [
        "bart-german-ONNX",
    ]);
});

test("allows a catalog with no models flagged for Android", async t => {
    const root = await fixture(t);
    await write(root, "static/models/index.json", JSON.stringify({
        "text-generation": [{modelId: smol}, {modelId: qwen, android: {include: false}}],
    }));
    const result = prepare(root);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await readdir(path.join(root, ".capacitor/www/_generated/models")), []);
});

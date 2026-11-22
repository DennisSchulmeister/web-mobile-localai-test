/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as transformers from '@huggingface/transformers';

import modelState        from "../../../state/ModelState.svelte";
import StopWatchState    from "../../../state/StopWatchState.svelte.js";
import textPageState     from "../../../state/TextPageState.svelte.js";
import i18n              from "../../../state/i18n.svelte.js";

import testRunAPI        from "../../../api/TestRun.svelte.js";
import {formatDuration}  from "../../../utils/formatter.js";
import {randomId}        from "../../../utils/id.js";
import {decodeEmbedding} from "../../../../shared/embedding.js";

/**
 * Persistent state for semantic search so it is not lost during navigation.
 */
class SemanticSearchPageState {
    working         = $state(false);
    disabled        = $derived(this.working || modelState.loadedModel.status !== "ready")
    embeddingPaths  = $derived(modelState.embeddingsPaths(modelState.loadedModel.modelId, modelState.loadedModel.dtype));
    errorMessage    = $state("");
    stopWatchState  = new StopWatchState();
    
    query           = $state("");
    searchAll       = $state(false);
    matchText       = $state(false);
    
    progressValue   = $state(0);
    progressMax     = $state(0);
    items           = $state([]);

    /**
     * Run semantic search.
     */
    async executeSearch() {
        let rethrow;
        let searchResults = [];

        try {
            if (!this.query) return;
            if (!modelState.loadedModel.status === "ready") return;
            if (!modelState.loadedModel.task === "feature-extraction") return;
    
            this.working = true;
            
            // Download the index files.
            this.stopWatchState.start(i18n.text.homePage?.search?.download, "bi-download");
            
            let indexes = [];
            indexes.push({
                type:  "KEYWORD",
                files: await(await fetch(this.embeddingPaths.keywords)).json(),
            });
    
            if (this.searchAll) {
                indexes.push({
                    type:  "SENTENCE",
                    files: await(await fetch(this.embeddingPaths.sentences)).json(),
                });
            }
    
            // Calculate the embedding for the search term.
            this.stopWatchState.start(i18n.text.homePage?.search?.embedding, "bi-text-center");
    
            let queryLower = this.query.toLowerCase();
            let queryEmbedding = await modelState.loadedModel.backend.runEmbeddingPipeline(this.query);
    
            // Search the index.
            this.stopWatchState.start(i18n.text.homePage?.search?.search, "bi-search");
    
            this.progressMax = 0;
    
            for (let index of indexes) {            
                for (let file in index.files) {
                    this.progressMax += index.files[file].length;
                }
            }
    
            for (let index of indexes) {
                for (let file in index.files) {
                    let existingResult = true;
                    let searchResult   = searchResults.find(e => e.file === file);
    
                    if (!searchResult) {
                        existingResult = false;
                        searchResult   = {file, title: "", fit: 0, texts: []};
                    }
    
                    for (let entry of index.files[file]) {
                        this.progressValue += 1;
                        let fit = 0;
    
                        if (this.matchText && entry.text.toLowerCase().includes(queryLower)) {
                            fit = 1;
                        } else {
                            fit = transformers.dot(queryEmbedding, decodeEmbedding(entry.embedding, modelState.loadedModel.dtype));
                        }
    
                        if (fit < modelState.config.semanticSearch.fitThreshold) continue;
    
                        searchResult.fit = Math.max(searchResult.fit, fit);
                        searchResult.texts.push({text: entry.text, fit, type: index.type});
                    }
    
                    searchResult.texts.sort((a, b) => a.fit - b.fit).reverse();
    
                    if (searchResult.fit > 0 && !existingResult) {
                        let textPage = textPageState.findTextPage(file);
                        searchResult.title = textPage.title || file;
    
                        searchResults.push(searchResult);
                    }
                }
            }
    
            searchResults.sort((a, b) => a.fit - b.fit).reverse();

            this.stopWatchState.stop();
            this.working = false;
    
            // Prepare the results for display.
            this.items = [];
    
            for (let searchResult of searchResults) {
                let item = {
                    type:  "link",
                    id:    randomId(),
                    text:  searchResult.title,
                    extra: `${Math.round(searchResult.fit * 100)}%`,
                    href:  textPageState.getTextPageUrl(searchResult.file),
                    lines: [],
                }
    
                for (let text of searchResult.texts) {
                    item.lines.push({
                        text:  text.text,
                        extra: `${Math.round(text.fit * 100)}%`,
                    });
                }
    
                this.items.push(item);
            }
        } catch (error) {
            this.errorMessage = error.message || error.toString();
            this.working      = false;

            this.stopWatchState.stop();
            rethrow = error;
        }

        // Log semantic search event
        let results      = [];
        let seqnr        = 0;
        let measurements = {download: "", embedding: "", search: ""};

        for (let searchResult of searchResults) {
            for (let text of searchResult.texts) {
                results.push({
                    seqnr: ++seqnr,
                    file:  searchResult.file,
                    title: searchResult.title,
                    text:  text.text,
                    type:  text.type,
                    fit:   Math.round(text.fit * 100),
                });
            }
        }

        for (let measurement of this.stopWatchState.measurements) {
            switch (measurement.name) {
                case i18n.text.homePage?.search?.download:
                    measurements.download = formatDuration(measurement.runtime);
                    break;
                case i18n.text.homePage?.search?.embedding:
                    measurements.embedding = formatDuration(measurement.runtime);
                    break;
                case i18n.text.homePage?.search?.search:
                    measurements.search = formatDuration(measurement.runtime);
                    break;
            }
        }

        // Log semantic search event
        let event = await testRunAPI.saveEvent("semantic_search", {
            status:             rethrow ? "ERROR" : "SUCCESS",
            model:              modelState.loadedModel.event?.id || 0,
            query:              this.query,
            include_keywords:   true,
            include_sentences:  this.searchAll,
            compare_embeddings: true,
            compare_strings:    this.matchText,
            results:            results,
            download:           measurements.download,
            embedding:          measurements.embedding,
            search:             measurements.search,
        });

        if (rethrow) {
            await testRunAPI.saveEventException(event.id, rethrow);
            throw rethrow;
        }
    }
}

export default new SemanticSearchPageState();

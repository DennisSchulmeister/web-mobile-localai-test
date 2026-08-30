/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as transformers from '@huggingface/transformers';

import modelState        from "../../../state/ModelState.svelte";
import StopWatchState    from "../../../state/StopWatchState.svelte.js";
import textPageState     from "../../../state/TextPageState.svelte.js";

import {decodeEmbedding} from "../../../../shared/embedding.js";

/**
 * Gesicherter Zustand für die semantische Suche, damit dieser bei der Navigation
 * nicht verloren geht.
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
     * Semantische Suche ausführen
     */
    async executeSearch() {
        try {
            if (!this.query) return;
            if (!modelState.loadedModel.status === "ready") return;
            if (!modelState.loadedModel.task === "feature-extraction") return;
    
            this.working      = true;
            let searchResults = [];
            
            // Indexdateien herunterladen
            this.stopWatchState.start("Download", "bi-download");
            
            let indexes = [];
            indexes.push(await(await fetch(this.embeddingPaths.keywords)).json());
    
            if (this.searchAll) {
                indexes.push(await(await fetch(this.embeddingPaths.sentences)).json());
            }
    
            // Einbettung des Suchbegriffs berechnen
            this.stopWatchState.start("Embedding", "bi-text-center");
    
            let queryLower = this.query.toLowerCase();
            let queryEmbedding = (await modelState.model(this.query, {pooling: "mean", normalize: true})).data;
    
            // Index durchsuchen
            this.stopWatchState.start("Suche", "bi-serch");
    
            this.progressMax = 0;
    
            for (let index of indexes) {            
                for (let file in index) {
                    this.progressMax += index[file].length;
                }
            }
    
            for (let index of indexes) {
                for (let file in index) {
                    let existingResult = true;
                    let searchResult   = searchResults.find(e => e.file === file);
    
                    if (!searchResult) {
                        existingResult = false;
                        searchResult   = {file, title: "", fit: 0, texts: []};
                    }
    
                    for (let entry of index[file]) {
                        this.progressValue += 1;
                        let fit = 0;
    
                        if (this.matchText && entry.text.toLowerCase().includes(queryLower)) {
                            fit = 1;
                        } else {
                            fit = transformers.dot(queryEmbedding, decodeEmbedding(entry.embedding, modelState.loadedModel.dtype));
                        }
    
                        if (fit < modelState.config.semanticSearch.fitThreshold) continue;
    
                        searchResult.fit = Math.max(searchResult.fit, fit);
                        searchResult.texts.push({text: entry.text, fit});
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
    
            // Aufbereitung für die Anzeige
            this.items = [];
    
            for (let searchResult of searchResults) {
                let item = {
                    type:  "link",
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
            this.errorMessage = error.toString();
            this.working      = false;

            this.stopWatchState.stop();
            throw error;
        }
    }
}

export default new SemanticSearchPageState();
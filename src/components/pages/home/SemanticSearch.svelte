<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
KI-Anwendungsfall: Semantische Suche von Textseiten
-->

<script>
    import * as transformers from '@huggingface/transformers';
    import {onMount}         from "svelte";

    import ModelSelector     from "../../basic/ModelSelector.svelte"
    import Section           from "../../basic/Section.svelte";
    import StopWatch         from "../../basic/StopWatch.svelte";
    import modelState        from "../../../state/Model.svelte";
    import {navigationState} from "../../../state/Navigation.svelte.js";
    import {decodeEmbedding} from "../../../../shared/embedding.js";

    onMount(() => {
        navigationState.pageTitle = "Textseite suchen";
    });

    let loadedModel     = $state({modelId: "", dtype: "", device: ""});
    let loadModel       = $state({modelId: "", dtype: "", device: ""});
    let status          = $state("initial");
    let disabled        = $derived(status !== "ready")
    let errorMessage    = $state("");
    let encoder         = undefined;
    let embeddingPaths  = undefined;

    let query           = $state("");
    let searchAll       = $state(false);
    let searchResults   = $state([]);
    let progressValue   = $state(0);
    let progressMax     = $state(0);

    let showStopWatches = $state(false);
    let stopDownload    = $state("stopped");
    let stopEmbedding   = $state("stopped");
    let stopSearch      = $state("stopped");

    $effect(async () => {
        try {
            if (loadModel.modelId) {
                status = "loading";
    
                encoder = await transformers.pipeline("feature-extraction", loadModel.modelId, {
                    dtype:  loadModel.dtype,
                    device: loadModel.device,
                });
    
                loadedModel    = loadModel;
                embeddingPaths = modelState.embeddingsPaths(loadModel.modelId, loadModel.dtype);
                status         = "ready";

                return;
            }    
        } catch (error) {
            console.error(error);
            status = "error";
            errorMessage = error.toString();
        }

        loadedModel = {modelId: "", dtype: "", device: ""};
    });

    async function onSubmit(event) {
        event.preventDefault();
        if (!query) return;

        status          = "working";
        showStopWatches = true;

        stopDownload    = "rest";
        stopEmbedding   = "rest";
        stopSearch      = "reset";

        let indexes        = [];
        let queryEmbedding = [];
        let searchResults_ = [];

        // Indexdateien herunterladen
        stopDownload = "running";
        indexes      = [await(await fetch(embeddingPaths.keywords)).json()];

        if (searchAll) {
            indexes.push(await(await fetch(embeddingPaths.sentences)).json());
        }

        stopDownload = "stopped";

        // Einbettung des Suchbegriffs berechnen
        stopEmbedding  = "running";
        queryEmbedding = (await encoder(query, {pooling: "mean", normalize: true})).data;
        stopEmbedding  = "stopped";

        // Index durchsuchen
        // TODO: Debuggen
        stopSearch  = "running";
        progressMax = 0;

        for (let index of indexes) {
            for (let pageId in index) {
                progressMax += index[pageId].length;
            }
        }

        for (let index of indexes) {
            for (let pageId in index) {
                let searchResult = {
                    pageId: pageId,
                    maxFit: 0,
                    texts:  [],
                };

                for (let entry of index[pageId]) {
                    progressValue += 1;

                    let fit = transformers.dot(queryEmbedding, decodeEmbedding(entry.embedding, loadedModel.dtype));
                    if (fit < modelState.config.semanticSearch.fitThreshold) continue;

                    searchResult.fit = Math.max(searchResult.fit, fit);
                    searchResult.texts.push({text: entry.text, fit});
                }

                if (searchResult.fit >= modelState.config.semanticSearch.fitThreshold) {
                    searchResults_.push(searchResult);
                }
            }
        }

        searchResults = searchResults_.sort((a, b) => a.fit - b.fit);
        stopSearch    = "stopped";
        status        = "ready";
    }
</script>

<Section>
    <ModelSelector
        task           = "sentenceEmbedding"
        status         = {status}
        errorMessage   = {errorMessage}
        loadedModel    = {loadedModel}
        bind:loadModel = {loadModel}
    />
</Section>

<Section>
    <form role="search" onsubmit={onSubmit}>
        <input type="search" placeholder="Suchbegriff" bind:value={query} {disabled}/>
        <input type="submit" value="Suchen" disabled={disabled || !query}/>
    </form>

    <label>
        <input type="checkbox" role="switch" bind:checked={searchAll} {disabled}/>
        Volltextsuche
  </label>
</Section>

<Section line={false}>
    {#if status === "working"}
        <progress value={progressValue} max={progressMax}></progress>
    {:else}
        <!-- TODO: Schöner darstellen! -->
        <div>
            Anzahl Ergebnisse: {searchResults.length}
        </div>
        
        {#each searchResults as searchResult}
            <div class="searchResult">
                {searchResult.pageId} ({searchResult.fit} %)
            </div>
        {/each}
    {/if}

    {#if showStopWatches}
        <div class="stopWatches">
            <StopWatch icon="bi-download" text="Download:" status={stopDownload}/>
            <StopWatch icon="bi-text-center" text="Einbettung:" status={stopEmbedding}/>
            <StopWatch icon="bi-search" text="Suche:" status={stopSearch}/>
        </div>
    {/if}
</Section>

<style>
    label {
        margin: 0;
    }

    .stopWatches {
        font-size: 75%;

        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--content-padding);
    }
</style>
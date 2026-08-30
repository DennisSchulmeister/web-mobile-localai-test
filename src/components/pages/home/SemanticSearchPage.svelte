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
    import SelectionList     from "../../basic/SelectionList.svelte";
    import StopWatch         from "../../basic/StopWatch.svelte";
    import modelState        from "../../../state/ModelState.svelte";
    import navigationState   from "../../../state/NavigationState.svelte.js";
    import StopWatchState    from "../../../state/StopWatchState.svelte.js";
    import textPageState     from "../../../state/TextPageState.svelte.js";
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
    let matchText       = $state(false);
    let progressValue   = $state(0);
    let progressMax     = $state(0);
    let stopWatchState  = new StopWatchState();
    let items           = $state([]);

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

        status = "working";

        let indexes        = [];
        let queryEmbedding = [];
        let searchResults  = [];

        // Indexdateien herunterladen
        stopWatchState.start("Download", "bi-download");

        indexes.push(await(await fetch(embeddingPaths.keywords)).json());

        if (searchAll) {
            indexes.push(await(await fetch(embeddingPaths.sentences)).json());
        }

        // Einbettung des Suchbegriffs berechnen
        stopWatchState.start("Embedding", "bi-text-center");

        let queryLower = query.toLowerCase();
        queryEmbedding = (await encoder(query, {pooling: "mean", normalize: true})).data;

        // Index durchsuchen
        stopWatchState.start("Suche", "bi-serch");

        progressMax = 0;

        for (let index of indexes) {            
            for (let file in index) {
                progressMax += index[file].length;
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
                    progressValue += 1;
                    let fit = 0;

                    if (matchText && entry.text.toLowerCase().includes(queryLower)) {
                        fit = 1;
                    } else {
                        fit = transformers.dot(queryEmbedding, decodeEmbedding(entry.embedding, loadedModel.dtype));
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
        status = "ready";
        stopWatchState.stop();

        // Aufbereitung für die Anzeige
        items = [];

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

            items.push(item);
        }
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

    <div class="options">
        <label>
            <input type="checkbox" role="switch" bind:checked={searchAll} {disabled}/>
            Volltextsuche
        </label>
    
        <label>
            <input type="checkbox" role="switch" bind:checked={matchText} {disabled}/>
            Direkter Textvergleich
        </label>
    </div>
</Section>

{#if status === "working"}
    <Section line={false}>
        <progress value={progressValue} max={progressMax}></progress>
    </Section>
{:else}
    <div class="margin-bottom">
        <SelectionList {items} />
    </div>
{/if}

<Section line={false}>
    <StopWatch measurements={stopWatchState.measurements}/>
</Section>

<style>
    .options {
        display: flex;
        gap: calc(2 * var(--content-padding));
    }

    label {
        margin: 0;
    }
</style>
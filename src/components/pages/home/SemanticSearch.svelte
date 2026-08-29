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
    import {navigationState} from "../../../state/Navigation.svelte.js";
    import {decodeEmbedding} from "../../../../shared/embedding.js";

    onMount(() => {
        navigationState.pageTitle = "Textseite suchen";
    });

    let loadedModel  = $state({modelId: "", dtype: "", device: ""});
    let loadModel    = $state({modelId: "", dtype: "", device: ""});
    let status       = $state("initial");
    let disabled     = $derived(status !== "ready")
    let errorMessage = $state("");
    let searchAll    = $state(false);
    let encoder      = undefined;

    $effect(async () => {
        try {
            if (loadModel.modelId) {
                status = "loading";
    
                encoder = await transformers.pipeline("feature-extraction", loadModel.modelId, {
                    dtype:  loadModel.dtype,
                    device: loadModel.device,
                });
    
                loadedModel = loadModel;
                status = "ready";
                return;
            }    
        } catch (error) {
            console.error(error);
            status = "error";
            errorMessage = error.toString();
        }

        loadedModel = {modelId: "", dtype: "", device: ""};
    });

    function onSubmit(event) {
        event.preventDefault();
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
        <input type="search" placeholder="Suchbegriff" {disabled}/>
        <input type="submit" value="Suchen" {disabled}/>
    </form>

    <label>
        <input type="checkbox" role="switch" bind:checked={searchAll} {disabled}/>
        Volltextsuche
  </label>
</Section>

<Section line={false}>
    {#if status === "working"}
        <progress value=0 max=100></progress>
    {:else}
        Suchergebnisse
    {/if}
</Section>

<style>
    label {
        margin: 0;
    }
</style>
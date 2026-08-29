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
    import {onMount}         from "svelte";

    import ModelSelector     from "../../basic/ModelSelector.svelte"
    import Section           from "../../basic/Section.svelte";
    import {navigationState} from "../../../state/Navigation.svelte.js";

    onMount(() => {
        navigationState.pageTitle = "Textseite suchen";
    });

    let loadedModel  = $state({modelId: "", dtype: "", device: ""});
    let loadModel    = $state({modelId: "", dtype: "", device: ""});
    let status       = $state("ready");
    let errorMessage = "";
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

<div id="subpage">
</div>

<style>
    #subpage {
        padding: var(--content-padding);
    }
</style>
<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Startseite mit Auswahl und Suche von Textseiten.
-->

<script>
    import {onMount}          from "svelte";
    import ChatPage           from "./common/ChatPage.svelte";
    import ChoosePage         from "./home/ChoosePage.svelte";
    import SemanticSearchPage from "./home/SemanticSearchPage.svelte";

    import modelState         from "../../state/ModelState.svelte.js";
    import navigationState    from "../../state/NavigationState.svelte.js";

    let {params = []} = $props()
    let subPageId = $derived(params[1] || "overview");

    $effect(() => {
        navigationState.currentSubPage = subPageId;
    });

    onMount(() => {
        navigationState.backLink = false;

        navigationState.subPages = [
            {
                id:     "overview",
                icon:   "bi-card-list",
                label:  "Übersicht",
                url:    "#/",
            },
            modelState.config.enabledFeatures.semanticSearch ? {
                id:     "search",
                icon:   "bi-search",
                label:  "Suche",
                url:    "#/search",
            } : null,
            modelState.config.enabledFeatures.chat ? {
                id:     "chat",
                icon:   "bi-chat-dots",
                label:  "Chat",
                url:    "#/chat",
            } : null,
        ].filter(e => e !== null);
    });
</script>

<div id="page">
    {#if subPageId === "overview"}
        <ChoosePage/>
    {:else if subPageId === "search"}
        <SemanticSearchPage/>
    {:else if subPageId === "chat"}
        <ChatPage textPage={false}/>
    {/if}
</div>

<style>
    #page {
        flex: 1;
        overflow: auto;

        display: flex;
        flex-direction: column;
    }
</style>

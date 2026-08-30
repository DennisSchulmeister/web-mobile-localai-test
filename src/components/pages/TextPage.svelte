<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Auswgeählte Textseite
-->

<script>
    import {onMount}         from "svelte";
    
    import QuestionAnsweringPage from "./textpage/QuestionAnsweringPage.svelte";
    import SummaryPage           from "./textpage/SummaryPage.svelte";
    import TextContentPage       from "./textpage/TextContentPage.svelte";
    import TextToSpeachPage      from "./textpage/TextToSpeachPage.svelte";
    import TranslationPage       from "./textpage/TranslationPage.svelte";
    import navigationState       from "../../state/NavigationState.svelte.js";
    import textPageState         from "../../state/TextPageState.svelte.js";

    let {params = []} = $props()
    let textPageId = $derived(params[1]);
    let subPageId  = $derived(params[2]);

    $effect(async () => {
        navigationState.currentSubPage = subPageId;
        await textPageState.setCurrentPage(textPageId)
    });
    
    onMount(() => {
        navigationState.backLink = true;
        
        navigationState.subPages = [
            {
                id:     "content",
                icon:   "bi-text-left",
                label:  "Inhalt",
                url:    `#/page/${textPageId}/content`,
            },
            {
                id:     "summary",
                icon:   "bi-list-ol",
                label:  "Kürzen",
                url:    `#/page/${textPageId}/summary`,
            },
            {
                id:     "qa",
                icon:   "bi-chat",
                label:  "Fragen",
                url:    `#/page/${textPageId}/qa`,
            },
            {
                id:     "translation",
                icon:   "bi-translate",
                label:  "Übersetzen",
                url:    `#/page/${textPageId}/translation`,
            },
            {
                id:     "tts",
                icon:   "bi-speaker",
                label:  "Vorlesen",
                url:    `#/page/${textPageId}/tts`,
            },
        ];
    });
</script>

<div id="page">
    {#if subPageId === "content"}
        <TextContentPage/>
    {:else if subPageId === "summary"}
        <SummaryPage/>
    {:else if subPageId === "qa"}
        <QuestionAnsweringPage/>
    {:else if subPageId === "translation"}
        <TranslationPage/>
    {:else if subPageId === "tts"}
        <TextToSpeachPage/>
    {/if}
</div>

<style>
    #page {
        flex: 1;
        overflow: auto;
    }
</style>
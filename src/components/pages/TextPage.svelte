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
    import QuestionAnswering from "./textpage/QuestionAnswering.svelte";
    import Summary           from "./textpage/Summary.svelte";
    import TextPageContent   from "./textpage/TextPageContent.svelte";
    import TextToSpeach      from "./textpage/TextToSpeach.svelte";
    import Translation       from "./textpage/Translation.svelte";
    import {navigationState} from "../../state/Navigation.svelte.js";
    import textPageState     from "../../state/TextPage.svelte.js";

    let {params = []} = $props()
    let textPageId = $derived(params[1]);
    let subPageId  = $derived(params[2]);

    $effect(async () => {
        navigationState.currentSubPage = subPageId;
        await textPageState.setCurrentPage(textPageId)
    });
    
    onMount(() => {
        navigationState.backLink = "#/";
        
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
        <TextPageContent/>
    {:else if subPageId === "summary"}
        <Summary/>
    {:else if subPageId === "qa"}
        <QuestionAnswering/>
    {:else if subPageId === "translation"}
        <Translation/>
    {:else if subPageId === "tts"}
        <TextToSpeach/>
    {/if}
</div>

<style>
    #page {
        flex: 1;
        overflow: auto;
    }
</style>
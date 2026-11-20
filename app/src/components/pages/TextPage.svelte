<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Selected text page.
-->

<script>
    import ChatPage              from "./common/ChatPage.svelte";
    import QuestionAnsweringPage from "./textpage/QuestionAnsweringPage.svelte";
    import SummaryPage           from "./textpage/SummaryPage.svelte";
    import TextContentPage       from "./textpage/TextContentPage.svelte";
    import TranslationPage       from "./textpage/TranslationPage.svelte";

    import modelState            from "../../state/ModelState.svelte.js";
    import navigationState       from "../../state/NavigationState.svelte.js";
    import textPageState         from "../../state/TextPageState.svelte.js";
    import i18n                  from "../../state/i18n.svelte.js";

    let {params = []} = $props()
    let textPageId = $derived(params[1]);
    let subPageId  = $derived(params[2]);

    $effect(async () => {
        navigationState.currentSubPage = subPageId;
        await textPageState.setCurrentPage(textPageId)
    });
    
    $effect(() => {
        navigationState.header   = true;
        navigationState.backLink = true;
        
        navigationState.subPages = [
            {
                id:     "content",
                icon:   "bi-text-left",
                label:  i18n.text.textPage?.content?.shortName,
                url:    `#/page/${textPageId}/content`,
            },
            modelState.config.enabledFeatures.summary ? {
                id:     "summary",
                icon:   "bi-list-ol",
                label:  i18n.text.textPage?.summary?.shortName,
                url:    `#/page/${textPageId}/summary`,
            } : null,
            modelState.config.enabledFeatures.qa ? {
                id:     "qa",
                icon:   "bi-chat",
                label:  i18n.text.textPage?.qa?.shortName,
                url:    `#/page/${textPageId}/qa`,
            } : null,
            modelState.config.enabledFeatures.translation ? {
                id:     "translation",
                icon:   "bi-translate",
                label:  i18n.text.textPage?.translation?.shortName,
                url:    `#/page/${textPageId}/translation`,
            } : null,
            modelState.config.enabledFeatures.chat ? {
                id:     "chat",
                icon:   "bi-chat-dots",
                label:  i18n.text.chatPage?.shortName,
                url:    `#/page/${textPageId}/chat`,
            } : null,
        ].filter(e => e !== null);
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
    {:else if subPageId === "chat"}
        <ChatPage textPage={true}/>
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

<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Home page for selecting and searching text pages.
-->

<script>
    import ChatPage           from "./common/ChatPage.svelte";
    import ChoosePage         from "./home/ChoosePage.svelte";
    import InformationPage    from "./home/InformationPage.svelte";
    import SemanticSearchPage from "./home/SemanticSearchPage.svelte";

    import modelState         from "../../state/ModelState.svelte.js";
    import navigationState    from "../../state/NavigationState.svelte.js";
    import i18n               from "../../state/i18n.svelte.js";

    let {params = []} = $props()
    let subPageId = $derived(params[1] || "overview");

    $effect(() => {
        navigationState.currentSubPage = subPageId;
        navigationState.header         = true;
        navigationState.backLink       = true;

        navigationState.subPages = [
            {
                id:     "index",
                icon:   "bi-card-list",
                label:  i18n.text.homePage?.index?.shortName,
                url:    "#/index",
            },
            modelState.config.enabledFeatures.semanticSearch ? {
                id:     "search",
                icon:   "bi-search",
                label:  i18n.text.homePage?.search?.shortName,
                url:    "#/search",
            } : null,
            modelState.config.enabledFeatures.chat ? {
                id:     "chat",
                icon:   "bi-chat-dots",
                label:  i18n.text.chatPage?.shortName,
                url:    "#/chat",
            } : null,
            {
                id:     "info",
                icon:   "bi-info-circle",
                label:  i18n.text.homePage?.info?.shortName,
                url:    "#/info",
            },
        ].filter(e => e !== null);
    });
</script>

<div id="page">
    {#if subPageId === "index"}
        <ChoosePage/>
    {:else if subPageId === "search"}
        <SemanticSearchPage/>
    {:else if subPageId === "chat"}
        <ChatPage textPage={false}/>
    {:else if subPageId === "info"}
        <InformationPage/>
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

<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
AI use case: summarization.
-->

<script>
    import MarkdownIt      from 'markdown-it'

    import IconText        from "../../basic/IconText.svelte";
    import Loading         from "../../basic/Loading.svelte";
    import ModelSelector   from "../../basic/ModelSelector.svelte";
    import Section         from "../../basic/Section.svelte";
    import StopWatch       from "../../basic/StopWatch.svelte";

    import navigationState from "../../../state/NavigationState.svelte.js";
    import i18n            from "../../../state/i18n.svelte.js";
    import pageState       from "./SummaryPage.svelte.js";

    let md = new MarkdownIt();
    let htmlAnswer = $derived(md.render(pageState.answer));

    $effect(() => {
        navigationState.pageTitle = i18n.text.textPage?.summary?.pageTitle;
    });

    async function onExecuteClicked() {
        await pageState.execute();
    }
</script>

<Section>
    <ModelSelector task="summarization" disabled={pageState.working}/>
</Section>

<Section>
    <label>
        {i18n.text.textPage?.summary?.length}: {pageState.maxNewTokens} {i18n.text.textPage?.summary?.tokens}
        
        <input
            type       = "range"
            min        = {pageState.minTokens}
            max        = {pageState.maxTokens}
            bind:value = {pageState.maxNewTokens}
            disabled   = {pageState.disabled}
        />
    </label>

    <button onclick={onExecuteClicked} disabled={pageState.disabled}>
        {i18n.text.textPage?.summary?.submit}
    </button>
</Section>

{#if pageState.working}
    <Section line={true}>
        <Loading text={i18n.text.textPage?.summary?.working}/>
    </Section>
{:else if pageState.answer}
    <Section line={true}>
        {@html htmlAnswer}
    </Section>
{/if}

<Section line={false}>
    {#if pageState.errorMessage}
        <IconText type="error" text={pageState.errorMessage}/>
    {/if}

    <StopWatch measurements={pageState.stopWatchState.measurements}/>
</Section>

<style>
    label {
        margin: 0;
    }   
</style>

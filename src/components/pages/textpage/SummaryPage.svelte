<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
KI-Anwendungsfall: Summarization
-->

<script>
    import MarkdownIt      from 'markdown-it'
    import {onMount}       from "svelte";

    import IconText        from "../../basic/IconText.svelte";
    import Loading         from "../../basic/Loading.svelte";
    import ModelSelector   from "../../basic/ModelSelector.svelte";
    import Section         from "../../basic/Section.svelte";
    import StopWatch       from "../../basic/StopWatch.svelte";

    import navigationState from "../../../state/NavigationState.svelte.js";
    import pageState       from "./SummaryPage.svelte.js";

    let md = new MarkdownIt();
    let htmlAnswer = $derived(md.render(pageState.answer));

    onMount(() => {
        navigationState.pageTitle = "Text zusammenfassen";
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
        Länge: {pageState.maxNewTokens} Tokens
        <input
            type       = "range"
            min        = {pageState.minTokens}
            max        = {pageState.maxTokens}
            bind:value = {pageState.maxNewTokens}
            disabled   = {pageState.disabled}
        />
    </label>

    <button onclick={onExecuteClicked} disabled={pageState.disabled}>Start</button>
</Section>

{#if pageState.working}
    <Section line={true}>
        <Loading text="Antwort wird generiert"/>
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

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
    import state           from "./SummaryPage.svelte.js";

    let md = new MarkdownIt();
    let htmlAnswer = $derived(md.render(state.answer));

    onMount(() => {
        navigationState.pageTitle = "Text zusammenfassen";
    });

    async function onExecuteClicked() {
        await state.execute();
    }
</script>

<Section>
    <ModelSelector task="summarization" disabled={state.working}/>
</Section>

<Section>
    <label>
        Länge: {state.maxNewTokens} Tokens
        <input
            type       = "range"
            min        = {state.minTokens}
            max        = {state.maxTokens}
            bind:value = {state.maxNewTokens}
            disabled   = {state.disabled}
        />
    </label>

    <button onclick={onExecuteClicked} disabled={state.disabled}>Start</button>
</Section>

{#if state.working}
    <Section line={true}>
        <Loading text="Antwort wird generiert"/>
    </Section>
{:else if state.answer}
    <Section line={true}>
        {@html htmlAnswer}
    </Section>
{/if}

<Section line={false}>
    {#if state.errorMessage}
        <IconText type="error" text={state.errorMessage}/>
    {/if}

    <StopWatch measurements={state.stopWatchState.measurements}/>
</Section>

<style>
    label {
        margin: 0;
    }   
</style>
<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
KI-Anwendungsfall: Translation
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
    import state           from "./TranslationPage.svelte.js";

    let md = new MarkdownIt();
    let htmlResult = $derived(md.render(state.result));

    onMount(() => {
        navigationState.pageTitle = "Text übersetzen";
    });

    async function onExecuteClicked() {
        await state.execute();
    }
</script>

<Section>
    <ModelSelector task="translation" disabled={state.working}/>
</Section>

<Section>
    Optionen
    <!--
    <form role="search" onsubmit={onSubmit}>
        <input type="search" placeholder="Suchbegriff" bind:value={state.query} disabled={state.disabled}/>
        <input type="submit" value="Suchen" disabled={state.disabled || !state.query}/>
    </form>

    <div class="options">
        <label>
            <input type="checkbox" role="switch" bind:checked={state.searchAll} disabled={state.disabled}/>
            Volltextsuche
        </label>
    
        <label>
            <input type="checkbox" role="switch" bind:checked={state.matchText} disabled={state.disabled}/>
            Direkter Textvergleich
        </label>
    </div>
    -->
</Section>

{#if state.working}
    <Section line={true}>
        <Loading text="Antwort wird generiert"/>
    </Section>
{:else if state.result}
    <Section line={true}>
        {@html htmlResult}
    </Section>
{/if}

<Section line={false}>
    {#if state.errorMessage}
        <IconText type="error" text={state.errorMessage}/>
    {/if}

    <StopWatch measurements={state.stopWatchState.measurements}/>
</Section>

<style>
    /* label {
        margin: 0;
    }    */
</style>
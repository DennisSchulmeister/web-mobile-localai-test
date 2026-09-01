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
    import modelState      from "../../../state/ModelState.svelte.js";
    import state           from "./TranslationPage.svelte.js";

    let md = new MarkdownIt();
    let htmlResult = $derived(md.render(state.result));

    onMount(() => {
        navigationState.pageTitle = "Text übersetzen";
    });

    async function onSubmit(event) {
        event.preventDefault();
        await state.execute();
    }
</script>

<Section>
    <ModelSelector task="translation" disabled={state.working}/>
</Section>

<Section>
    <form onsubmit={onSubmit} class="grid">
        <label>
            Von
            <select value={state.src_language} disabled>
                {#each Object.keys(modelState.config.translation.languages) as language}
                    <option value={language}>{modelState.config.translation.languages[language]}</option>
                {/each}
            </select>
        </label>
        <label>
            Nach
            <select bind:value={state.dst_language} disabled={state.disabled}>
                {#each modelState.loadedModel?.config?.languages as language}
                    <option value={language}>{modelState.config.translation.languages[language]}</option>
                {/each}
            </select>
        </label>
        <input type="submit" value="Start" disabled={state.disabled || !state.dst_language}/>
    </form>
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
    label {
        margin-bottom: 0;
    }

    .grid {
        align-items: end;
    }
</style>
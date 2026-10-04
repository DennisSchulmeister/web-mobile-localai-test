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
    import pageState       from "./TranslationPage.svelte.js";

    let md = new MarkdownIt();
    let htmlResult = $derived(md.render(pageState.result));

    onMount(() => {
        navigationState.pageTitle = "Text übersetzen";
    });

    async function onSubmit(event) {
        event.preventDefault();
        await pageState.execute();
    }
</script>

<Section>
    <ModelSelector task="translation" disabled={pageState.working}/>
</Section>

<Section>
    <form onsubmit={onSubmit} class="grid">
        <label>
            Von
            <select value={pageState.sourceLanguage} disabled>
                {#each Object.keys(modelState.config.translation.languages) as language}
                    <option value={language}>{modelState.config.translation.languages[language]}</option>
                {/each}
            </select>
        </label>
        <label>
            Nach
            <select bind:value={pageState.targetLanguage} disabled={pageState.disabled}>
                {#each modelState.loadedModel?.config?.languages as language}
                    <option value={language}>{modelState.config.translation.languages[language]}</option>
                {/each}
            </select>
        </label>
        <input type="submit" value="Start" disabled={pageState.disabled || !pageState.targetLanguage}/>
    </form>
</Section>

{#if pageState.working}
    <Section line={true}>
        <Loading text="Antwort wird generiert"/>
    </Section>
{:else if pageState.result}
    <Section line={true}>
        {@html htmlResult}
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
        margin-bottom: 0;
    }

    .grid {
        align-items: end;
    }
</style>

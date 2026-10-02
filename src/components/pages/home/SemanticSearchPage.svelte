<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
KI-Anwendungsfall: Semantische Suche von Textseiten
-->

<script>
    import {onMount}         from "svelte";
    
    import IconText          from "../../basic/IconText.svelte";
    import ModelSelector     from "../../basic/ModelSelector.svelte"
    import Section           from "../../basic/Section.svelte";
    import SelectionList     from "../../basic/SelectionList.svelte";
    import StopWatch         from "../../basic/StopWatch.svelte";
    
    import navigationState   from "../../../state/NavigationState.svelte.js";
    import pageState         from "./SemanticSearchPage.svelte.js";
    
    onMount(() => {
        navigationState.pageTitle = "Textseite suchen";
    });

    async function onSubmit(event) {
        event.preventDefault();
        return pageState.executeSearch();
    }
</script>

<Section>
    <ModelSelector task="feature-extraction" disabled={pageState.working}/>
</Section>

<Section>
    <form role="search" onsubmit={onSubmit}>
        <input type="search" placeholder="Suchbegriff" bind:value={pageState.query} disabled={pageState.disabled}/>
        <input type="submit" value="Suchen" disabled={pageState.disabled || !pageState.query}/>
    </form>

    <div class="options">
        <label>
            <input type="checkbox" role="switch" bind:checked={pageState.searchAll} disabled={pageState.disabled}/>
            Volltextsuche
        </label>
    
        <label>
            <input type="checkbox" role="switch" bind:checked={pageState.matchText} disabled={pageState.disabled}/>
            Direkter Textvergleich
        </label>
    </div>
</Section>

{#if pageState.working}
    <Section line={false}>
        <progress value={pageState.progressValue} max={pageState.progressMax}></progress>
    </Section>
{:else}
    <div class="margin-bottom">
        <SelectionList items={pageState.items} />
    </div>
{/if}

<Section line={false}>
    {#if pageState.errorMessage}
        <IconText type="error" text={pageState.errorMessage}/>
    {/if}

    <StopWatch measurements={pageState.stopWatchState.measurements}/>
</Section>

<style>
    .options {
        display: flex;
        gap: calc(2 * var(--content-padding));
    }

    label {
        margin: 0;
    }
</style>

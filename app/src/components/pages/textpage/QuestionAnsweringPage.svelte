<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
AI use case: question answering.
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
    import pageState       from "./QuestionAnsweringPage.svelte.js";

    let md = new MarkdownIt();
    let htmlAnswer = $derived(md.render(pageState.answer));

    $effect(() => {
        navigationState.pageTitle = i18n.text.textPage?.qa?.pageTitle;
    });

    async function onExecuteClicked(event) {
        event.preventDefault();
        await pageState.execute();
    }
</script>

<Section>
    <ModelSelector task="question-answering" disabled={pageState.working}/>
</Section>

<Section>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <form onsubmit={onExecuteClicked}>
        <fieldset role="group">
            <input
                placeholder = {i18n.text.textPage?.qa?.placeholder}
                bind:value  = {pageState.question}
                disabled    = {pageState.disabled}
            />
            <input
                type     = "submit"
                value    = {i18n.text.textPage?.qa?.submit}
                disabled = {pageState.disabled}
            />
        </fieldset>
    </form>
</Section>

{#if pageState.working}
    <Section line={true}>
        <Loading text={i18n.text.textPage?.qa?.working}/>
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

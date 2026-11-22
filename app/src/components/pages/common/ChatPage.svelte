<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
AI use case: open-ended LLM chat.
-->

<script>
    import MarkdownIt        from 'markdown-it'
    
    import IconText          from "../../basic/IconText.svelte";
    import ModelSelector     from "../../basic/ModelSelector.svelte"
    import Section           from "../../basic/Section.svelte";
    import StopWatch         from "../../basic/StopWatch.svelte";
    
    import navigationState   from "../../../state/NavigationState.svelte.js";
    import i18n              from "../../../state/i18n.svelte.js";
    import pageState         from "./ChatPage.svelte.js";

    let {textPage = false} = $props();

    let messagesPane = $state();
    let buttonText   = $derived(pageState.working ? "⏹️" : "✨");
    let md           = new MarkdownIt();

    $effect(() => {
        navigationState.pageTitle = textPage ? i18n.text.chatPage?.titleTextPage : i18n.text.chatPage?.titleHome;
        pageState.textPage        = textPage;
    });

    async function onSubmit(event) {
        event.preventDefault();
        return pageState.working ? pageState.stop() : pageState.execute();
    }

    async function onReset(event) {
        event.preventDefault();
        return pageState.reset();
    }

    /**
     * Always scroll to the bottom when messages are added or updated.
     */
    $effect(() => {
        // Read each message individually so the effect also runs when the
        // message text changes during streaming.
        pageState.messages.forEach(message => {
            message.content;
        });

        const scroller = messagesPane?.firstElementChild;

        if (scroller) {
            scroller.scrollTop = scroller.scrollHeight;
        }
    });
</script>

<div
    bind:this = {messagesPane}
    class     = "messages {pageState.messages.length || pageState.working ? "" : "empty"}"
>
    <Section>
        {#if !pageState.messages.length && !pageState.working}
            <div class="placeholder">
                🤖  {i18n.text.chatPage?.placeholder1}
            </div>
            <div class="warning">
                <p>
                    <b>{i18n.text.chatPage?.placeholder2}</b>
                    {i18n.text.chatPage?.placeholder3}
                </p>
            </div>
        {/if}

        {#each pageState.messages as message (message.id)}
            <div class="message {message.role}">
                {#if message.role === "user"}
                    <div class="role">
                        🧑 {i18n.text.chatPage?.roleUser}
                    </div>
                {:else if message.role === "assistant"}
                    <div class="role">
                        🤖 {i18n.text.chatPage?.roleAssistant}
                    </div>
                {/if}

                <div class="content">
                    {@html md.render(message.content)}
                </div>

                <div class="stats">
                    {#if message.stats}
                        <StopWatch measurements={message.stats.values}/>
                    {/if}
    
                    {#if message.stopWatch}
                        <StopWatch measurements={message.stopWatch.measurements}/>
                    {/if}
                </div>
            </div>
        {/each}

        {#if pageState.error.message || pageState.messages.length}
            <div class="status">
                {#if pageState.error.message}
                    <IconText type="error" text={pageState.error.message}/>
                {/if}
        
                <div>
                    {#if !pageState.working}
                        <a href="#reset" onclick={onReset}>{i18n.text.chatPage?.reset}</a>
                    {/if}
                </div>
            </div>
        {/if}
    </Section>
</div>

<Section line={false}>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <form onsubmit={onSubmit}>
        <fieldset role="group">
            <input placeholder={i18n.text.chatPage?.message} bind:value={pageState.question} disabled={pageState.disabled}/>
            <input type="submit" value={buttonText} disabled={pageState.working ? false : pageState.disabled}/>
        </fieldset>
    </form>

    <details>
        <summary>
            {i18n.text.chatPage?.options}
        </summary>
        <article class="options">
            <label>
                {i18n.text.chatPage?.maxTokens}
                <input type="number" bind:value={pageState.maxNewTokens} disabled={pageState.disabled}/>
            </label>
            <label>
                {i18n.text.chatPage?.temperature}
                <input type="number" step="0.1" bind:value={pageState.temperature} disabled={pageState.disabled}/>
            </label>
            <label>
                {i18n.text.chatPage?.repetitionPenalty}
                <input type="number" step="0.1" bind:value={pageState.repetitionPenalty} disabled={pageState.disabled}/>
            </label>
            <label>
                {i18n.text.chatPage?.sampling}
                <input type="checkbox" role="switch" bind:checked={pageState.doSample} disabled={pageState.disabled}/>
            </label>
        </article>
    </details>

    <ModelSelector task={pageState.TASKS} disabled={pageState.working}/>
</Section>

<style>
    .messages {
        flex: 1;
        overflow: hidden;
    }
    
    :global(.messages > *) {
        display: flex;
        flex-direction: column;
        height: 100%;

        padding: 0 !important;
        height: 100%;
        overflow: auto;
    }

    :global(.messages.empty > *) {
        align-items: center;
        justify-content: center;
        gap: 1em;
    }

    label {
        margin: 0;
    }

    .placeholder {
        background-color: var(--color5);
        border: 1px solid color-mix(in srgb, var(--color5) 100%, black 5%);
        border-radius: 0.5em;
        padding: 1em;
    }

    .warning {
        font-size: 80%;
        padding: 1em;

        p {
            color: darkgrey !important;
        }
    }

    .message {
        padding: 1em;

        &.assistant {
            background: var(--color5);
        }

        .role {
            font-weight: bold;
            color: var(--color3);
        }

        /* :global(.content p:last-child) {
            margin-bottom: 0;
        } */

        .stats {
            margin-top: 1em;
            display: flex;
            justify-content: space-between;
        }
    }

    .status {
        padding: 1em;
        background: var(--color5);
    }

    .options {
        display: flex;
        gap: calc(2 * var(--content-padding));
    }
</style>

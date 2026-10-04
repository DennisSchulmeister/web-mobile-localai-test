<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
KI-Anwendungsfall: Freier LLM-Chat
-->

<script>
    import MarkdownIt        from 'markdown-it'
    import {onMount}         from "svelte";
    
    import IconText          from "../../basic/IconText.svelte";
    import ModelSelector     from "../../basic/ModelSelector.svelte"
    import Section           from "../../basic/Section.svelte";
    import StopWatch         from "../../basic/StopWatch.svelte";
    
    import navigationState   from "../../../state/NavigationState.svelte.js";
    import pageState         from "./ChatPage.svelte.js";

    let {textPage = false} = $props();

    let messagesPane = $state();
    let buttonText   = $derived(pageState.working ? "⏹️" : "✨");
    let md           = new MarkdownIt();

    onMount(() => {
        navigationState.pageTitle = textPage ? "Chat zur Seite" : "Freier Chat";
        pageState.textPage        = textPage;
    });

    async function onSubmit(event) {
        event.preventDefault();
        return pageState.working ? pageState.stop() : pageState.execute();
    }

    async function onReset(event) {
        event.preventDefault();
        pageState.reset();
    }

    /**
     * Bei neuen oder aktualisierten Nachrichten immer nach unten scrollen.
     */
    $effect(() => {
        // Jede Nachricht einzeln lesen, damit der Effekt auch bei Änderungen am
        // Nachrichtentext (beim Streaming) läuft.
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
                🤖 Frage mich irgendwas (auf Englisch).
            </div>
            <div class="warning">
                <p>
                    <b>Beachte:</b>
                    Ich beantworte zwar deine Fragen, merke mir aber den Inhalt unseres
                    Gesprächs nicht. Das heißt, jede Frage muss ohne Bezug zu den vorherigen
                    Nachrichten beantwortbar sein. Außerdem kann ich schnell Fehler machen.
                    Prüfe daher alle meine Antworten. Manchmal erzähle ich auch Unsinn.
                    In diesem Fall stelle dieselbe Frage einfach nochmal. 🙃
                </p>
            </div>
        {/if}

        {#each pageState.messages as message (message.id)}
            <div class="message {message.role}">
                {#if message.role === "user"}
                    <div class="role">
                        🧑 Benutzer
                    </div>
                {:else if message.role === "assistant"}
                    <div class="role">
                        🤖 Assistent
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

        {#if pageState.errorMessage || pageState.messages.length}
            <div class="status">
                {#if pageState.errorMessage}
                    <IconText type="error" text={pageState.errorMessage}/>
                {/if}
        
                <div>
                    {#if !pageState.working}
                        <a href="#reset" onclick={onReset}>Neuer Chat</a>
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
            <input placeholder="Nachricht" bind:value={pageState.question} disabled={pageState.disabled}/>
            <input type="submit" value={buttonText} disabled={pageState.working ? false : pageState.disabled}/>
        </fieldset>
    </form>

    <details>
        <summary>
            Optionen
        </summary>
        <article class="options">
            <label>
                Max Tokens
                <input type="number" bind:value={pageState.maxNewTokens} disabled={pageState.disabled}/>
            </label>
            <label>
                Temperatur
                <input type="number" step="0.1" bind:value={pageState.temperature} disabled={pageState.disabled}/>
            </label>
            <label>
                Keine Wdh.
                <input type="number" step="0.1" bind:value={pageState.repetitionPenalty} disabled={pageState.disabled}/>
            </label>
            <label>
                Sampling
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

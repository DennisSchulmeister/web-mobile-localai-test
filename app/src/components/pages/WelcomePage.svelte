<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Welcome page to choose the language and enter the access code for
recording test events.
-->

<script>
    import {onMount}       from "svelte";
    import navigationState from "../../state/NavigationState.svelte.js";
    import i18n            from "../../state/i18n.svelte.js";

    onMount(() => {
        navigationState.pageTitle      = "";
        navigationState.header         = false;
        navigationState.backLink       = false;
        navigationState.currentSubPage = "";
        navigationState.subPages       = [];
    });

    let accessCode = $state("");

    async function onSubmit(event) {
        event.preventDefault();
        // TODO: Connect to backend
        location.href = "#/overview"
    }
</script>

<div id="page">
    <h1>{i18n.text.welcomePage?.title}</h1>

    <form onsubmit={onSubmit}>
        <div class="padding">
            <label>
                {i18n.text.welcomePage?.language}
                <select bind:value={i18n.language}>
                    {#each Object.keys(i18n.languages) as language}
                        <option value={language}>{i18n.languages[language]}</option>
                    {/each}
                </select>
            </label>
    
            <label>
                {i18n.text.welcomePage?.accessCode}
                <input bind:value={accessCode} style="margin-bottom: 0;"/>
                <span class="hint">{i18n.text?.welcomePage?.hint}</span>
            </label>
        </div>

        <input type="submit" value={i18n.text.welcomePage?.start}/>
    </form>
</div>

<style>
    #page {
        flex: 1;

        display: flex;
        flex-direction: column;
        justify-content: space-between;

        /* https://pixabay.com/illustrations/cubes-choice-one-yellow-light-2492010/ */
        background-image: url(welcome.jpg);
        background-size: cover;
        background-position: center;
        background-attachment: fixed;

        padding: var(--content-padding);
    }

    h1 {
        color: var(--color4);
        font-size: 250%;
        text-align: center;
        margin-top: 4em;
    }

    form {
        background: white;
        margin-bottom: 4em;

        .padding {
            padding: 1em;
        }

        input[type="submit"] {
            border-radius: 0;
            margin: 0;
        }

        .hint {
            font-size: 80%;
            color: darkgrey;
        }
    }
</style>

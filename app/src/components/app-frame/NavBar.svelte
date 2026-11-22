<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Top navigation bar
-->

<script>
    import testRunAPI      from "../../api/TestRun.svelte.js";
    import navigationState from "../../state/NavigationState.svelte.js"

    function onBackClicked(event) {
        event.preventDefault();
        history.back();
    }
</script>

<div id="navbar">
    <div class="nav">
        {#if navigationState.backLink}
            <a href="#back" title="Zurück" onclick={onBackClicked}>
                <i class="bi bi-arrow-left-square"></i>
            </a>
        {/if}
    
        <h1>
            {navigationState.pageTitle}
        </h1>
    </div>

    {#if testRunAPI.accessCode}
        <label>
            <input type="checkbox" role="switch" bind:checked={testRunAPI.recording}/>
            <span class="recording bi-record-fill" class:active={testRunAPI.recording} class:inactive={!testRunAPI.recording}></span>
            {testRunAPI.accessCode}
        </label>
    {/if}
</div>

<style>
    #navbar {
        background: var(--color1);
        color: var(--color4);
        box-shadow: 0px 0px 4px rgba(0,0,0, 0.15);
        z-index: 1;

        padding: var(--content-padding);

        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 2em;

        font-size: 120%;
    }

    .nav {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1em;
    }

    h1 {
        font-size: 110%;
        font-weight: normal;
        color: var(--color4);
        margin: 0;
    }

    a, a:visited, a:hover {
        color: var(--color4);
        text-decoration: none;
    }

    label {
        color: var(--color4);
    }

    @keyframes blink {
        0% {
            color: darkred;
        }
        100% {
            color: red;
        }
    }

    .recording {
        transition: color 2s;

        &.inactive {
            color: rgba(255,255,255, 0.25);
        }

        &.active {
            animation: blink 1.5s alternate infinite;
        }
    }
</style>

<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
Lizenziert unter CC0
-->

<!--
@component
Obere Navigationsleiste
-->

<script>
    import {navBarState} from "../../state/NavBar.svelte"
</script>

<div id="navbar">
    {#if navBarState.backLink}
        <a href={navBarState.backLink} title="Zurück">
            <i class="bi bi-arrow-left-square"></i>
        </a>
    {/if}

    <h1>
        {navBarState.pageTitle}
    </h1>
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
        align-items: center;
        gap: 1em;

        font-size: 120%;
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
</style>
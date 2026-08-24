<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
Lizenziert unter CC0
-->

<!--
@component
Wurzelkomponente der App, die das HTML-Grundgerüst definiert und das
SPA-Routing ermöglicht.
-->

<script>
    import Router from "svelte-spa-router";

    import NavBar from "./NavBar.svelte";
    import routes from "../routes.js";
</script>

<div id="app-container">
    <header>
        <NavBar />
    </header>
    <main>
        <Router {routes} />
    </main>
</div>

<style>
    :global(html) {
        height: 100%;
        margin: 0;
        background-image: radial-gradient( circle 975px at 2.6% 48.3%,  rgba(0,8,120,1) 0%, rgba(95,184,224,1) 99.7%);

        --color1: #0089ba;
        --color2: #845ec2;
        --color3: #008f7a;
        --color4: white;
        --color5: #f6f6f6;
        --content-padding: 1rem;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        height: 100vh;

        display: flex;
        flex-direction: column;
        align-items: center;
    }

    :global(h1),
    :global(h2) {
        color: var(--color2);
        text-shadow: 1px 1px 0px rgba(0,0,0, 0.25);
    }

    @media (min-width: 44em) {
        :global(body) {
            padding: 2em;
        }

        #app-container {
            border-radius: 0.5em;
        }
    }

    #app-container {
        flex: 1;
        min-height: 0;
        width: 40em;
        max-width: 100%;

        background: white;
        box-shadow: 2px 2px 8px rgba(0,0,0, 0.15);
        overflow: auto;

        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    main {
        flex: 1;

        display: flex;
        flex-direction: column;
        justify-content: start;
        align-items: stretch;

        overflow: auto;
    }
</style>
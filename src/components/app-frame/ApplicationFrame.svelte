<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Wurzelkomponente der App, die das HTML-Grundgerüst definiert und das
SPA-Routing ermöglicht.
-->

<script>
    import {onMount}  from "svelte";
    import Router     from "svelte-spa-router";

    import Footer     from "./Footer.svelte";
    import NavBar     from "./NavBar.svelte";
    import routes     from "../routes.js";
    import ModelState from "../../state/Model.svelte.js";

    onMount(async () => {
        await ModelState.reloadModelConfiguration();
    });
</script>

<div id="app-container">
    <header>
        <NavBar />
    </header>
    <main>
        <Router {routes} />
    </main>
    <footer>
        <Footer/>
    </footer>
</div>

<style>
    :global(html) {
        height: 100%;
        margin: 0;
        background-image: linear-gradient(to right top, #6bb2d1, #6bb1d7, #6eafdc, #73ade0, #7aabe4, #77aae4, #73a9e4, #70a8e4, #5ea8e1, #4aa8dd, #34a8d7, #13a7d1);

        --color1: #0089ba;
        --color2: #845ec2;
        --color3: #d65db1;
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
        text-shadow: 1px 1px 0px rgba(0,0,0, 0.25);
    }
    
    :global(h1) {
        color: var(--color2);
        font-size: 130%;
    }

    :global(h2) {
        color: var(--color3);
        font-size: 110%;
    }

    :global(p) {
        text-align: justify;
        hyphens: auto;
        word-wrap: break-word;
    }

    @media (min-width: 38em) {
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
        width: 34em;
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
<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Fehlerseite für ungültige URLs
-->

<script>
    import {onMount}       from "svelte";
    import navigationState from "../../state/NavigationState.svelte.js";

    onMount(() => {
        navigationState.pageTitle      = "Nicht gefunden";
        navigationState.backLink       = true;
        navigationState.currentSubPage = "";
        navigationState.subPages       = [];
    });
</script>

<div id="page">
    <h2>Seite nicht gefunden</h2>
    <p>
        Die gewünschte Seite wurde nichte gefunden.
    </p>
    <p>
        <a href="#/">Zurück zur Startseite</a>
    </p>
</div>

<style>
    #page {
        padding: var(--content-padding);
    }
</style>
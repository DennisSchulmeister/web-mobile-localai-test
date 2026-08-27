<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Einfaches Auswahlmenü für die anzuzeigende Textseite.
-->

<script>
    import {onMount}         from "svelte";
    import {navigationState} from "../../../state/Navigation.svelte.js";

    onMount(() => {
        navigationState.pageTitle = "Textseite auswählen";
    });
</script>

<h1>Textseite auswählen</h1>

<style>
</style>
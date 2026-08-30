<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
KI-Anwendungsfall: Text to Speach
-->

<script>
    import {onMount}       from "svelte";

    import navigationState from "../../../state/NavigationState.svelte.js";
    import state           from "./TextToSpeechPage.svelte.js";

    onMount(() => {
        navigationState.pageTitle = "Text vorlesen";
    });
</script>

<h1>KI-Sprachausgabe</h1>

<style>
</style>
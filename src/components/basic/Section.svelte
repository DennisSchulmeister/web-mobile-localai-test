<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Abschnitt mit Trennlinie unten
-->

<script>
    let {line = true, children} = $props();
</script>

<div class="section {line ? 'line' : ''}">
    {@render children()}
</div>

<style>
    .section {
        padding: var(--content-padding);
        
        &.line {
            border: 0px solid color-mix(in srgb, var(--color5) 100%, black 5%);
            border-bottom-width: 1.5px;
        }
    }
</style>
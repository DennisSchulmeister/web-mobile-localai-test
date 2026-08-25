<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Container für die Fußzeile einer Seite
-->

<script>
    let {children} = $props();
</script>

<footer>
    {@render children()}
</footer>

<style>
    footer {
        background: var(--color5);
        color: color-mix(in srgb, var(--color5) 100%, black 95%);
        border: 0px solid color-mix(in srgb, var(--color5) 100%, black 5%);
        border-top-width: 0.5px;

        padding: var(--content-padding);
    }
</style>
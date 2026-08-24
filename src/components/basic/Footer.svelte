<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
Lizenziert unter CC0
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
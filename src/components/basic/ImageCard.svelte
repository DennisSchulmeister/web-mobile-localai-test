<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
Lizenziert unter CC0
-->

<!--
@component
Karte mit Bild und HTML-Inhalt
-->

<script>
    let {img, alt = "", href = "", children} = $props();

    function onclick() {
        if (href) location.href = href;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article onclick={onclick}>
    <header>
        <img src={img} alt={alt}>
    </header>

    {@render children()}
</article>

<style>
    article {
        cursor: pointer;
        width: 100%;
        max-width: 15em;
        transition: transform 0.5s, box-shadow 0.5s;
    }

    article:hover {
        transform: scale(103%);
        box-shadow: 4px 4px 8px rgba(0,0,0, 0.15);
    }

    header {
        padding: 0;
        overflow: hidden;
    }

    img {
        display: block;
        width: 100%;
    }
</style>
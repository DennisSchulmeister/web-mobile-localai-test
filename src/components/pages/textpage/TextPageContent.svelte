<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Inhalt einer Textseite
-->

<script>
    import MarkdownIt        from 'markdown-it'
    import {onMount}         from "svelte";
    import {navigationState} from "../../../state/Navigation.svelte.js";
    import {textPages}       from "../../../state/TextPage.svelte.js";

    onMount(() => {
        navigationState.pageTitle = "Text anzeigen";
    });

    let md = new MarkdownIt();
    let htmlContent = $derived(md.render(textPages.currentPageContent));
</script>

<div class="textpage">
    {@html htmlContent}
</div>

<style>
    .textpage {
        padding: var(--content-padding);
    }
</style>
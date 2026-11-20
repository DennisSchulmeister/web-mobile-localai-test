<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Error page for invalid URLs
-->

<script>
    import navigationState from "../../state/NavigationState.svelte.js";
    import i18n            from "../../state/i18n.svelte.js";

    $effect(() => {
        navigationState.pageTitle      = i18n.text.notFoundPage?.pageTitle;
        navigationState.header         = true;
        navigationState.backLink       = true;
        navigationState.currentSubPage = "";
        navigationState.subPages       = [];
    });
</script>

<div id="page">
    <h2>{i18n.text.notFoundPage?.title}</h2>
    <p>
        {i18n.text.notFoundPage?.message}
    </p>
    <p>
        <a href="#/index">{i18n.text.notFoundPage?.backLink}</a>
    </p>
</div>

<style>
    #page {
        padding: var(--content-padding);
    }
</style>

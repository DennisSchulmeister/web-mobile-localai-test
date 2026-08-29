<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Icon mit Text
-->

<script>
    let {
        icon      = "",
        text      = "",
        iconColor = "",
        textColor = "",
    } = $props();
</script>

<span class="iconText">
    <span style:color={iconColor} class="bi {icon}"></span>
    <span style:color={textColor}>{text}</span>
</span>

<style>
    .iconText {
        display: inline-flex;
        align-items: top;
        gap: 0.25em;
    }
</style>

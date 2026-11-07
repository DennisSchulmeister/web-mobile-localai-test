<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Spinner for displaying a background process.
-->

<script>
    let {text} = $props();
</script>

<span aria-busy="true">{text}</span>

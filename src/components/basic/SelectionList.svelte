<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Eine einfache Auswahlliste im Android-Style
-->

<script>
    let {items = []} = $props();
</script>

<div class="selectionList">
    {#each items as item}
        <div class="listItem {item.type}">
            {#if item.type === "link"}
                <a href={item.href} aria-label={item.text}></a>
            {/if}

            {item.text}
        </div>
    {/each}
</div>

<style>
    .selectionList {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .listItem {
        position: relative;

        padding: var(--content-padding);
        border: 0px solid color-mix(in srgb, var(--color5) 100%, black 5%);
        border-bottom-width: 0.5px;

        &.section {
            margin-top: var(--content-padding);
            color: var(--color2);
            font-weight: bold;
        }

        &.section:first-child {
            margin-top: 0;
        }

        &.link {
            transition: background-color 0.5s;

            &:hover {
                background-color: rgba(0,0,0, 0.05);
            }
        }

        a {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    }
</style>
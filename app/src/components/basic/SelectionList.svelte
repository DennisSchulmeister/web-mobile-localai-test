<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Simple Android-style selection list. Items are objects with the following attributes:

 - `type`:  List item type: "section" or "link"
 - `text`:  Main text of the list item
 - `extra`: Secondary text of the list item (optional)
 - `href`:  Link target (only for type "link")
 - `lines`: Nested rows, each with `text` and `extra`
-->

<script>
    let {items = []} = $props();
</script>

<div class="selectionList">
    {#each items as item (item.id)}
        <div class="listItem {item.type}">
            {#if item.type === "link"}
                <a href={item.href} aria-label={item.text}></a>
            {/if}

            <div class="line">
                <div class="text">{item.text}</div>
    
                {#if item.extra}
                    <div class="extra">{item.extra}</div>
                {/if}
            </div>

            {#each item.lines as line}
                <div class="line small">
                    <div class="text">{line.text}</div>
        
                    {#if line.extra}
                        <div class="extra">{line.extra}</div>
                    {/if}
                </div>
            {/each}
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

        display: flex;
        flex-direction: column;
        gap: 0.25em;

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

        .line {
            display: flex;
            gap: var(--content-padding);
        }

        .text {
            flex: 1;
        }

        .small {
            font-size: 80%;
            color: darkgrey;
        }
    }
</style>

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
    import {navigationState} from "../../state/Navigation.svelte.js";
</script>

<footer>
    {#each navigationState.subPages as subPage}
        <div class="footerItem {navigationState.currentSubPage === subPage.id ? 'active' : ''}">
            <a href="{subPage.url}" aria-label="{subPage.label}"></a>
            <div class="icon {subPage.icon}"></div>
            <div class="label">{subPage.label}</div>
        </div>
    {/each}
</footer>

<style>
    footer {
        background: var(--color5);
        color: color-mix(in srgb, var(--color5) 100%, black 95%);
        border: 0px solid color-mix(in srgb, var(--color5) 100%, black 5%);
        border-top-width: 0.5px;

        display: flex;
        justify-content: center;
        align-items: center;
        /* gap: var(--content-padding); */

        font-size: 90%;
    }
    
    .footerItem {
        position: relative;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.25em;

        text-align: center;

        width: 5em;
        padding: calc(var(--content-padding) / 2);
        overflow: hidden;

        .label {
            font-size: 80%;
        }

        a {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }

        transition: background-color 0.5s;

        &.active {
            background-color: rgba(0,0,0, 0.05);
        }

        &:hover {
         background-color: rgba(0,0,0, 0.1);   
        }
    }
</style>
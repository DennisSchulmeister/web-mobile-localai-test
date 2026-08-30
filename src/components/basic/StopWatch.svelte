<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
UI-Komponente zur Darstellung eines `StopWatchState`.
-->

<script>
    let {measurements = []} = $props();
</script>

<div class="measurements">
    {#each measurements as measurment}
        <div class="measurement">
            <span class="bi {measurment.icon || ''}"></span>
            
            {#if measurment.name}
                <span>{measurment.name}:</span>
            {/if}

            <span class="value">{measurment.formatted}</span>
        </div>
    {/each}
</div>

<style>
    .measurements {
        font-size: 75%;

        display: flex;
        justify-content: start;
        align-items: center;
        gap: var(--content-padding);

        .measurement {
            display: inline-flex;
            align-items: top;
            gap: 0.25em;
    
            color: grey;
    
            .value {
                min-width: 3em;
                color: lightgrey;
            }
        }
    }
</style>

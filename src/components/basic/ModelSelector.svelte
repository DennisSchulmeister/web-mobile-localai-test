<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Auswahl eines KI-Modells
-->

<script>
    import IconText   from "../basic/IconText.svelte";
    import Loading    from "../basic/Loading.svelte";
    import modelState from "../../state/ModelState.svelte.js";

    let {
        task = "",               // Erster Parameter für `transformers.pipeline()` als String oder String Array
        disabled = false,        // Keine Auswahl zulassen, z.B. weil das geladene Modell gerade genutzt wird
    } = $props();

    let available_tasks = $derived(Array.isArray(task) ? task : [task]);

    let available_models = $derived.by(() => {
        let result = [];

        for (let available_task of available_tasks) {
            for (let model of modelState.models[available_task] || []) {
                result.push({...model, task: available_task});
            }
        }

        return result;
    });

    // TODO: Devices filtern, so dass nur Backends berücksichtigt werden, die
    // die Task-Typen ausführen können. Das Backend muss zusätzlich die Chance
    // bekommen, für jedes einzelne Modell zu entscheiden, ob es ausführbar ist.
    // Wegen `"android": {"natrive": true}` im Modellkatalog. Braucht aber eine
    // kleine API-Änderung in den Backends.

    let selected_modelId    = $derived(available_models[0]?.modelId || "");
    let selected_index      = $derived(available_models.findIndex(e => e.modelId === selected_modelId));
    let selected_task       = $derived(available_models[selected_index]?.task || "");
    let selected_dtypes     = $derived(available_models[selected_index]?.dtypes || []);
    let selected_dtype      = $derived(available_models[selected_index]?.dtypes?.[0] || "");
    let selected_device     = $state(modelState.devices[0]?.device);
    let loaded_device_text  = $derived(modelState.devices.find(e => e.device === modelState.loadedModel.device)?.label || modelState.loadedModel.device);
    let loaded_device_color = $derived(modelState.loadedModel.device.includes("wasm") ? "darkred" : "darkgreen");

    async function onLoadClicked() {
        await modelState.loadModel({
            task:    selected_task,
            modelId: selected_modelId,
            dtype:   selected_dtype,
            device:  selected_device,
        });
    }
</script>

<details>
    <summary>Sprachmodell auswählen</summary>

    <!-- Infos zum geladenen Modell -->
    <article>
        <header>
            Aktuell verwendet
        </header>

        {#if modelState.loadedModel.status === "loading"}
            <Loading text="Modell wird geladen"/>
        {:else if modelState.loadedModel.status === "error"}
            <IconText type="error" text={modelState.loadedModel.message}/>
        {:else if !modelState.loadedModel.modelId || !available_tasks.includes(modelState.loadedModel.task)}
            <IconText text="Es wurde noch kein Modell geladen." textColor="darkgrey"/>
        {:else}
            <div class="loadedModel">
                <div class="modelId">
                    <IconText icon="bi-stars" text={modelState.loadedModel.modelId}/>
                </div>
                <div class="param">
                    <IconText icon="bi-calculator" text={modelState.loadedModel.dtype}/>
                </div>
                <div class="param">
                    <IconText icon="bi-cpu" text={loaded_device_text} textColor={loaded_device_color}/>
                </div>
            </div>
        {/if}
    </article>

    <!-- Modell laden -->
    <article>
        <header>
            Modell laden
        </header>
        <fieldset>
            <label>
                <span>Sprachmodell</span>
                <select bind:value={selected_modelId} {disabled}>
                    {#each available_models as model}
                        <option value="{model.modelId}">
                            {model.modelId}
                        </option>
                    {/each}
                </select>
            </label>

            <div class="grid">
                <label>
                    <span>Datentyp</span>
                    <select bind:value={selected_dtype} {disabled}>
                        {#each selected_dtypes as dtype}
                            <option value={dtype}>{dtype}</option>
                        {/each}
                    </select>
                </label>

                <label>
                    <span>Ausführumgebung</span>
                    <select bind:value={selected_device} {disabled}>
                        {#each modelState.devices as device}
                            <option value={device.device}>{device.label}</option>
                        {/each}
                    </select>
                </label>
            </div>
        </fieldset>

        <button onclick={onLoadClicked} disabled={disabled || !selected_modelId}>Laden</button>
    </article>
</details>

<style>
    details, fieldset {
        margin-bottom: 0;
    }

    .loadedModel {
        display: flex;
        gap: var(--content-padding);
        font-size: 90%;

        .modelId {
            flex: 1;
        }
    }
</style>

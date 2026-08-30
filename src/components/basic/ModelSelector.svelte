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
        task = "",               // Erster Parameter für `transformers.pipeline()`
        disabled = false,        // Keine Auswahl zulassen, z.B. weil das geladene Modell gerade genutzt wird
    } = $props();

    let text_device = {
        "":       "WASM",
        "webgpu": "WebGPU",
        "webnn":  "WebNN"
    };

    let selected_modelId    = $derived(modelState.models[task]?.[0]?.modelId || "");
    let selected_index      = $derived(modelState.models[task]?.findIndex(e => e.modelId === selected_modelId));
    let selected_dtypes     = $derived(modelState.models[task]?.[selected_index]?.dtypes || []);
    let selected_dtype      = $derived(modelState.models[task]?.[selected_index]?.dtypes?.[0] || "");
    let selected_device     = $state(navigator.ml ? "webnn" : navigator.gpu ? "webgpu" : "");
    let loaded_device_text  = $derived(text_device[modelState.loadedModel.device])
    let loaded_device_color = $derived(modelState.loadedModel.device === "" ? "darkred" : "darkgreen");

    async function onLoadClicked() {
        await modelState.loadModel({
            task:    task,
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
        {:else if !modelState.loadedModel.modelId || modelState.loadedModel.task !== task}
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
                    {#each modelState.models[task] as model}
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
                        <option value="">{text_device[""]}</option>

                        {#if navigator.gpu}
                            <option value="webgpu">{text_device["webgpu"]}</option>
                        {/if}
                        {#if navigator.ml}
                            <option value="webnn">{text_device["webnn"]}</option>
                        {/if}
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

    label {
        font-size: 85%;
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
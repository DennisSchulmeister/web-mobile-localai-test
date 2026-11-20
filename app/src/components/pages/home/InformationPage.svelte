<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Backend information.
-->

<script>
    import navigationState from "../../../state/NavigationState.svelte.js";
    import i18n            from "../../../state/i18n.svelte.js";
    import backends        from "../../../backends/index.js";
    import IconText        from "../../basic/IconText.svelte";

    $effect(() => {
        navigationState.pageTitle = i18n.text.homePage?.info?.pageTitle;
    });
</script>

<div id="subpage">
    {#each backends as backend}
        <h1>{backend.name}</h1>

        <table class="striped">
            <tbody>

            {#await backend.getInformation()}
                <tr>
                    <td colspan="2">
                        i18n.text.homePage?.info?.loading}
                    </td>
                </tr>
            {:then information}
                {#each information as info}
                    <tr>
                        <th scope="row">
                            <span class="bi {info.icon || ''}"></span>
                            {info.label}
                        </th>
                        <td>
                            {info.text}
                        </td>
                    </tr>
                {/each}
            {:catch error}
                <tr class="error">
                    <td colspan="2">
                        <IconText type="error" text={error.message}/>
                    </td>
                </tr>
            {/await}

            </tbody>
        </table>
    {/each}
</div>

<style>
    #subpage {
        padding: var(--content-padding);
    }

    table {
        font-size: 80%;
    }

    .error {
        color: var(--color1);
    }
</style>

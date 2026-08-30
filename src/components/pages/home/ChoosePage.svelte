<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Einfaches Auswahlmenü für die anzuzeigende Textseite.
-->

<script>
    import {onMount}       from "svelte";
    import SelectionList   from "../../basic/SelectionList.svelte"
    import navigationState from "../../../state/NavigationState.svelte.js";
    import textPageState   from "../../../state/TextPageState.svelte.js";

    onMount(async () => {
        navigationState.pageTitle = "Textseite auswählen";
    });

    let items = $derived.by(() => {
        if (!textPageState.categories) {
            return [{
                type: "section",
                text: "Liste wird geladen ...",
                href: "",
            }];
        }

        let newItems = [];

        for (let category of textPageState.categories || []) {
            newItems.push({
                type: "section",
                text: category.category || "",
                href: "",
            });

            for (let page of category.pages || []) {
                newItems.push({
                    type: "link",
                    text: page.title || page.file || "",
                    href: textPageState.getTextPageUrl(page.file),
                });
            }
        }

        return newItems;
    });
</script>

<SelectionList {items}/>
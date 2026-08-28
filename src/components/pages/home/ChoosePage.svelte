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
    import {onMount}         from "svelte";
    import SelectionList     from "../../basic/SelectionList.svelte"
    import {navigationState} from "../../../state/Navigation.svelte.js";
    import {loadCategories}  from "../../../state/TextPage.svelte.js";
    import {textPages}       from "../../../state/TextPage.svelte.js";

    onMount(async () => {
        navigationState.pageTitle = "Textseite auswählen";
        await loadCategories();
    });

    let items = $derived.by(() => {
        if (!textPages.categories) {
            return [{
                type: "section",
                text: "Liste wird geladen ...",
                href: "",
            }];
        }

        let newItems = [];

        for (let category of textPages.categories || []) {
            newItems.push({
                type: "section",
                text: category.category || "",
                href: "",
            });

            for (let page of category.pages || []) {
                newItems.push({
                    type: "link",
                    text: page.title || page.file || "",
                    href: `#/page/${page.file}/content`,
                });
            }
        }

        return newItems;
    });
</script>

<SelectionList {items}/>
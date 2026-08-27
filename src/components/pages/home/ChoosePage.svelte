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

    let items = [{
        type: "section",
        text: "Liste wird geladen ...",
        href: "",
    }];

    onMount(async () => {
        navigationState.pageTitle = "Textseite auswählen";

        let categories = await (await fetch("data/index.json")).json();
        items = [];
        
        for (let category of categories || []) {
            items.push({
                type: "section",
                text: category.category || "",
                href: "",
            });

            for (let page of category.pages || []) {
                items.push({
                    type: "link",
                    text: page.title || page.file || "",
                    href: `#/page/${page.file}/content`,
                });
            }
        }

        console.log(items);
    });

    // $effect(async () => {
    // });
</script>

<SelectionList {items}/>
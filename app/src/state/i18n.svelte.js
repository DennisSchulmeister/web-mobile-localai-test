/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getLocalStorageItem } from "../utils/local-storage.js";
import { setLocalStorageItem } from "../utils/local-storage.js";

/**
 * Language and translated texts.
 */
class I18N {
    /**
     * Available languages
     */
    languages = {
        de: "Deutsch",
        en: "English",
    };
    
    /**
     * Current language
     */
    language = $state(getLocalStorageItem("language", "en"));
    
    /**
     * Shadow copy of the text catalogue to prevent flickering when the
     * language is changed.
     */
    #text = $state({});

    /**
     * Text catalogue
     */
    text = $derived.by(() => {
        let result = this.#text;
        setLocalStorageItem("language", this.language);

        import(`./i18n/${this.language}.js`).then(module => {
            for (let key of Object.keys(module.default)) {
                result[key] = module.default[key];
            }
        });

        return result;
    });
};

export default new I18N();

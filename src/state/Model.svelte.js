/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Konfigurierte KI-Modelle.
 */
class ModelState {
    models = $state({});

    /**
     * Datei `models/index.json` mit den konfigurierten KI-Modellen einlesen.
     */
    async reloadModelConfiguration() {
        try {
            this.models = await (await fetch("models/index.json")).json();
        } catch (error) {
            console.error(error);
        }
    }
}

export default new ModelState();
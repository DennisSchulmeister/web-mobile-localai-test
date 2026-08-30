/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Inhalte der Navigationsleiste und des Page Footers. Wird in der Datei
 * `router.js` beim Wechsel der Seite mit neuen Werten aktualisiert.
 */
const navigationState = $state({
    /**
     * Zurück-Pfeil in der Navigationsleiste anzeigen
     */
    backLink: false,

    /**
     * Überschrift der Seite.
     */
    pageTitle: "",

    /**
     * Auswählbare Unterseiten im Page Footer. Jeder Eintrag ist ein Objekt mit
     * den Attributen `id`, `icon`, `label`, `url`, `active`.
     */
    subPages: [],

    /**
     * ID der aktiven Unterseite (oder leer, wenn es keine Unterseiten gibt).
     */
    currentSubPage: "",
});

export default navigationState;
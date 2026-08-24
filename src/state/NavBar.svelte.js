/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 * Lizenziert unter CC0
 */

/**
 * Sichtbarer Inhalt in der Navigationsleiste. Wird in der Datei `router.js`
 * beim Wechsel der Seite mit neuen Werten aktualisiert.
 */
export const navBarState = $state({
    /**
     * Link-URL für den Zurück-Pfeil. Wenn leer, wird der Pfeil ausgeblendet.
     */
    backLink: "",

    /**
     * Überschrift der Seite.
     */
    pageTitle: "",
});
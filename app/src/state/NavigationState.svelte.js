/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Contents of the navigation bar and page footer. Updated with new values in
 * `router.js` when the page changes.
 */
const navigationState = $state({
    /**
     * Show the back arrow in the navigation bar.
     */
    backLink: false,

    /**
     * Page heading.
     */
    pageTitle: "",

    /**
     * Selectable subpages in the page footer. Each entry is an object with
     * the attributes `id`, `icon`, `label`, `url`, and `active`.
     */
    subPages: [],

    /**
     * ID of the active subpage (or empty if there are no subpages).
     */
    currentSubPage: "",
});

export default navigationState;
/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import i18n from "../state/i18n.svelte.js";

/**
 * Communication with the Django server API to record test events.
 */
class TestRunAPI {
    /**
     * Access code used for recording test events. Can be bound to a UI widget
     * to display the currently used access code, but should not be changes by
     * the widget.
     */
    accessCode = $state("");

    /**
     * Recording enabled/disabled. No data will be sent to the server, when this
     * flag is set to `false`. To this end, the flag can be directly bound to a
     * UI widget. However, the widget should not be shown when the access code
     * is empty, as this flag will have to effect then.
     */
    recording = $state(false);

    /**
     * Read-only flag to determine if event recording is enabled. For this to be
     * true, a valid access code must have been set and the recording flag must
     * be set to `true`.
     */
    get enabled() {
        return this.accessCode && this.recording;
    }

    /**
     * URL prefix for the backend API.
     */
    #apiUrl = "";

    /**
     * ID of the current test run.
     */
    #testRunId = 0;

    /**
     * Internal wrapper around the raw `fetch()`API. Makes sure that common options
     * and HTTP headers, e.g. for the access code, are set. The access code is taken
     * from `this.accessCode` but can be overridden with the `accessCode` parameter.
     * 
     * @param {string} method Request method
     * @param {string} url URL suffix, e.g. "testlogs/test_runs"
     * @param {any} body Request body data (optional, will be JSON serialized)
     * @param {boolean} keepAlive Finish request before unloading the page
     * @param {string} accessCode Access code (optional)
     * @returns Response from the raw `fetch()` call
     */
    async #fetch(method, url, body, keepAlive, accessCode) {
        let options = {
            keepAlive: keepAlive,
            method:    method.toUpperCase(),
            headers:   {},
        };

        if (body) {
            options.body = JSON.stringify(body);
            options.headers["content-type"] = "application/json";
            options.headers["accept"] = "application/json";
        }

        if (accessCode || this.accessCode) {
            options.headers["Authorization"] = `access-code ${accessCode || this.accessCode}`;
        }

        return fetch(`${this.#apiUrl}/api/${url}`, options);
    }

    /**
     * Test server connection and validity of the access code. This must be
     * called before all other methods. The access code will be remembered
     * internally to authenticate all subsequent webservice calls.
     * 
     * @param {string} accessCode Access Code
     * @throws On connection error or invalid access code
     */
    async connect(accessCode) {
        // Check access code exists and is valid (actually checked by the server)
        this.#apiUrl = await (await fetch("api.url")).text();
        let response = await this.#fetch("GET", "auth/access_codes", null, false, accessCode);

        if (response.status !== 200) {
            throw new Error(i18n.text.api?.testRun?.invalidAccessCode);
        }

        await response.json();
        
        // Confirm connection
        this.accessCode = accessCode;
        this.recording  = true;
    }

    /**
     * Reset connection.
     */
    disconnect() {
        this.accessCode = "";
        this.recording  = false;
    }

    /**
     * Get the last saved start test run event for the current access code. This
     * can be used to pre-fill the device information for the next test run.
     * 
     * @returns Last test run or `null`
     */
    async getPreviousTestRun() {
        return await (await this.#fetch("GET", "testlogs/test_runs/last")).json();
    }

    /**
     * Start a new test run for which the following events will be recorded.
     * The access code will be automatically inserted into the test run data.
     * 
     * @param {object} data Test run data
     * @returns Saved test run
     */
    async startTestRun(data) {
        if (!data) data = {};
        data.access_code = this.accessCode;

        let response = await this.#fetch("POST", "testlogs/test_runs/", data);

        if (response.status < 200 || response.status > 299) {
            throw new Error(`${i18n.text.api?.testRun?.saveFailed}`.replaceAll("$STATUS$", response.status.toString()));
        }

        let savedTestRun = await response.json();
        this.#testRunId = savedTestRun.id;
        return savedTestRun;
    }

    /**
     * Save a new event. Has no effect if either `this.accessCode` is empty or
     * `this.recording` is `false`. `startTestRun()` must have been called before,
     * so that the test run ID is known.
     * 
     * The `keepAlive` parameter is meant for the "stop_test_run" event, which with this
     * parameter can be automatically sent when the app is closed using the "visibilitychange"
     * DOM event:
     * 
     * ```js
     * document.addEventListener("visibilitychange", () => {
     *     if (document.visibilityState !== "hidden") return;
     *     // Send event
     * });
     * ```
     * 
     * @param {string} event Event name in snake-case ("start_test_run", "stop_test_run", …)
     * @param {object} data Event data
     * @param {boolean} keepAlive Finish request before unloading the page
     * @returns {object} Saved event data
     */
    async saveEvent(event, data, keepAlive) {
        if (!this.enabled) return;

        if (!data) data = {};
        data.testrun = this.#testRunId;

        let response = await this.#fetch("POST", `testlogs/${event}_events/`, data, keepAlive);

        if (response.status < 200 || response.status > 299) {
            throw new Error(`${i18n.text.api?.testRun?.saveFailed}`.replaceAll("$STATUS$", response.status.toString()));
        }

        return await response.json();
    }

    /**
     * Attach a catched exception to a previously saved event. Like `saveEvent()` has
     * no effect, when no access code is given or recording is disabled.
     * 
     * @param {number} eventId Event ID
     * @param {Error} error Catch error object
     * @returns Saved exception data
     */
    async saveEventException(eventId, error) {
        if (!this.enabled) return;

        let response = await this.#fetch("POST", "testlogs/event_exceptions/", {
            event:   eventId,
            name:    error.name,
            message: error.message,
            stack:   error.stack,
        });

        if (response.status < 200 || response.status > 299) {
            throw new Error(`${i18n.text.api?.testRun?.saveFailed}`.replaceAll("$STATUS$", response.status.toString()));
        }

        return await response.json();
    }
}

export default new TestRunAPI();

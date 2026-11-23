<!--
Web/Mobile Test for Local AI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Welcome page to choose the language and enter the access code for
recording test events.
-->

<script>
    import IconText        from "../basic/IconText.svelte";

    import {onMount}       from "svelte";
    import testRunAPI      from "../../api/TestRun.svelte.js";
    import backends        from "../../backends/index.js";
    import navigationState from "../../state/NavigationState.svelte.js";
    import i18n            from "../../state/i18n.svelte.js";

    onMount(async () => {
        navigationState.pageTitle      = "";
        navigationState.header         = false;
        navigationState.backLink       = false;
        navigationState.currentSubPage = "";
        navigationState.subPages       = [];

        await testRunAPI.saveEvent("stop_test_run", {status: "SUCCESS"});
    });

    const STEP_VERIFY_ACCESS_CODE = 1;
    const STEP_CREATE_TEST_RUN    = 2;
    const START_APPLICATION_URL   = "#/index";

    let currentStep     = $state(STEP_VERIFY_ACCESS_CODE);
    let accessCode      = $state("");
    let saveBackendInfo = $state(true);
    let errorMessage    = $state("");

    let testRunData = $state({
        app_type:        "",
        device_type:     "",
        device_model:    "",
        device_cpu:      "",
        device_year:     0,
        os_family:       "",
        os_version:      "",
        browser_family:  "",
        browser_version: "",
        remarks:         "",
    });

    async function verifyAccessCode(event) {
        event.preventDefault();
        errorMessage = "";

        if (!accessCode.trim()) {
            testRunAPI.disconnect();
            location.href = START_APPLICATION_URL;
            return;
        }
        
        try {
            await testRunAPI.connect(accessCode);
            let previousTestRun = await testRunAPI.getPreviousTestRun();

            if (previousTestRun) {
                testRunData.app_type        = previousTestRun.app_type        || "";
                testRunData.device_type     = previousTestRun.device_type     || "";
                testRunData.device_model    = previousTestRun.device_model    || "";
                testRunData.device_cpu      = previousTestRun.device_cpu      || "";
                testRunData.device_year     = previousTestRun.device_year     || 0;
                testRunData.os_family       = previousTestRun.os_family       || "";
                testRunData.os_version      = previousTestRun.os_version      || "";
                testRunData.browser_family  = previousTestRun.browser_family  || "";
                testRunData.browser_version = previousTestRun.browser_version || "";
                testRunData.remarks         = previousTestRun.remarks         || "";
            }

            currentStep = STEP_CREATE_TEST_RUN;
        } catch (error) {
            console.error(error);
            errorMessage = error.message || error.toString();
        }
    }

    async function createTestRun(event) {
        event.preventDefault();
        errorMessage = "";

        if (!testRunData.app_type.trim() || !testRunData.device_type.trim() || !testRunData.device_model.trim()) {
            errorMessage = i18n.text.welcomePage?.obligatoryFieldsMissing;
            return;
        }
        
        try {
            await testRunAPI.startTestRun(testRunData);

            if (saveBackendInfo) {
                for (let backend of backends) {
                    let lines  = [];
                    let seqnr  = 0;
                    let error1 = null;

                    try {
                        for (let line of await backend.getInformation()) {
                            lines.push({
                                seqnr: ++seqnr,
                                field: line.field,
                                icon:  line.icon,
                                label: line.label,
                                value: line.text,
                            });
                        }
                    } catch (error) {
                        console.error(error);
                        errorMessage = error.message || error.toString();
                        error1 = error;
                    }

                    let event = await testRunAPI.saveEvent("get_information", {
                        status:      error1 ? "ERROR" : "SUCCESS",
                        engine_id:   backend.id,
                        engine_name: backend.name,
                        lines:       lines,
                    });

                    if (error1) await testRunAPI.saveEventException(event.id, error1);
                }
            }
        } catch (error) {
            console.error(error);
            errorMessage = error.message || error.toString();
            return;
        }

        location.href = START_APPLICATION_URL;
    }

    function cancel() {
        errorMessage = "";

        testRunData.app_type        = "";
        testRunData.device_type     = "";
        testRunData.device_model    = "";
        testRunData.device_cpu      = "";
        testRunData.device_year     = 0;
        testRunData.os_family       = "";
        testRunData.os_version      = "";
        testRunData.browser_family  = "";
        testRunData.browser_version = "";
        testRunData.remarks         = "";

        currentStep = STEP_VERIFY_ACCESS_CODE;
    }
</script>

<div id="page">
    <h1>{i18n.text.welcomePage?.title}</h1>

    {#if currentStep === STEP_VERIFY_ACCESS_CODE}
        <form class="mb4" onsubmit={verifyAccessCode}>
            <div class="padding">
                <label>
                    {i18n.text.welcomePage?.language}
                    <select bind:value={i18n.language}>
                        {#each Object.keys(i18n.languages) as key}
                            <option value={key}>{i18n.languages[key]}</option>
                        {/each}
                    </select>
                </label>
        
                <label>
                    {i18n.text.welcomePage?.accessCode}
                    <input bind:value={accessCode}/>
                    <small>{i18n.text?.welcomePage?.hint}</small>
                </label>

                {#if errorMessage}
                    <IconText type="error" text={errorMessage}/>
                {/if}
            </div>

            {#if !accessCode.trim()}
                <input type="submit" value={i18n.text.welcomePage?.startApplication}/>
            {:else}
                <input type="submit" value={i18n.text.welcomePage?.verifyAccessCode}/>
            {/if}
        </form>
    {:else if currentStep === STEP_CREATE_TEST_RUN}
        <form onsubmit={createTestRun}>
            <div class="padding">
                <div class="grid">
                    <label class="obligatory">
                        {i18n.text.welcomePage?.appType}
                        <select bind:value={testRunData.app_type} aria-invalid={!testRunData.app_type.trim() || null}>
                            {#each Object.keys(i18n.text.welcomePage?.appTypes) as key}
                                <option value={key}>{i18n.text.welcomePage.appTypes[key]}</option>
                            {/each}
                        </select>
                    </label>
                    <label class="obligatory">
                        {i18n.text.welcomePage?.deviceType}
                        <select bind:value={testRunData.device_type} aria-invalid={!testRunData.device_type.trim() || null}>
                            {#each Object.keys(i18n.text.welcomePage?.deviceTypes) as key}
                                <option value={key}>{i18n.text.welcomePage.deviceTypes[key]}</option>
                            {/each}
                        </select>
                    </label>
                </div>
                <div class="grid">
                    <label class="obligatory">
                        {i18n.text.welcomePage?.deviceModel}
                        <input bind:value={testRunData.device_model} aria-invalid={!testRunData.device_model.trim() || null}/>
                    </label>
                    <label>
                        {i18n.text.welcomePage?.deviceYear}
                        <input bind:value={testRunData.device_year}/>
                    </label>
                </div>
                <div class="grid">
                    <label>
                        {i18n.text.welcomePage?.deviceCPU}
                        <input bind:value={testRunData.device_cpu}/>
                    </label>
                </div>
                <div class="grid">
                    <label>
                        {i18n.text.welcomePage?.osFamily}
                        <select bind:value={testRunData.os_family}>
                            {#each Object.keys(i18n.text.welcomePage?.operatingSystemFamilies) as key}
                                <option value={key}>{i18n.text.welcomePage.operatingSystemFamilies[key]}</option>
                            {/each}
                        </select>
                    </label>
                    <label>
                        {i18n.text.welcomePage?.osVersion}
                        <input bind:value={testRunData.os_version}/>
                    </label>
                </div>
                <div class="grid">
                    <label>
                        {i18n.text.welcomePage?.browserFamily}
                        <select bind:value={testRunData.browser_family}>
                            {#each Object.keys(i18n.text.welcomePage?.browserFamilies) as key}
                                <option value={key}>{i18n.text.welcomePage.browserFamilies[key]}</option>
                            {/each}
                        </select>
                    </label>
                    <label>
                        {i18n.text.welcomePage?.browserVersion}
                        <input bind:value={testRunData.browser_version}/>
                    </label>
                </div>
                <div class="grid">
                    <label>
                        {i18n.text.welcomePage?.remarks}
                        <input bind:value={testRunData.remarks}/>
                    </label>
                </div>
                <div class="grid">
                    <label>
                        <input type="checkbox" role="switch" bind:checked={saveBackendInfo}/>
                        {i18n.text.welcomePage?.saveBackendInfo}
                    </label>
                </div>
                
                {#if errorMessage}
                    <IconText type="error" text={errorMessage}/>
                {/if}
            </div>

            <div role="group">
                <input type="submit" value={i18n.text.welcomePage?.startTestRun}/>
                <button class="secondary" onclick={cancel}>{i18n.text.welcomePage?.cancel}</button>
            </div>
        </form>
    {/if}
</div>

<style>
    #page {
        flex: 1;

        display: flex;
        flex-direction: column;
        justify-content: space-between;

        /* https://pixabay.com/illustrations/cubes-choice-one-yellow-light-2492010/ */
        background-image: url(welcome.jpg);
        background-size: cover;
        background-position: center;
        background-attachment: fixed;

        padding: var(--content-padding);
    }

    h1 {
        color: var(--color4);
        font-size: 250%;
        text-align: center;
        margin-top: 4em;
    }

    .mb4 {
        margin-bottom: 4em;
    }

    form {
        background: white;

        .padding {
            padding: 1em;
        }

        input[type="submit"], button {
            border-radius: 0;
            margin: 0;
        }

        [role="group"] {
            margin: 0;
        }

        .obligatory {
            font-weight: bold;
        }
    }
</style>

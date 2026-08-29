<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Icon mit Text
-->

<script>
    let {
        icon   = "",
        text   = "",
        status = "stopped",      // stopped, running, reset
    } = $props();

    let time       = $state("-- s");
    let intervalId = null;
    let startDate  = null;
    let offset     = 0;
    let runtime    = 0;
    let formatter  = new Intl.NumberFormat("de-DE", {minimumFractionDigits: 1, maximumFractionDigits: 1});

    function startStopWatch() {
        if (intervalId) return;
        startDate = Date.now();

        intervalId = setInterval(() => {
            runtime = Math.round((Date.now() - startDate + offset) / 100) / 10.0;
            time    = `${formatter.format(runtime)} s`;
        }, 100);
    }

    function stopStopWatch(reset) {
        if (!intervalId) return;
        clearInterval(intervalId);
        intervalId = null;

        if (reset) {
            runtime = 0;
            offset  = 0;
            time    = "-- s";
        } else {
            time   = `${formatter.format(runtime)} s`;
            offset = Date.now() - startDate;
        }
    }

    $effect(() => {
        switch (status) {
            case "stopped":
                stopStopWatch();
                break;
            case "running":
                startStopWatch(false);
                break;
            case "reset":
                stopStopWatch(true);
        }
    });
</script>

<span class="stopWatch">
    <span class="bi {icon}"></span>
    <span>{text}</span>
    <span class="time">{time}</span>
</span>

<style>
    .stopWatch {
        display: inline-flex;
        align-items: top;
        gap: 0.25em;

        color: grey;

        .time {
            min-width: 3em;
            color: lightgrey;
        }
    }
</style>

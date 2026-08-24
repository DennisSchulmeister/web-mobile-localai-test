/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 * Lizenziert unter CC0
 */

import ApplicationFrame from "./components/app-frame/ApplicationFrame.svelte";
import {mount}          from 'svelte';

import "@picocss/pico/css/pico.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";

mount(ApplicationFrame, {target: document.body});
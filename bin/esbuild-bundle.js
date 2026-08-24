/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 * Lizenziert unter CC0
 */

import * as esbuild  from "esbuild";
import esbuildSvelte from "esbuild-svelte";

esbuild.build({
    entryPoints: [`src/index.js`],
    outdir: "static/_bundle/",    

    bundle:    true,
    splitting: true,
    minify:    true,
    sourcemap: true,
    format:    "esm",

    mainFields: ["svelte", "browser", "module", "main"],
    conditions: ["svelte", "browser"],
    logLevel:   "info",

    plugins: [
        esbuildSvelte({
            compilerOptions: {
                experimental: {
                    async: true,
                },
                compatibility: {
                    componentApi: 5
                },
                customElement: true,
            },
        }),
    ],

    loader: {
        ".svg": "text",
        ".ttf": "dataurl",
        ".woff": "dataurl",
        ".woff2": "dataurl",
        ".eot": "dataurl",
        ".jpg": "dataurl",
        ".png": "dataurl",
        ".gif": "dataurl",
    },
});

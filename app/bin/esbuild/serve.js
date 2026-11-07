/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as esbuild  from "esbuild";
import esbuildSvelte from "esbuild-svelte";

let ctx = await esbuild.context({
    entryPoints: [`src/index.js`],
    outdir: "static/_bundle/",

    bundle:    true,
    splitting: true,
    minify:    false,
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
    }
});

let { host, port } = await ctx.serve({
    servedir: "static",
    port: 8888,
});

console.log(`Listening on ${host}:${port}`);
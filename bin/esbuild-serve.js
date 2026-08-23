import * as esbuild from "esbuild";

let ctx = await esbuild.context({
    entryPoints: [`src/index.js`],
    outdir: "static/_bundle/",

    bundle: true,
    splitting: true,
    sourcemap: true,
    format: "esm",

    plugins: [],

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
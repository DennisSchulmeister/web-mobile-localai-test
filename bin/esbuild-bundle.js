import * as esbuild from "esbuild";

esbuild.build({
    entryPoints: [`src/index.js`],
    outdir: "static/_bundle/",    

    bundle: true,
    splitting: true,
    minify: true,
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
    },
});

/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 * Lizenziert unter CC0
 */

import { dirname }       from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

import path  from "path";
import shell from "shelljs";

for (let dir of process.env.npm_package_config_clean_dirs?.split(" : ") || []) {
    dir = path.normalize(path.join(__dirname, "..", dir));
    shell.rm("-rf", dir);
}

/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import path       from "node:path";
import process    from "node:process";
import shell      from "shelljs";
import * as utils from "../utils.js";

console.log("Daten vorverarbeiten");
console.log("====================");
console.log("");

// Konfiguration einlesen
if (process.argv.length < 3) {
    utils.logError("Zu wenig Kommandozeilenparameter!");
    utils.logError(`Aufruf: ${process.argv[0]} ${process.argv[1]} <config.json>`);
    process.exit(1);
}

let config = utils.readConfig({
    configFile: process.argv[2],
    withData:   true,
});

// https://naturalnode.github.io/natural/Tokenizers.html
// https://github.com/remarkjs/remark
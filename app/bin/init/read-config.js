/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import process    from "node:process";
import * as utils from "../utils.js";

if (process.argv.length < 3) {
    utils.logError("Too few arguments!");
    utils.logError(`Usage: ${process.argv[0]} ${process.argv[1]} <config.json>`);
    process.exit(1);
}

let config = utils.readConfig({
    configFile: process.argv[2],
    withModels: true,
    withData:   true,
});

console.log(JSON.stringify(config, null, 4));

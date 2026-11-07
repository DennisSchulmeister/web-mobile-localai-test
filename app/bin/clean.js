/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import {rm} from "node:fs/promises";
import path  from "path";

for (const dir of process.argv.slice(2)) {
    await rm(path.resolve(dir), {recursive: true, force: true});
}

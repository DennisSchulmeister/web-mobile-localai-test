/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import AndroidBackend      from "./android.js";
import TransformersBackend from "./transformers.js";

let backendClasses      = [TransformersBackend, AndroidBackend];
const supportedBackends = [];

for (let backendClass of backendClasses) {
    let backend = new backendClass();
    if (backend.isSupported) supportedBackends.push(backend);
}

export default supportedBackends;

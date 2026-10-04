/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

import BaseBackend from "./base.js";

/**
 * Zusätzliches Inferenz-Backend für die Android App. Kommuniziert ober ein
 * Capacitor Plugin mit nativem Java-Code, um die Inferenz mit einer nativen
 * Library außerhalb der Web View auszuführen. Dies müsste theoretisch mehrere
 * Vorteile haben:
 * 
 * 1. Weniger Speicherprobleme, da wir das Speichermodell des Browsers umgehen.
 * 2. Schnellere Ausführung, vor allem wenn TPU-Devices genutzt werden können.
 */
export default class AndroidBackend extends BaseBackend {
}

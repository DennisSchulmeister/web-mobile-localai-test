/**
 * Web/Mobile-Test für lokale KI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Embedding für die JSON-Serialisierung als Base64-String codieren.
 * 
 * @param {TyppedArray} embedding Embeddings im plattform-spezifischen Format
 * @param {string} dtype Datentyp des KI-Modells (aktuell nur `fp32`)
 * @returns {string} Base64-codierte Embeddings
 */
export function encodeEmbedding(embedding, dtype) {
    let bytes = new Uint8Array(embedding.length * 4);
    let view  = new DataView(bytes.buffer);

    for (let i = 0; i < embedding.length; i++) {
        switch (dtype) {
            case "fp32":
                view.setFloat32(i * 4, embedding[i], true);
                break;
            default:
                throw new Error(`Einbettung mit Datentyp ${dtype} kann nicht codiert werden.`);
        }
    }

    return bytes.toBase64();
}

/**
 * Embedding aus Base64-codiertem String wieder herstellen.
 * 
 * @param {string} base64 Base64-codierte Embeddings
 * @param {string} dtype Datentyp des KI-Modells (aktuell nur `fp32`)
 * @returns {TypedArray} Embeddings im plattform-spezifischen Format
 */
export function decodeEmbedding(base64, dtype) {
    if (Uint8Array.fromBase64) {
        // Neuere Browser
        let bytes = Uint8Array.fromBase64(base64);
        let view  = new DataView(bytes.buffer);
    
        switch (dtype) {
            case "fp32": {
                let embedding = new Float32Array(bytes.length / 4);
            
                for (let i = 0; i < embedding.length; i++) {
                    embedding[i] = view.getFloat32(i * 4, true);
                }
            
                return embedding;
            }
            default:
                throw new Error(`Einbettung mit Datentyp ${dtype} kann nicht decodiert werden.`);
        }
    } else {
        // Android Webview auf Geräten vor 2026
        let binary = atob(base64);
        let bytes  = new Uint8Array(binary.length);
        let view   = new DataView(bytes.buffer);

        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        switch (dtype) {
            case "fp32": {
                let embedding = new Float32Array(bytes.length / 4);

                for (let i = 0; i < embedding.length; i++) {
                    embedding[i] = view.getFloat32(i * 4, true);
                }

                return embedding;
            }
            default:
                throw new Error(`Einbettung mit Datentyp ${dtype} kann nicht decodiert werden.`);
        }
    }
}
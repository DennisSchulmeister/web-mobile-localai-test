/**
 * Web/Mobile Test for Local AI
 * © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
 *
 * This source code is licensed under the BSD 3-Clause License found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Encode an embedding as a Base64 string for JSON serialization.
 * 
 * @param {TypedArray} embedding Embeddings in the platform-specific format
 * @param {string} dtype AI model data type (currently only `fp32`)
 * @returns {string} Base64-encoded embeddings
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
 * Restore an embedding from a Base64-encoded string.
 * 
 * @param {string} base64 Base64-encoded embeddings
 * @param {string} dtype AI model data type (currently only `fp32`)
 * @returns {TypedArray} Embeddings in the platform-specific format
 */
export function decodeEmbedding(base64, dtype) {
    if (Uint8Array.fromBase64) {
        // Newer browsers
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
        // Android WebView on devices released before 2026
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

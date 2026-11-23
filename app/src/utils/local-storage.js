/**
 * Retrieves a value from local storage.
 *
 * @param {string} key Storage key
 * @param {string} fallback Value returned when the key is absent or storage is unavailable
 * @returns {string} Stored value or fallback
 */
export function getLocalStorageItem(key, fallback = "") {
    try {
        return window.localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
}

/**
 * Stores a string value in local storage, if possible. Does nothing, if local storage
 * is full (quota exceeded) or unavailable.
 *
 * @param {string} key Storage key
 * @param {string} value Value to store
 * @returns {void}
 */
export function setLocalStorageItem(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // The app can continue with in-memory state if storage is unavailable or full.
        console.error(`Cannot set local storage item ${key}.\n`, error);
    }
}

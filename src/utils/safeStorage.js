/**
 * Safe wrapper around window.localStorage to prevent unhandled SecurityError/AccessDenied
 * exceptions in restricted browser environments (such as Helium float browser, sandboxed WebViews, or private windows).
 */
export const safeStorage = {
    getItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (e) {
            console.warn(`[safeStorage] getItem failed for "${key}":`, e);
        }
        return null;
    },
    setItem: (key, value) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (e) {
            console.warn(`[safeStorage] setItem failed for "${key}":`, e);
        }
    },
    removeItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn(`[safeStorage] removeItem failed for "${key}":`, e);
        }
    }
};

export default safeStorage;

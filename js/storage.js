export const StorageEngine = {
    _memoryCache: {},
    get(key, fallback) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? JSON.parse(item) : fallback;
        } catch (e) {
            return this._memoryCache[key] !== undefined ? this._memoryCache[key] : fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this._memoryCache[key] = value;
        } catch (e) {
            this._memoryCache[key] = value;
        }
    },
    clearPrefix(prefix) {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
            keys.forEach(k => localStorage.removeItem(k));
            Object.keys(this._memoryCache).forEach(k => {
                if (k.startsWith(prefix)) delete this._memoryCache[k];
            });
        } catch (e) {
            this._memoryCache = {};
        }
    }
};
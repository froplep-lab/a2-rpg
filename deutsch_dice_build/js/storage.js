const STORAGE_KEY = 'de_b1_rpg_progress_v3';

const DEFAULT_PROGRESS = {
    xp: 0,
    level: 1,
    streak: 1,
    lastLoginDate: new Date().toDateString(),
    masteredWords: [],
    bookmarkedWords: [],
    completedQuests: {},
    claimedQuests: {},
    achievements: {},
    heroId: 'knight',
    unlockedHeroes: ['knight'],
    skills: {},
    leitnerBoxes: {},
    settings: { sound: true, volume: 50, speechRate: 0.9, autoSpeak: false }
};

export const StorageEngine = {
    get(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY + '_' + key);
            if (!raw) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            console.warn("[StorageEngine] get error:", e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(STORAGE_KEY + '_' + key, JSON.stringify(value));
        } catch (e) {
            console.error("[StorageEngine] set error:", e);
        }
    }
};

export function getProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_PROGRESS };
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_PROGRESS, ...parsed };
    } catch (e) {
        return { ...DEFAULT_PROGRESS };
    }
}

export function setProgress(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
}

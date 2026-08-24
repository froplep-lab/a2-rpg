import { StorageEngine } from './storage.js';

export let cards = [];
export let currentIndex = 0;
export let isFlipped = false;
export let masteredWords = new Set(StorageEngine.get('a2_mastered', []));
export let bookmarkedWords = new Set(StorageEngine.get('a2_bookmarks', []));

export let hero = StorageEngine.get('a2_hero', {
    level: 1,
    xp: 0,
    streak: 0
});

export function setCards(newCards) {
    cards = newCards;
}

export function setCurrentIndex(idx) {
    currentIndex = idx;
}

export function setIsFlipped(val) {
    isFlipped = val;
}
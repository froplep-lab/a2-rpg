import { checkAchievement } from './achievements.js';
import { progressQuest } from './quests.js';
import { cards, currentIndex, isFlipped, masteredWords, bookmarkedWords, setCurrentIndex, setIsFlipped } from './state.js';
import { StorageEngine } from './storage.js';
import { AudioEngine, autoSpeakOnFlip } from './audio.js';
import { Haptics } from './telegram.js';
import { speakWord } from './speech.js';
import { addXp } from './xp.js';
import { showToast } from './utils.js';

export function updateCard() {
    const card = cards[currentIndex];
    if (!card) return;

    document.getElementById("card-german").innerText = card.german;
    document.getElementById("card-grammar").innerText = card.grammar;
    document.getElementById("card-ukrainian").innerText = card.ukrainian;
    document.getElementById("card-hint").innerText = card.hint;
    document.getElementById("card-sentence").innerText = card.sentence;
    document.getElementById("card-emoji").innerText = card.emoji || '📌';
    document.getElementById("card-index-indicator").innerText = `${currentIndex + 1} / ${cards.length}`;

    const rObj = [{ name: 'звичайний', color: 'border-cyan-500/30 text-cyan-300' }, { name: 'рідкісний', color: 'border-cyan-400 text-cyan-300' }, { name: 'епічний', color: 'border-purple-400 text-purple-300' }, { name: 'легендарний', color: 'border-yellow-400 text-yellow-300' }].find(r => r.name === card.rarity) || { name: 'звичайний', color: 'border-cyan-500/30 text-cyan-300' };
    const badge = document.getElementById("card-rarity-badge");
    if (badge) {
        badge.className = `text-[10px] font-black px-2.5 py-1 rounded-md border ${rObj.color} uppercase`;
        badge.innerText = card.rarity ? card.rarity.toUpperCase() : 'ЗВИЧАЙНИЙ';
    }

    if (isFlipped) {
        flipCard(true);
    }
    updateMasteredUI();
    updateCardBookmarkUI();
}

export function flipCard(forceReset = false) {
    AudioEngine.play('click');
    Haptics.trigger('light');
    const inner = document.getElementById("flashcard-inner");
    if (!inner) return;

    if (forceReset) {
        setIsFlipped(false);
        inner.style.transform = "rotateY(0deg)";
        return;
    }

    setIsFlipped(!isFlipped);
    inner.style.transform = isFlipped ? "rotateY(180deg)" : "rotateY(0deg)";

    if (isFlipped) {
        progressQuest('review_cards', 1);
    }

    if (isFlipped && autoSpeakOnFlip) {
        speakWord();
    }
}

export function nextCard() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    setCurrentIndex((currentIndex + 1) % cards.length);
    progressQuest('review_cards', 1);
    updateCard();
}

export function prevCard() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    setCurrentIndex((currentIndex - 1 + cards.length) % cards.length);
    progressQuest('review_cards', 1);
    updateCard();
}

export function updateMasteredUI() {
    const card = cards[currentIndex];
    if (!card) return;
    const isM = masteredWords.has(card.german);
    const btn = document.getElementById("soul-hack-btn");
    
    if (isM) {
        if (btn) {
            btn.className = "interactive-btn w-full glass-panel text-slate-500 border border-slate-700 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed mt-2";
            btn.innerHTML = `<i class="fa-solid fa-ghost"></i> Душу зламано ✓`;
            btn.disabled = true;
        }
    } else {
        if (btn) {
            btn.className = "interactive-btn w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] mt-2";
            btn.innerHTML = `<i class="fa-solid fa-bolt"></i> Зламати душу`;
            btn.disabled = false;
        }
    }

    const progressEl = document.getElementById("theme-progress-text");
    if (progressEl && cards.length > 0) {
        const percent = Math.round((masteredWords.size / cards.length) * 100);
        progressEl.innerText = `${percent}%`;
    }
}

export function attackEnemyClick() {
    const card = cards[currentIndex];
    if (!card || masteredWords.has(card.german)) return;

    masteredWords.add(card.german);
    StorageEngine.set('a2_mastered', Array.from(masteredWords));
    
    AudioEngine.play('success');
    Haptics.trigger('success');
    addXp(25, 'master');
    progressQuest('learn_words', 1);
    checkAchievement('first_hack', 1);
    checkAchievement('vocab_master', 1);
    updateMasteredUI();
    window._isCompactDirty = true;
    showToast(`⚡ Душу слова "${card.german}" успішно зламано!`, 'success');
}

export function toggleBookmark() {
    const card = cards[currentIndex];
    if (!card) return;
    
    if (bookmarkedWords.has(card.german)) {
        bookmarkedWords.delete(card.german);
        showToast('Видалено з обраного', 'info');
    } else {
        bookmarkedWords.add(card.german);
        progressQuest('bookmark_words', 1);
        checkAchievement('collector', 1);
        showToast('Додано в обране ⭐️', 'success');
    }
    StorageEngine.set('a2_bookmarks', Array.from(bookmarkedWords));
    updateCardBookmarkUI();
    window._isCompactDirty = true;
    AudioEngine.play('click');
    Haptics.trigger('light');
}

export function updateCardBookmarkUI() {
    const card = cards[currentIndex];
    const btn = document.getElementById("card-bookmark-btn");
    if (!card || !btn) return;
    
    const isBookmarked = bookmarkedWords.has(card.german);
    btn.className = isBookmarked 
        ? "interactive-btn glass-panel text-yellow-400 py-3 px-1 rounded-2xl border border-yellow-500/50 bg-yellow-950/20 flex flex-col items-center shadow-md"
        : "interactive-btn glass-panel text-slate-400 hover:text-yellow-400 py-3 px-1 rounded-2xl border border-slate-700 flex flex-col items-center shadow-md";
    btn.innerHTML = `<i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star text-sm mb-1"></i> <span class="truncate">ЗІРКА</span>`;
}
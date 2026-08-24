import { cards, masteredWords, bookmarkedWords, setCurrentIndex } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { updateCard } from './cards.js';

window._isCompactDirty = true;
let currentSearchQuery = "";
let currentRarityFilter = 'all';

export function switchDisplayMode(mode) {
    AudioEngine.play('click'); 
    Haptics.trigger('light');
    const gameView = document.getElementById("game-view-container");
    const compactView = document.getElementById("compact-block-view");
    const btnGame = document.getElementById("mode-game-btn");
    const btnCompact = document.getElementById("mode-compact-btn");

    if (mode === 'compact') {
        if (gameView) gameView.classList.add("hidden"); 
        if (compactView) compactView.classList.remove("hidden");
        if (btnCompact) btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
        if (btnGame) btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
        
        if (window._isCompactDirty) {
            renderCompactBlock();
            window._isCompactDirty = false;
        }
    } else {
        if (compactView) compactView.classList.add("hidden"); 
        if (gameView) gameView.classList.remove("hidden");
        if (btnGame) btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
        if (btnCompact) btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
    }
}

export function filterCompactWords(query) {
    currentSearchQuery = query.toLowerCase().trim();
    renderCompactBlock();
}

export function clearCompactSearch() {
    const input = document.getElementById("compact-search-input");
    if (input) input.value = "";
    currentSearchQuery = "";
    renderCompactBlock();
}

export function setRarityFilter(rarity) {
    currentRarityFilter = rarity;
    AudioEngine.play('click');
    Haptics.trigger('light');
    renderCompactBlock();
}

export function renderCompactBlock() {
    const grid = document.getElementById("compact-words-grid");
    if (!grid) return;

    const filteredCards = cards.filter(card => {
        if (currentRarityFilter === 'bookmarked') {
            if (!bookmarkedWords.has(card.german)) return false;
        } else if (currentRarityFilter !== 'all') {
            if ((card.rarity || 'звичайний').toLowerCase() !== currentRarityFilter) return false;
        }
        if (!currentSearchQuery) return true;
        return card.german.toLowerCase().includes(currentSearchQuery) || 
               card.ukrainian.toLowerCase().includes(currentSearchQuery) ||
               card.grammar.toLowerCase().includes(currentSearchQuery);
    });

    if (filteredCards.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-slate-500 text-xs font-bold">
                <i class="fa-solid fa-triangle-exclamation text-xl mb-2 text-pink-500 block"></i>
                Нічого не знайдено
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredCards.map((card) => {
        const isMastered = masteredWords.has(card.german);
        const isBookmarked = bookmarkedWords.has(card.german);
        return `
            <div onclick="jumpToCardFromCompact('${card.german.replace(/'/g, "\'")}')" class="interactive-btn glass-panel p-3.5 rounded-2xl border ${isMastered ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-700/60'} flex items-center justify-between cursor-pointer hover:border-cyan-400/60 shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${card.emoji || '📌'}</span>
                    <div>
                        <div class="text-xs font-black text-white">${card.german} ${isBookmarked ? '⭐️' : ''}</div>
                        <div class="text-[10px] text-emerald-400 font-bold">${card.ukrainian}</div>
                    </div>
                </div>
                ${isMastered ? '<span class="text-[9px] text-emerald-400 font-bold"><i class="fa-solid fa-check"></i> Зламано</span>' : ''}
            </div>
        `;
    }).join('');
}

export function jumpToCardFromCompact(ger) {
    AudioEngine.play('click');
    Haptics.trigger('light');
    const targetIdx = cards.findIndex(c => c.german === ger);
    if (targetIdx !== -1) {
        setCurrentIndex(targetIdx);
        switchDisplayMode('game');
        updateCard();
    }
}
window.jumpToCardFromCompact = jumpToCardFromCompact;
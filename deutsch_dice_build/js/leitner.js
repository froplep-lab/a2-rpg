import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { SpeechEngine, speakWord } from './speech.js';
import { currentSpeechRate } from './audio.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { StorageEngine } from './storage.js';
import { toggleModal, showToast } from './utils.js';

let leitnerBoxes = StorageEngine.get('a2_leitner_boxes') || { box1: [], box2: [], box3: [] };
let currentReviewQueue = [];
let reviewIndex = 0;
let currentReviewCard = null;
let isFlipped = false;

export function initLeitner() {
    if (!leitnerBoxes.box1 || leitnerBoxes.box1.length === 0) {
        // Init all cards in box 1
        leitnerBoxes.box1 = cards.map(c => c.german);
        StorageEngine.set('a2_leitner_boxes', leitnerBoxes);
    }
}

export function openLeitnerModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    initLeitner();
    
    document.getElementById("leitner-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">📦</div>
            <div class="text-sm font-bold text-slate-300">Інтервальне повторення за методом Лейтнера! Слова переміщуються між коробками залежно від того, наскільки добре ти їх пам'ятаєш.</div>
            <div class="grid grid-cols-3 gap-2 py-2">
                <div class="glass-panel p-3 rounded-xl border border-pink-500/30 text-center">
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Коробка 1</div>
                    <div class="text-lg font-black text-pink-400">${leitnerBoxes.box1.length}</div>
                </div>
                <div class="glass-panel p-3 rounded-xl border border-amber-500/30 text-center">
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Коробка 2</div>
                    <div class="text-lg font-black text-amber-400">${leitnerBoxes.box2.length}</div>
                </div>
                <div class="glass-panel p-3 rounded-xl border border-emerald-500/30 text-center">
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Коробка 3</div>
                    <div class="text-lg font-black text-emerald-400">${leitnerBoxes.box3.length}</div>
                </div>
            </div>
            <button onclick="startLeitnerSession()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ ПОВТОРЕННЯ</button>
        </div>
    `;
    toggleModal("leitner-modal", "leitner-box", true);
}

export function closeLeitnerModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("leitner-modal", "leitner-box", false);
}

export function startLeitnerSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    
    // Combine box1 (priority) and some from box2/box3 for review
    currentReviewQueue = [...leitnerBoxes.box1];
    if (currentReviewQueue.length === 0) {
        currentReviewQueue = [...leitnerBoxes.box2, ...leitnerBoxes.box3];
    }
    if (currentReviewQueue.length === 0) {
        currentReviewQueue = cards.map(c => c.german);
    }
    
    currentReviewQueue = currentReviewQueue.sort(() => Math.random() - 0.5).slice(0, 10);
    reviewIndex = 0;
    isFlipped = false;
    renderLeitnerCard();
}

export function renderLeitnerCard() {
    const content = document.getElementById("leitner-content");
    if (!content) return;

    if (reviewIndex >= currentReviewQueue.length) {
        const rewardXp = 80;
        addXp(rewardXp, 'quiz');
        progressQuest('flashcards_flipped', 10);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">📦✨</div>
                <div class="text-lg font-black text-cyan-400">ПОВТОРЕННЯ ЗАВЕРШЕНО!</div>
                <div class="text-xs font-bold text-pink-400">+${rewardXp} XP отримано!</div>
                <button onclick="openLeitnerModal()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ДО КОРОБОК</button>
            </div>
        `;
        return;
    }

    const germanWord = currentReviewQueue[reviewIndex];
    currentReviewCard = cards.find(c => c.german === germanWord) || cards[0];
    isFlipped = false;

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Картка ${reviewIndex + 1} / ${currentReviewQueue.length}</span>
                <span class="text-cyan-400">Метод Лейтнера</span>
            </div>

            <!-- Leitner Flashcard -->
            <div onclick="flipLeitnerCard()" class="glass-panel p-6 rounded-3xl border border-cyan-500/40 text-center space-y-4 cursor-pointer min-h-[200px] flex flex-col justify-center shadow-lg">
                <div class="text-xs font-black text-cyan-300 uppercase tracking-widest">${currentReviewCard.grammar || 'Wort'}</div>
                <div class="text-2xl sm:text-3xl font-black text-white">${currentReviewCard.german}</div>
                <div id="leitner-back-section" class="hidden space-y-2 pt-3 border-t border-slate-800 animate-[fade-in_0.3s_ease-out]">
                    <div class="text-2xl font-black text-emerald-400">${currentReviewCard.ukrainian}</div>
                    <div class="text-xs text-slate-300 italic">${currentReviewCard.hint || ''}</div>
                </div>
                <div class="text-[11px] text-slate-400 font-bold">
                    <i class="fa-solid fa-rotate text-cyan-400"></i> Натисни, щоб перевернути
                </div>
            </div>

            <!-- Action Buttons (Hard / Easy) -->
            <div id="leitner-actions" class="hidden grid grid-cols-2 gap-3 pt-2">
                <button onclick="answerLeitner(false)" class="interactive-btn bg-pink-500/20 border border-pink-500 text-pink-300 py-3.5 rounded-xl font-bold text-xs shadow-md">
                    <i class="fa-solid fa-xmark mr-1"></i> ЩЕ ВЧУ (У коробку 1)
                </button>
                <button onclick="answerLeitner(true)" class="interactive-btn bg-emerald-500/20 border border-emerald-500 text-emerald-300 py-3.5 rounded-xl font-bold text-xs shadow-md">
                    <i class="fa-solid fa-check mr-1"></i> ЗНАЮ (У коробку +1)
                </button>
            </div>
        </div>
    `;

    SpeechEngine.speak(currentReviewCard.german, currentSpeechRate);
}

export function flipLeitnerCard() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    isFlipped = true;
    const backSec = document.getElementById("leitner-back-section");
    const actions = document.getElementById("leitner-actions");
    if (backSec) backSec.classList.remove("hidden");
    if (actions) actions.classList.remove("hidden");
}

export function answerLeitner(known) {
    if (!currentReviewCard) return;
    const word = currentReviewCard.german;

    // Remove from all boxes first
    leitnerBoxes.box1 = leitnerBoxes.box1.filter(w => w !== word);
    leitnerBoxes.box2 = leitnerBoxes.box2.filter(w => w !== word);
    leitnerBoxes.box3 = leitnerBoxes.box3.filter(w => w !== word);

    if (known) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        // Move up box
        if (!leitnerBoxes.box2.includes(word) && !leitnerBoxes.box3.includes(word)) {
            leitnerBoxes.box2.push(word);
        } else {
            leitnerBoxes.box3.push(word);
        }
        showToast('Чудово! Переведено у вищу коробку 🚀', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        leitnerBoxes.box1.push(word);
        showToast('Повернено в першу коробку для повторення', 'info');
    }

    StorageEngine.set('a2_leitner_boxes', leitnerBoxes);
    reviewIndex++;
    renderLeitnerCard();
}

window.openLeitnerModal = openLeitnerModal;
window.closeLeitnerModal = closeLeitnerModal;
window.startLeitnerSession = startLeitnerSession;
window.flipLeitnerCard = flipLeitnerCard;
window.answerLeitner = answerLeitner;

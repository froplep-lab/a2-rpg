import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

let matchPairs = [];
let selectedCards = [];
let matchedCount = 0;
let matchScore = 0;

export function openMatchModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("match-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">🧩</div>
            <div class="text-sm font-bold text-slate-300">Меморі-дуель слів! Знайди пари німецьких та українських слів для тренування пам'яті.</div>
            <button onclick="startMatchSession()" class="interactive-btn w-full max-w-xs mx-auto bg-purple-500 text-white py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ ДУЕЛЬ</button>
        </div>
    `;
    toggleModal("match-modal", "match-box", true);
}

export function closeMatchModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("match-modal", "match-box", false);
}

export function startMatchSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    const subset = [...cards].sort(() => Math.random() - 0.5).slice(0, 4);
    matchPairs = [];
    subset.forEach(c => {
        matchPairs.push({ id: c.german, text: c.german, type: 'de', matched: false });
        matchPairs.push({ id: c.german, text: c.ukrainian, type: 'ua', matched: false });
    });
    matchPairs.sort(() => Math.random() - 0.5);
    selectedCards = [];
    matchedCount = 0;
    matchScore = 0;
    renderMatchGrid();
}

export function renderMatchGrid() {
    const content = document.getElementById("match-content");
    if (!content) return;

    if (matchedCount >= matchPairs.length / 2) {
        const rewardXp = 50;
        addXp(rewardXp, 'quiz');
        progressQuest('review_cards', 4);
        checkAchievement('vocab_master', 4);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">🧩🏆</div>
                <div class="text-lg font-black text-purple-400">ДУЕЛЬ ВИЙГРАНО!</div>
                <div class="text-sm text-slate-300">Всі пари знайдено успішно!</div>
                <div class="text-xs font-bold text-pink-400">+${rewardXp} XP отримано!</div>
                <button onclick="openMatchModal()" class="interactive-btn w-full max-w-xs mx-auto bg-purple-500 text-white py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ ДУЕЛЬ</button>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Знайдено пар: ${matchedCount} / ${matchPairs.length / 2}</span>
                <span class="text-purple-400">Меморі Дуель</span>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
                ${matchPairs.map((item, idx) => `
                    <button onclick="selectMatchCard(${idx})" ${item.matched ? 'disabled' : ''} class="interactive-btn p-4 rounded-2xl border ${item.matched ? 'bg-slate-900/20 border-slate-800 text-slate-600 cursor-not-allowed' : selectedCards.includes(idx) ? 'bg-purple-500/20 border-purple-400 text-white' : 'glass-panel border-slate-700 text-slate-200 hover:border-purple-400'} text-xs font-bold transition-all h-20 flex items-center justify-center text-center">
                        ${item.matched ? '✓' : item.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

export function selectMatchCard(idx) {
    if (selectedCards.includes(idx) || matchPairs[idx].matched) return;
    AudioEngine.play('click');
    Haptics.trigger('light');

    selectedCards.push(idx);
    renderMatchGrid();

    if (selectedCards.length === 2) {
        const [firstIdx, secondIdx] = selectedCards;
        const first = matchPairs[firstIdx];
        const second = matchPairs[secondIdx];

        if (first.id === second.id && first.type !== second.type) {
            // Match!
            AudioEngine.play('success');
            Haptics.trigger('success');
            first.matched = true;
            second.matched = true;
            matchedCount++;
            selectedCards = [];
            showToast('Пару знайдено! 🧩', 'success');
            setTimeout(() => renderMatchGrid(), 600);
        } else {
            // Mismatch
            AudioEngine.play('error');
            Haptics.trigger('error');
            setTimeout(() => {
                selectedCards = [];
                renderMatchGrid();
            }, 700);
        }
    }
}

window.openMatchModal = openMatchModal;
window.closeMatchModal = closeMatchModal;
window.startMatchSession = startMatchSession;
window.selectMatchCard = selectMatchCard;

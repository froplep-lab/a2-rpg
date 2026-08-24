import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { SpeechEngine } from './speech.js';
import { currentSpeechRate } from './audio.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

let rushScore = 0;
let rushTimer = 20;
let rushInterval = null;
let currentRushCard = null;
let rushActive = false;

export function openSpeedRushModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("speedrush-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">⚡🏛️</div>
            <div class="text-sm font-bold text-slate-300">Артикль-Раш (Speed Rush)! Визнач правильний рід (der, die, das) для іменника на час. Заробляй XP та ламай рекорди!</div>
            <button onclick="startSpeedRushSession()" class="interactive-btn w-full max-w-xs mx-auto bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ РАШ</button>
        </div>
    `;
    toggleModal("speedrush-modal", "speedrush-box", true);
}

export function closeSpeedRushModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    rushActive = false;
    if (rushInterval) clearInterval(rushInterval);
    toggleModal("speedrush-modal", "speedrush-box", false);
}

export function startSpeedRushSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    rushScore = 0;
    rushTimer = 25;
    rushActive = true;

    // Filter only Nouns (Nomen)
    const nouns = cards.filter(c => c.grammar && c.grammar.toLowerCase().includes('nomen'));
    if (nouns.length === 0) {
        nouns.push(...cards);
    }

    nextRushQuestion();
    
    if (rushInterval) clearInterval(rushInterval);
    rushInterval = setInterval(() => {
        rushTimer--;
        const timerEl = document.getElementById("rush-timer-val");
        if (timerEl) timerEl.innerText = rushTimer + 'с';

        if (rushTimer <= 0) {
            clearInterval(rushInterval);
            endSpeedRushSession();
        }
    }, 1000);
}

export function nextRushQuestion() {
    if (!rushActive) return;
    const nouns = cards.filter(c => c.grammar && c.grammar.toLowerCase().includes('nomen'));
    currentRushCard = nouns[Math.floor(Math.random() * nouns.length)] || cards[0];

    const content = document.getElementById("speedrush-content");
    if (!content) return;

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Бали: <b class="text-amber-400 text-sm">${rushScore}</b></span>
                <span id="rush-timer-val" class="text-pink-400 font-black text-sm">${rushTimer}с</span>
            </div>

            <div class="glass-panel p-6 rounded-3xl border border-amber-500/40 text-center space-y-3 bg-slate-950/60 shadow-lg">
                <div class="text-xs text-slate-400 uppercase font-bold">Який артикль у цього слова?</div>
                <div class="text-3xl font-black text-white">${currentRushCard.german.replace(/^(der|die|das)\s+/i, '')}</div>
                <div class="text-xs text-emerald-400 font-bold">(${currentRushCard.ukrainian})</div>
            </div>

            <!-- Article Buttons -->
            <div class="grid grid-cols-3 gap-2 pt-2">
                <button onclick="checkRushArticle('der')" class="interactive-btn bg-cyan-500/20 border border-cyan-500 text-cyan-300 py-4 rounded-2xl font-black text-sm shadow-md">DER</button>
                <button onclick="checkRushArticle('die')" class="interactive-btn bg-pink-500/20 border border-pink-500 text-pink-300 py-4 rounded-2xl font-black text-sm shadow-md">DIE</button>
                <button onclick="checkRushArticle('das')" class="interactive-btn bg-amber-500/20 border border-amber-500 text-amber-300 py-4 rounded-2xl font-black text-sm shadow-md">DAS</button>
            </div>
        </div>
    `;
}

export function checkRushArticle(article) {
    if (!rushActive || !currentRushCard) return;

    const germanLower = currentRushCard.german.toLowerCase();
    let correctArticle = 'der';
    if (germanLower.startsWith('die ')) correctArticle = 'die';
    else if (germanLower.startsWith('das ')) correctArticle = 'das';
    else if (currentRushCard.grammar.includes('f.')) correctArticle = 'die';
    else if (currentRushCard.grammar.includes('n.')) correctArticle = 'das';

    if (article === correctArticle) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        rushScore++;
        showToast('Правильно! +1 бал 🔥', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast(`Помилка! Це ${correctArticle.toUpperCase()}`, 'error');
    }

    nextRushQuestion();
}

export function endSpeedRushSession() {
    rushActive = false;
    const rewardXp = rushScore * 10 + 20;
    addXp(rewardXp, 'quiz');
    progressQuest('quiz_correct', rushScore);
    checkAchievement('vocab_master', rushScore);
    AudioEngine.play('levelup');
    Haptics.trigger('success');

    const content = document.getElementById("speedrush-content");
    if (!content) return;

    content.innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-5xl">⚡🏆</div>
            <div class="text-lg font-black text-amber-400">РАШ ЗАВЕРШЕНО!</div>
            <div class="text-sm text-slate-300">Правильних відповідей: <b>${rushScore}</b></div>
            <div class="text-xs font-bold text-pink-400">+${rewardXp} XP отримано!</div>
            <button onclick="startSpeedRushSession()" class="interactive-btn w-full max-w-xs mx-auto bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ГРАТИ ЗНОВУ</button>
        </div>
    `;
}

window.openSpeedRushModal = openSpeedRushModal;
window.closeSpeedRushModal = closeSpeedRushModal;
window.startSpeedRushSession = startSpeedRushSession;
window.checkRushArticle = checkRushArticle;

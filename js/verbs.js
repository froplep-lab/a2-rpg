import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { SpeechEngine } from './speech.js';
import { currentSpeechRate } from './audio.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

const VERBS_DATA = [
    { infinitive: 'sein', praeteritum: 'war', perfekt: 'ist gewesen', translation: 'бути', hint: 'Важливий допоміжне дієслово' },
    { infinitive: 'haben', praeteritum: 'hatte', perfekt: 'hat gehabt', translation: 'мати', hint: 'Допоміжне дієслово' },
    { infinitive: 'gehen', praeteritum: 'ging', perfekt: 'ist gegangen', translation: 'ходити, йти', hint: 'Рух у просторі' },
    { infinitive: 'kommen', praeteritum: 'kam', perfekt: 'ist gekommen', translation: 'приходити', hint: 'Наближатися' },
    { infinitive: 'machen', praeteritum: 'machte', perfekt: 'hat gemacht', translation: 'робити', hint: 'Виконувати дію' },
    { infinitive: 'sehen', praeteritum: 'sah', perfekt: 'hat gesehen', translation: 'бачити', hint: 'За допомогою очей' },
    { infinitive: 'sprechen', praeteritum: 'sprach', perfekt: 'hat gesprochen', translation: 'говорити', hint: 'Спілкуватися' },
    { infinitive: 'essen', praeteritum: 'aß', perfekt: 'hat gegessen', translation: 'їсти', hint: 'Споживати їжу' },
    { infinitive: 'trinken', praeteritum: 'trank', perfekt: 'hat getrunken', translation: 'пити', hint: 'Споживати рідину' },
    { infinitive: 'schreiben', praeteritum: 'schrieb', perfekt: 'hat geschrieben', translation: 'писати', hint: 'Залишати текст' }
];

let verbQueue = [];
let verbIndex = 0;
let verbScore = 0;
let currentVerb = null;

export function openVerbsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("verbs-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">⚡📚</div>
            <div class="text-sm font-bold text-slate-300">Арена дієслів B1 (Präsens → Präteritum → Perfekt)! Тренуй основні форми сильних та слабких дієслів.</div>
            <button onclick="startVerbsSession()" class="interactive-btn w-full max-w-xs mx-auto bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ АРЕНУ ДІЄСЛІВ</button>
        </div>
    `;
    toggleModal("verbs-modal", "verbs-box", true);
}

export function closeVerbsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("verbs-modal", "verbs-box", false);
}

export function startVerbsSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    verbQueue = [...VERBS_DATA].sort(() => Math.random() - 0.5).slice(0, 5);
    verbIndex = 0;
    verbScore = 0;
    renderVerbQuestion();
}

export function renderVerbQuestion() {
    const content = document.getElementById("verbs-content");
    if (!content) return;

    if (verbIndex >= verbQueue.length) {
        const rewardXp = verbScore * 20 + 30;
        addXp(rewardXp, 'quiz');
        progressQuest('review_cards', verbScore);
        checkAchievement('vocab_master', verbScore);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">⚡🏆</div>
                <div class="text-lg font-black text-amber-400">АРЕНУ ДІЄСЛІВ ПРОЙДЕНО!</div>
                <div class="text-sm text-slate-300">Правильних відповідей: <b>${verbScore} / ${verbQueue.length}</b></div>
                <div class="text-xs font-bold text-pink-400">+${rewardXp} XP зароблено!</div>
                <button onclick="openVerbsModal()" class="interactive-btn w-full max-w-xs mx-auto bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ АРЕНУ</button>
            </div>
        `;
        return;
    }

    currentVerb = verbQueue[verbIndex];
    SpeechEngine.speak(currentVerb.infinitive, currentSpeechRate);

    // Generate options for Präteritum
    const wrongPraeteritum = VERBS_DATA.filter(v => v.praeteritum !== currentVerb.praeteritum)
                                       .sort(() => Math.random() - 0.5)
                                       .slice(0, 3)
                                       .map(v => v.praeteritum);
    const options = [...wrongPraeteritum, currentVerb.praeteritum].sort(() => Math.random() - 0.5);

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Дієслово ${verbIndex + 1} / ${verbQueue.length}</span>
                <span class="text-amber-400">Бали: ${verbScore}</span>
            </div>

            <div class="glass-panel p-5 rounded-2xl border border-amber-500/30 text-center space-y-2">
                <div class="text-xs text-amber-400 font-bold uppercase">Оберіть Präteritum для:</div>
                <div class="text-3xl font-black text-white">${currentVerb.infinitive}</div>
                <div class="text-xs text-emerald-400 font-bold">${currentVerb.translation} (${currentVerb.hint})</div>
            </div>

            <div class="grid grid-cols-1 gap-2.5">
                ${options.map((opt, idx) => `
                    <button onclick="checkVerbAnswer('${opt.replace(/'/g, "\\'")}', '${currentVerb.praeteritum.replace(/'/g, "\\'")}')" class="interactive-btn glass-panel border border-slate-700 text-slate-200 py-3.5 px-4 rounded-xl font-bold text-xs hover:border-amber-400 verb-opt-btn text-left flex justify-between items-center">
                        <span>${opt}</span>
                        <i class="fa-solid fa-chevron-right text-xs text-slate-500"></i>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

export function checkVerbAnswer(selected, correct) {
    const btns = document.querySelectorAll(".verb-opt-btn");
    btns.forEach(btn => {
        btn.disabled = true;
        const textSpan = btn.querySelector("span").innerText;
        if (textSpan === correct) {
            btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-300");
        } else if (textSpan === selected) {
            btn.classList.add("border-pink-500", "bg-pink-500/20", "text-pink-300");
        } else {
            btn.classList.add("opacity-40");
        }
    });

    if (selected === correct) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        verbScore++;
        showToast('Правильно! Чудова форма Präteritum ⚡', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast(`Помилка! Правильно: ${correct}`, 'error');
    }

    verbIndex++;
    setTimeout(() => {
        renderVerbQuestion();
    }, 1000);
}

window.openVerbsModal = openVerbsModal;
window.closeVerbsModal = closeVerbsModal;
window.startVerbsSession = startVerbsSession;
window.checkVerbAnswer = checkVerbAnswer;

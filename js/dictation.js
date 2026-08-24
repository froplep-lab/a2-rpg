import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { SpeechEngine } from './speech.js';
import { currentSpeechRate } from './audio.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

let dictationQueue = [];
let dictationIndex = 0;
let dictationScore = 0;
let currentDictationItem = null;

export function openDictationModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("dictation-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">🎧</div>
            <div class="text-sm font-bold text-slate-300">Аудіо-диктант! Прослухай німецьке слово або речення та вибери правильний переклад.</div>
            <button onclick="startDictationSession()" class="interactive-btn w-full max-w-xs mx-auto bg-emerald-500 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ ДИКТАНТ</button>
        </div>
    `;
    toggleModal("dictation-modal", "dictation-box", true);
}

export function closeDictationModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("dictation-modal", "dictation-box", false);
}

export function startDictationSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    dictationQueue = [...cards].sort(() => Math.random() - 0.5).slice(0, 5);
    dictationIndex = 0;
    dictationScore = 0;
    renderDictationQuestion();
}

export function playCurrentDictationAudio() {
    if (currentDictationItem) {
        SpeechEngine.speak(currentDictationItem.german, currentSpeechRate);
    }
}

export function renderDictationQuestion() {
    const content = document.getElementById("dictation-content");
    if (!content) return;

    if (dictationIndex >= dictationQueue.length) {
        const rewardXp = dictationScore * 20 + 30;
        addXp(rewardXp, 'quiz');
        progressQuest('listen_words', dictationScore);
        checkAchievement('vocab_master', dictationScore);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">🎧✨</div>
                <div class="text-lg font-black text-emerald-400">ДИКТАНТ ЗАВЕРШЕНО!</div>
                <div class="text-sm text-slate-300">Правильних відповідей: <b>${dictationScore} / ${dictationQueue.length}</b></div>
                <div class="text-xs font-bold text-pink-400">+${rewardXp} XP отримано!</div>
                <button onclick="openDictationModal()" class="interactive-btn w-full max-w-xs mx-auto bg-emerald-500 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ ДИКТАНТ</button>
            </div>
        `;
        return;
    }

    currentDictationItem = dictationQueue[dictationIndex];
    
    // Generate 3 wrong options + 1 correct option
    const wrongOptions = cards.filter(c => c.ukrainian !== currentDictationItem.ukrainian)
                              .sort(() => Math.random() - 0.5)
                              .slice(0, 3)
                              .map(c => c.ukrainian);
    
    const options = [...wrongOptions, currentDictationItem.ukrainian].sort(() => Math.random() - 0.5);

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Питання ${dictationIndex + 1} / ${dictationQueue.length}</span>
                <span class="text-emerald-400">Бали: ${dictationScore}</span>
            </div>
            <div class="glass-panel p-6 rounded-2xl border border-emerald-500/30 text-center space-y-4">
                <button onclick="playCurrentDictationAudio()" class="interactive-btn w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-2xl shadow-lg speech-active-indicator">
                    <i class="fa-solid fa-volume-high"></i>
                </button>
                <div class="text-xs text-slate-300">Натисни, щоб послухати аудіо та обрати переклад</div>
            </div>
            <div class="grid grid-cols-1 gap-2.5">
                ${options.map(opt => `
                    <button onclick="checkDictationAnswer('${opt.replace(/'/g, "\\'")}', '${currentDictationItem.ukrainian.replace(/'/g, "\\'")}')" class="interactive-btn glass-panel border border-slate-700 text-slate-200 py-3.5 px-4 rounded-xl font-bold text-xs hover:border-emerald-400 dictation-opt-btn text-left flex justify-between items-center">
                        <span>${opt}</span>
                        <i class="fa-solid fa-chevron-right text-xs text-slate-500"></i>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Auto play audio on question load
    setTimeout(() => {
        playCurrentDictationAudio();
    }, 300);
}

export function checkDictationAnswer(selected, correct) {
    const btns = document.querySelectorAll(".dictation-opt-btn");
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
        dictationScore++;
        showToast('Правильно! Чудовий слух! 🎧', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast(`Помилка! Правильно: ${correct}`, 'error');
    }

    dictationIndex++;
    setTimeout(() => {
        renderDictationQuestion();
    }, 1000);
}

window.openDictationModal = openDictationModal;
window.closeDictationModal = closeDictationModal;
window.startDictationSession = startDictationSession;
window.playCurrentDictationAudio = playCurrentDictationAudio;
window.checkDictationAnswer = checkDictationAnswer;

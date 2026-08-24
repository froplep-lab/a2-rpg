import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { SpeechEngine } from './speech.js';
import { currentSpeechRate } from './audio.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

const SENTENCES = [
    { de: "Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.", ua: "Я вчу німецьку, тому що хочу працювати в Німеччині." },
    { de: "Obwohl das Wetter schlecht ist, gehen wir spazieren.", ua: "Хоча погода погана, ми йдемо гуляти." },
    { de: "Er hat gesagt, dass er morgen kommen wird.", ua: "Він сказав, що прийде завтра." },
    { de: "Wenn ich Zeit habe, lese ich ein Buch.", ua: "Коли я маю час, я читаю книгу." },
    { de: "Wir haben gestern einen schönen Film gesehen.", ua: "Вчора ми подивилися гарний фільм." }
];

let currentSentenceIndex = 0;
let sentenceScore = 0;
let selectedWords = [];
let availableWords = [];
let activeSentenceItem = null;

export function openSentenceModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("sentence-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">🧩</div>
            <div class="text-sm font-bold text-slate-300">Конструктор речень (Satzbau)! Розстав слова у правильному німецькому порядку відповідно до правил граматики B1.</div>
            <button onclick="startSentenceSession()" class="interactive-btn w-full max-w-xs mx-auto bg-purple-500 text-white py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ КОНСТРУКТОР</button>
        </div>
    `;
    toggleModal("sentence-modal", "sentence-box", true);
}

export function closeSentenceModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("sentence-modal", "sentence-box", false);
}

export function startSentenceSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    currentSentenceIndex = 0;
    sentenceScore = 0;
    loadSentenceQuestion();
}

export function loadSentenceQuestion() {
    const content = document.getElementById("sentence-content");
    if (!content) return;

    if (currentSentenceIndex >= SENTENCES.length) {
        const rewardXp = sentenceScore * 25 + 40;
        addXp(rewardXp, 'quiz');
        progressQuest('quiz_correct', sentenceScore);
        checkAchievement('vocab_master', sentenceScore);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">🏆✨</div>
                <div class="text-lg font-black text-purple-400">ТРЕНУВАННЯ ЗАВЕРШЕНО!</div>
                <div class="text-sm text-slate-300">Правильних речень: <b>${sentenceScore} / ${SENTENCES.length}</b></div>
                <div class="text-xs font-bold text-pink-400">+${rewardXp} XP отримано!</div>
                <button onclick="openSentenceModal()" class="interactive-btn w-full max-w-xs mx-auto bg-purple-500 text-white py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ</button>
            </div>
        `;
        return;
    }

    activeSentenceItem = SENTENCES[currentSentenceIndex];
    selectedWords = [];
    
    // Clean punctuation from words when splitting
    const cleanStr = activeSentenceItem.de.replace(/[.,]/g, '');
    availableWords = cleanStr.split(' ').sort(() => Math.random() - 0.5);

    renderSentenceScreen();
}

export function renderSentenceScreen() {
    const content = document.getElementById("sentence-content");
    if (!content) return;

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Речення ${currentSentenceIndex + 1} / ${SENTENCES.length}</span>
                <span class="text-purple-400">Бали: ${sentenceScore}</span>
            </div>
            
            <div class="glass-panel p-4 rounded-2xl border border-purple-500/30 space-y-2 text-center">
                <div class="text-[10px] text-slate-400 uppercase font-bold">Переклад:</div>
                <div class="text-sm font-black text-white">${activeSentenceItem.ua}</div>
            </div>

            <!-- Selected Target Area -->
            <div class="glass-panel p-4 rounded-2xl border border-cyan-500/30 min-h-[70px] flex flex-wrap gap-2 items-center justify-center bg-slate-900/60" id="selected-words-zone">
                ${selectedWords.length === 0 ? '<span class="text-xs text-slate-500 italic">Натискай на слова знизу, щоб зібрати речення</span>' : ''}
                ${selectedWords.map((item, idx) => `
                    <button onclick="removeSelectedWord(${idx})" class="interactive-btn px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500 text-cyan-300 text-xs font-bold shadow-md">
                        ${item} <i class="fa-solid fa-xmark ml-1"></i>
                    </button>
                `).join('')}
            </div>

            <!-- Available Words Pool -->
            <div class="flex flex-wrap gap-2 justify-center pt-2">
                ${availableWords.map((word, idx) => `
                    <button onclick="pickWord('${word.replace(/'/g, "\\'")}', ${idx})" class="interactive-btn px-3 py-2 rounded-xl glass-panel border border-slate-700 text-slate-200 text-xs font-bold hover:border-purple-400">
                        ${word}
                    </button>
                `).join('')}
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2">
                <button onclick="resetSentenceBuild()" class="interactive-btn flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold text-xs border border-slate-700">СЕКЕТИ / СТЕРТИ</button>
                <button onclick="checkSentenceBuild()" class="interactive-btn flex-1 bg-purple-500 text-white py-3 rounded-xl font-black text-xs shadow-md">ПЕРЕВІРИТИ</button>
            </div>
        </div>
    `;
}

export function pickWord(word, index) {
    AudioEngine.play('click');
    Haptics.trigger('light');
    selectedWords.push(word);
    availableWords.splice(index, 1);
    renderSentenceScreen();
}

export function removeSelectedWord(index) {
    AudioEngine.play('click');
    Haptics.trigger('light');
    const word = selectedWords.splice(index, 1)[0];
    availableWords.push(word);
    renderSentenceScreen();
}

export function resetSentenceBuild() {
    AudioEngine.play('click');
    selectedWords = [];
    const cleanStr = activeSentenceItem.de.replace(/[.,]/g, '');
    availableWords = cleanStr.split(' ').sort(() => Math.random() - 0.5);
    renderSentenceScreen();
}

export function checkSentenceBuild() {
    const builtText = selectedWords.join(' ');
    const targetClean = activeSentenceItem.de.replace(/[.,]/g, '');

    if (builtText === targetClean) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        sentenceScore++;
        showToast('Ідеально! Граматика правильна! 🧠', 'success');
        SpeechEngine.speak(activeSentenceItem.de, currentSpeechRate);
        currentSentenceIndex++;
        setTimeout(() => {
            loadSentenceQuestion();
        }, 1200);
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast('Помилка в порядку слів! Спробуй ще.', 'error');
    }
}

window.openSentenceModal = openSentenceModal;
window.closeSentenceModal = closeSentenceModal;
window.startSentenceSession = startSentenceSession;
window.pickWord = pickWord;
window.removeSelectedWord = removeSelectedWord;
window.resetSentenceBuild = resetSentenceBuild;
window.checkSentenceBuild = checkSentenceBuild;

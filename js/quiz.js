import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

export function openQuizModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("quiz-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">⚡</div>
            <div class="text-sm font-bold text-slate-300">Швидка перевірка значень слів для закріплення в пам'яті! Тест із 5 питань.</div>
            <button onclick="startQuickQuiz()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ БЛІЦ</button>
        </div>
    `;
    toggleModal("quiz-modal", "quiz-box", true);
}

export function closeQuizModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("quiz-modal", "quiz-box", false);
}

export function startQuickQuiz() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    quizQuestions = [...cards].sort(() => Math.random() - 0.5).slice(0, 5);
    quizIndex = 0;
    quizScore = 0;
    renderQuizQuestion();
}

export function renderQuizQuestion() {
    const content = document.getElementById("quiz-content");
    if (!content) return;

    if (quizIndex >= quizQuestions.length) {
        const rewardXp = quizScore * 10 + 20;
        addXp(rewardXp, 'quiz');
        progressQuest('review_cards', quizScore);
        checkAchievement('vocab_master', quizScore);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">⚡🏆</div>
                <div class="text-lg font-black text-cyan-400">БЛІЦ-ТЕСТ ЗАВЕРШЕНО!</div>
                <div class="text-sm text-slate-300">Правильних відповідей: <b>${quizScore} / ${quizQuestions.length}</b></div>
                <div class="text-xs font-bold text-pink-400">+${rewardXp} XP зароблено!</div>
                <button onclick="openQuizModal()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ БЛІЦ</button>
            </div>
        `;
        return;
    }

    const currentCard = quizQuestions[quizIndex];
    const wrongOptions = cards.filter(c => c.ukrainian !== currentCard.ukrainian).sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.ukrainian);
    const options = [...wrongOptions, currentCard.ukrainian].sort(() => Math.random() - 0.5);
    const correctIdx = options.indexOf(currentCard.ukrainian);

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Питання ${quizIndex + 1} / ${quizQuestions.length}</span>
                <span class="text-cyan-400">Бали: ${quizScore}</span>
            </div>
            <div class="glass-panel p-5 rounded-2xl border border-cyan-500/30 text-center space-y-2">
                <div class="text-2xl font-black text-white">${currentCard.german}</div>
                <div class="text-xs text-cyan-400 font-bold uppercase">${currentCard.grammar || 'Nomen'}</div>
            </div>
            <div class="grid grid-cols-1 gap-2.5">
                ${options.map((opt, idx) => `
                    <button onclick="checkQuizAnswer(${idx}, ${correctIdx})" class="interactive-btn glass-panel border border-slate-700 text-slate-200 py-3 px-4 rounded-xl font-bold text-xs text-left hover:border-cyan-400 hover:text-cyan-300 quiz-btn">
                        ${idx + 1}. ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

export function checkQuizAnswer(selected, correct) {
    const btns = document.querySelectorAll(".quiz-btn");
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correct) {
            btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-300");
        } else if (idx === selected) {
            btn.classList.add("border-pink-500", "bg-pink-500/20", "text-pink-300");
        } else {
            btn.classList.add("opacity-40");
        }
    });

    if (selected === correct) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        quizScore++;
        showToast('Правильно! ⚡', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast('Помилка', 'error');
    }

    quizIndex++;
    setTimeout(() => {
        renderQuizQuestion();
    }, 900);
}

window.openQuizModal = openQuizModal;
window.closeQuizModal = closeQuizModal;
window.startQuickQuiz = startQuickQuiz;
window.checkQuizAnswer = checkQuizAnswer;

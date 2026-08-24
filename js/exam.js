import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { addXp } from './xp.js';
import { toggleModal } from './utils.js';

let examQuestions = [];
let examIndex = 0;
let examScore = 0;

export function openExamSimulator() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("exam-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">🎓</div>
            <div class="text-sm font-bold text-slate-300">Перевір готовність до іспиту B1! Тест складається з 10 випадкових питань.</div>
            <button onclick="startExamSession()" class="interactive-btn w-full max-w-xs mx-auto bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-black text-sm shadow-[0_10px_25px_rgba(236,72,153,0.4)]">ПОЧАТИ ТЕСТ</button>
        </div>
    `;
    toggleModal("exam-modal", "exam-box", true);
}

export function closeExamSimulator() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("exam-modal", "exam-box", false);
}

export function startExamSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    examQuestions = [...cards].sort(() => Math.random() - 0.5).slice(0, 10);
    examIndex = 0;
    examScore = 0;
    renderExamQuestion();
}

export function renderExamQuestion() {
    const content = document.getElementById("exam-content");
    if (!content) return;

    if (examIndex >= examQuestions.length) {
        const percent = Math.round((examScore / examQuestions.length) * 100);
        const passed = percent >= 80;
        if (passed) {
            AudioEngine.play('levelup');
            Haptics.trigger('success');
            addXp(150);
        } else {
            AudioEngine.play('error');
            Haptics.trigger('error');
        }

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">${passed ? '🏆' : '⚠️'}</div>
                <div class="text-lg font-black ${passed ? 'text-emerald-400' : 'text-pink-400'}">${passed ? 'ІСПИТ СКЛАДЕНО УСПІШНО!' : 'ПОТРІБНА ДОДАТКОВА ПІДГОТОВКА'}</div>
                <div class="text-sm text-slate-300">Результат: <b>${examScore} / ${examQuestions.length}</b> (${percent}%)</div>
                <button onclick="openExamSimulator()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ СПРОБУ</button>
            </div>
        `;
        return;
    }

    const currentCard = examQuestions[examIndex];
    const wrongOptions = cards.filter(c => c.ukrainian !== currentCard.ukrainian).sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.ukrainian);
    const options = [...wrongOptions, currentCard.ukrainian].sort(() => Math.random() - 0.5);
    const correctIdx = options.indexOf(currentCard.ukrainian);

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Питання ${examIndex + 1} / ${examQuestions.length}</span>
                <span class="text-cyan-400">Бали: ${examScore}</span>
            </div>
            <div class="glass-panel p-5 rounded-2xl border border-pink-500/30 text-center space-y-2">
                <div class="text-2xl font-black text-white">${currentCard.german}</div>
                <div class="text-xs text-pink-400 font-bold uppercase">${currentCard.grammar || 'Nomen'}</div>
            </div>
            <div class="grid grid-cols-1 gap-2.5">
                ${options.map((opt, idx) => `
                    <button onclick="checkExamAnswer(${idx}, ${correctIdx})" class="interactive-btn glass-panel border border-slate-700 text-slate-200 py-3 px-4 rounded-xl font-bold text-xs text-left hover:border-pink-400 hover:text-pink-300 exam-btn">
                        ${idx + 1}. ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

export function checkExamAnswer(selected, correct) {
    const btns = document.querySelectorAll(".exam-btn");
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
        examScore++;
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
    }

    examIndex++;
    setTimeout(() => {
        renderExamQuestion();
    }, 900);
}
window.startExamSession = startExamSession;
window.checkExamAnswer = checkExamAnswer;
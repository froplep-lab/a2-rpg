import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

let articleQuestions = [];
let articleIndex = 0;
let articleScore = 0;

export function openArticleTrainerModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("article-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">der · die · das</div>
            <div class="text-sm font-bold text-slate-300">Тренажер рід іменників (Der / Die / Das). Визнач правильний артикль для 5 слів!</div>
            <button onclick="startArticleSession()" class="interactive-btn w-full max-w-xs mx-auto bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ ТРЕНУВАННЯ</button>
        </div>
    `;
    toggleModal("article-modal", "article-box", true);
}

export function closeArticleTrainerModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("article-modal", "article-box", false);
}

export function startArticleSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    // Filter cards that start with der, die, or das
    const nouns = cards.filter(c => c.german.startsWith('der ') || c.german.startsWith('die ') || c.german.startsWith('das '));
    articleQuestions = (nouns.length >= 5 ? nouns : cards).sort(() => Math.random() - 0.5).slice(0, 5);
    articleIndex = 0;
    articleScore = 0;
    renderArticleQuestion();
}

export function renderArticleQuestion() {
    const content = document.getElementById("article-content");
    if (!content) return;

    if (articleIndex >= articleQuestions.length) {
        const rewardXp = articleScore * 15 + 25;
        addXp(rewardXp, 'quiz');
        progressQuest('review_cards', articleScore);
        checkAchievement('vocab_master', articleScore);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">🛡️✨</div>
                <div class="text-lg font-black text-amber-400">ТРЕНУВАННЯ ЗАВЕРШЕНО!</div>
                <div class="text-sm text-slate-300">Правильних артиклів: <b>${articleScore} / ${articleQuestions.length}</b></div>
                <div class="text-xs font-bold text-pink-400">+${rewardXp} XP отримано!</div>
                <button onclick="openArticleTrainerModal()" class="interactive-btn w-full max-w-xs mx-auto bg-amber-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ ТРЕНУВАННЯ</button>
            </div>
        `;
        return;
    }

    const currentCard = articleQuestions[articleIndex];
    // Extract clean word without article if possible, e.g. "Beispiel" from "das Beispiel"
    let wordWithoutArticle = currentCard.german;
    let correctArticle = 'das';
    if (currentCard.german.startsWith('der ')) {
        correctArticle = 'der';
        wordWithoutArticle = currentCard.german.replace('der ', '');
    } else if (currentCard.german.startsWith('die ')) {
        correctArticle = 'die';
        wordWithoutArticle = currentCard.german.replace('die ', '');
    } else if (currentCard.german.startsWith('das ')) {
        correctArticle = 'das';
        wordWithoutArticle = currentCard.german.replace('das ', '');
    }

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Питання ${articleIndex + 1} / ${articleQuestions.length}</span>
                <span class="text-amber-400">Бали: ${articleScore}</span>
            </div>
            <div class="glass-panel p-5 rounded-2xl border border-amber-500/30 text-center space-y-2">
                <div class="text-2xl font-black text-white">___ ${wordWithoutArticle}</div>
                <div class="text-xs text-emerald-400 font-bold">${currentCard.ukrainian}</div>
            </div>
            <div class="grid grid-cols-3 gap-2.5">
                <button onclick="checkArticleAnswer('der', '${correctArticle}')" class="interactive-btn glass-panel border border-slate-700 text-cyan-300 py-3 rounded-xl font-black text-xs hover:border-cyan-400 article-btn">der</button>
                <button onclick="checkArticleAnswer('die', '${correctArticle}')" class="interactive-btn glass-panel border border-slate-700 text-pink-300 py-3 rounded-xl font-black text-xs hover:border-pink-400 article-btn">die</button>
                <button onclick="checkArticleAnswer('das', '${correctArticle}')" class="interactive-btn glass-panel border border-slate-700 text-amber-300 py-3 rounded-xl font-black text-xs hover:border-amber-400 article-btn">das</button>
            </div>
        </div>
    `;
}

export function checkArticleAnswer(selected, correct) {
    const btns = document.querySelectorAll(".article-btn");
    btns.forEach(btn => {
        btn.disabled = true;
        if (btn.innerText.trim() === correct) {
            btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-300");
        } else if (btn.innerText.trim() === selected) {
            btn.classList.add("border-pink-500", "bg-pink-500/20", "text-pink-300");
        } else {
            btn.classList.add("opacity-40");
        }
    });

    if (selected === correct) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        articleScore++;
        showToast('Правильний артикль! 🌟', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast(`Помилка! Правильно: ${correct}`, 'error');
    }

    articleIndex++;
    setTimeout(() => {
        renderArticleQuestion();
    }, 900);
}

window.openArticleTrainerModal = openArticleTrainerModal;
window.closeArticleTrainerModal = closeArticleTrainerModal;
window.startArticleSession = startArticleSession;
window.checkArticleAnswer = checkArticleAnswer;

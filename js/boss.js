import { cards } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { SpeechEngine, speakWord } from './speech.js';
import { currentSpeechRate } from './audio.js';
import { addXp } from './xp.js';
import { progressQuest } from './quests.js';
import { checkAchievement } from './achievements.js';
import { toggleModal, showToast } from './utils.js';

let bossHp = 100;
let bossMaxHp = 100;
let bossCurrentCard = null;
let bossScore = 0;

export function openBossRaidModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("boss-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-5xl animate-bounce">👾</div>
            <div class="text-sm font-bold text-slate-300">Кібер-Бос заблокував словникову базу B1! Переможи його, правильно відповідаючи на запитання.</div>
            <button onclick="startBossRaidSession()" class="interactive-btn w-full max-w-xs mx-auto bg-gradient-to-r from-pink-600 to-purple-600 text-white py-4 rounded-2xl font-black text-sm shadow-[0_10px_25px_rgba(236,72,153,0.4)]">ПОЧАТИ БИТВУ З БОСОМ</button>
        </div>
    `;
    toggleModal("boss-modal", "boss-box", true);
}

export function closeBossRaidModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("boss-modal", "boss-box", false);
}

export function startBossRaidSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    bossHp = 100;
    bossMaxHp = 100;
    bossScore = 0;
    nextBossQuestion();
}

export function nextBossQuestion() {
    const content = document.getElementById("boss-content");
    if (!content) return;

    if (bossHp <= 0) {
        const rewardXp = 150;
        addXp(rewardXp, 'quiz');
        progressQuest('quiz_correct', 5);
        checkAchievement('vocab_master', 50);
        AudioEngine.play('levelup');
        Haptics.trigger('success');

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-6xl">🏆🔥</div>
                <div class="text-xl font-black text-pink-400">БОСА ПЕРЕМОЖЕНО!</div>
                <div class="text-sm text-slate-300">Ти успішно звільнив німецький лексикон!</div>
                <div class="text-xs font-bold text-cyan-400">+${rewardXp} XP отримано!</div>
                <button onclick="openBossRaidModal()" class="interactive-btn w-full max-w-xs mx-auto bg-pink-600 text-white py-3.5 rounded-2xl font-black text-xs shadow-md">БИТИСЬ ЗНОВУ</button>
            </div>
        `;
        return;
    }

    bossCurrentCard = cards[Math.floor(Math.random() * cards.length)];
    const wrongOptions = cards.filter(c => c.ukrainian !== bossCurrentCard.ukrainian)
                              .sort(() => Math.random() - 0.5)
                              .slice(0, 3)
                              .map(c => c.ukrainian);
    const options = [...wrongOptions, bossCurrentCard.ukrainian].sort(() => Math.random() - 0.5);

    const hpPercent = Math.max(0, (bossHp / bossMaxHp) * 100);

    content.innerHTML = `
        <div class="space-y-4">
            <!-- Boss Header & HP bar -->
            <div class="glass-panel p-4 rounded-2xl border border-pink-500/40 space-y-2 text-center">
                <div class="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>👾 Кібер-Бос (B1 Leviathan)</span>
                    <span class="text-pink-400 font-black">${bossHp} / ${bossMaxHp} HP</span>
                </div>
                <div class="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-pink-500/30">
                    <div class="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-300" style="width: ${hpPercent}%"></div>
                </div>
            </div>

            <!-- Question Card -->
            <div class="glass-panel p-5 rounded-2xl border border-cyan-500/30 text-center space-y-3">
                <div class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Атака німецьким словом</div>
                <div class="text-2xl font-black text-white">${bossCurrentCard.german}</div>
                <div class="text-xs text-slate-400 italic">${bossCurrentCard.grammar || ''}</div>
            </div>

            <!-- Options -->
            <div class="grid grid-cols-1 gap-2.5">
                ${options.map(opt => `
                    <button onclick="checkBossAnswer('${opt.replace(/'/g, "\\'")}', '${bossCurrentCard.ukrainian.replace(/'/g, "\\'")}')" class="interactive-btn glass-panel border border-slate-700 text-slate-200 py-3.5 px-4 rounded-xl font-bold text-xs hover:border-pink-500 boss-opt-btn text-left flex justify-between items-center">
                        <span>${opt}</span>
                        <i class="fa-solid fa-sword text-xs text-pink-500"></i>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

export function checkBossAnswer(selected, correct) {
    const btns = document.querySelectorAll(".boss-opt-btn");
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
        bossHp = Math.max(0, bossHp - 25);
        showToast('Критичний удар по босу! -25 HP ⚔️', 'success');
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast(`Помилка! Бос контратакує! Правильно: ${correct}`, 'error');
    }

    setTimeout(() => {
        nextBossQuestion();
    }, 1200);
}

window.openBossRaidModal = openBossRaidModal;
window.closeBossRaidModal = closeBossRaidModal;
window.startBossRaidSession = startBossRaidSession;
window.checkBossAnswer = checkBossAnswer;

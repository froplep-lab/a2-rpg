import { StorageEngine } from './storage.js';
import { addXp } from './xp.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { showToast } from './utils.js';

export let dailyQuests = [];
export let dailyBonusClaimed = false;

function getDailyQuestsConfig(dateStr) {
    const pool = [
        { id: 'learn_words', title: 'Вивчи нові слова', desc: 'Зламай душу нових слів', target: 5, reward: 50, unit: 'слів' },
        { id: 'review_cards', title: 'Повтори картки', desc: 'Гортай та вивчай картки', target: 15, reward: 40, unit: 'карток' },
        { id: 'complete_exam', title: 'B1 Challenge', desc: 'Пройди симулятор іспиту B1', target: 1, reward: 100, unit: 'тест' },
        { id: 'listen_words', title: 'Аудіо тренування', desc: 'Прослухай вимову слів', target: 5, reward: 30, unit: 'разів' },
        { id: 'bookmark_words', title: 'Колекціонер зірок', desc: 'Додай слова в обране', target: 3, reward: 35, unit: 'слів' }
    ];
    
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
    }
    hash = Math.abs(hash);
    
    const selected = [];
    const poolCopy = [...pool];
    for (let i = 0; i < 3 && poolCopy.length > 0; i++) {
        const index = (hash + i * 7) % poolCopy.length;
        selected.push(poolCopy.splice(index, 1)[0]);
    }
    return selected;
}

export function initQuests() {
    const today = new Date().toISOString().slice(0, 10);
    const savedDate = StorageEngine.get('a2_daily_date', '');
    const savedQuests = StorageEngine.get('a2_daily_quests', null);
    dailyBonusClaimed = StorageEngine.get('a2_daily_bonus_claimed', false);

    if (savedDate !== today || !savedQuests || savedQuests.length === 0) {
        const config = getDailyQuestsConfig(today);
        dailyQuests = config.map(q => ({
            id: q.id,
            title: q.title,
            desc: q.desc,
            target: q.target,
            reward: q.reward,
            unit: q.unit,
            current: 0,
            claimed: false
        }));
        dailyBonusClaimed = false;
        StorageEngine.set('a2_daily_date', today);
        StorageEngine.set('a2_daily_quests', dailyQuests);
        StorageEngine.set('a2_daily_bonus_claimed', false);
    } else {
        dailyQuests = savedQuests;
    }
    renderQuestsUI();
}

export function saveQuestsState() {
    StorageEngine.set('a2_daily_quests', dailyQuests);
    StorageEngine.set('a2_daily_bonus_claimed', dailyBonusClaimed);
}

export function progressQuest(questId, amount = 1) {
    const today = new Date().toISOString().slice(0, 10);
    const savedDate = StorageEngine.get('a2_daily_date', '');
    if (savedDate !== today) {
        initQuests();
    }

    let updated = false;
    dailyQuests.forEach(q => {
        if (q.id === questId && !q.claimed) {
            const prev = q.current;
            q.current = Math.min(q.target, q.current + amount);
            if (q.current !== prev) {
                updated = true;
            }
        }
    });

    if (updated) {
        saveQuestsState();
        renderQuestsUI();
    }
}

export function claimQuestReward(index) {
    const q = dailyQuests[index];
    if (!q || q.claimed || q.current < q.target) return;

    q.claimed = true;
    saveQuestsState();
    addXp(q.reward);
    AudioEngine.play('success');
    Haptics.trigger('success');
    showToast(`🎉 Квест виконано! +${q.reward} XP`, 'success');
    renderQuestsUI();
}

export function claimBonusReward() {
    if (dailyBonusClaimed) return;
    const allClaimed = dailyQuests.every(q => q.claimed);
    if (!allClaimed) return;

    dailyBonusClaimed = true;
    saveQuestsState();
    addXp(100);
    AudioEngine.play('levelup');
    Haptics.trigger('success');
    if (typeof confetti === 'function') {
        confetti({ particleCount: 250, spread: 180, origin: { y: 0.5 }, colors: ['#fcd34d', '#ec4899', '#06b6d4'] });
    }
    showToast(`🏆 ЩОДЕННИЙ БОНУС ОТРИМАНО! +100 XP`, 'success');
    renderQuestsUI();
}

export function renderQuestsUI() {
    const listEl = document.getElementById("daily-quests-list");
    const statusEl = document.getElementById("daily-quests-status");
    if (!listEl) return;

    const completedCount = dailyQuests.filter(q => q.current >= q.target).length;
    if (statusEl) {
        statusEl.innerText = `${completedCount}/${dailyQuests.length} виконано`;
    }

    listEl.innerHTML = dailyQuests.map((q, idx) => {
        const isReady = q.current >= q.target && !q.claimed;
        const isClaimed = q.claimed;

        const totalBlocks = 10;
        const filledBlocks = Math.round((q.current / q.target) * totalBlocks);
        const barStr = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

        return `
            <div class="bg-slate-900/50 p-3 rounded-2xl border ${isClaimed ? 'border-emerald-500/30 bg-emerald-950/10' : isReady ? 'border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'border-slate-800'} space-y-2">
                <div class="flex justify-between items-center text-xs">
                    <div class="font-black text-white flex items-center gap-1.5">
                        <span>${q.title}</span>
                        ${isClaimed ? '<i class="fa-solid fa-circle-check text-emerald-400 text-xs"></i>' : ''}
                    </div>
                    <div class="font-bold text-pink-400 text-[11px]">+${q.reward} XP</div>
                </div>
                <div class="text-[11px] text-slate-400">${q.desc}</div>
                <div class="flex items-center justify-between gap-3 pt-1">
                    <div class="flex-1">
                        <div class="text-[10px] font-mono text-cyan-400 tracking-wider">${barStr}</div>
                        <div class="text-[10px] text-slate-400 font-bold mt-0.5">${q.current} / ${q.target} ${q.unit}</div>
                    </div>
                    <div>
                        ${isClaimed ? 
                            `<span class="text-[10px] font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ЗАБРАНО</span>` :
                            isReady ?
                            `<button onclick="claimQuestReward(${idx})" class="interactive-btn px-4 py-1.5 rounded-xl font-black text-[10px] bg-pink-500 text-white shadow-[0_5px_15px_rgba(236,72,153,0.4)] animate-pulse">ЗАБРАТИ</button>` :
                            `<span class="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500">В ПРОЦЕСІ</span>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const bonusContainer = document.getElementById("daily-bonus-container");
    if (bonusContainer) {
        const allCompleted = dailyQuests.every(q => q.current >= q.target);
        const allClaimed = dailyQuests.every(q => q.claimed);

        if (allCompleted) {
            bonusContainer.classList.remove("hidden");
            bonusContainer.innerHTML = `
                <div class="bg-gradient-to-r from-pink-950/60 to-purple-950/60 p-3.5 rounded-2xl border border-pink-500/50 flex items-center justify-between shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                    <div class="flex items-center gap-2.5">
                        <span class="text-2xl">🏆</span>
                        <div>
                            <div class="text-xs font-black text-pink-300">БОНУС ЗА ВСІ КВЕСТИ</div>
                            <div class="text-[10px] text-slate-300">+100 XP бонус за виконання</div>
                        </div>
                    </div>
                    <div>
                        ${dailyBonusClaimed ?
                            `<span class="text-[10px] font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">БОНУС ЗАБРАНО</span>` :
                            allClaimed ?
                            `<button onclick="claimBonusReward()" class="interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md animate-bounce">ЗАБРАТИ БОНУС</button>` :
                            `<span class="text-[10px] font-bold text-slate-400 text-[10px]">Заберіть усі квести</span>`
                        }
                    </div>
                </div>
            `;
        } else {
            bonusContainer.classList.add("hidden");
        }
    }
}

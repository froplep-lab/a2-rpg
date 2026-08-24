import { StorageEngine } from './storage.js';
import { addXp } from './xp.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { showToast } from './utils.js';

export let achievements = [
    { id: 'first_hack', title: '⚡ Перший хак', desc: 'Зламай душу першого слова німецької мови', target: 1, current: 0, reward: 30, unlocked: false },
    { id: 'streak_3', title: '🔥 Постійний агент', desc: 'Підтримуй стрік протягом 3 днів', target: 3, current: 0, reward: 50, unlocked: false },
    { id: 'vocab_master', title: '🧠 Кібер-лексикон', desc: 'Зламай душі 10 різних слів', target: 10, current: 0, reward: 75, unlocked: false },
    { id: 'exam_pass', title: '🎓 Дипломований агент', desc: 'Успішно склади симулятор B1 іспиту', target: 1, current: 0, reward: 100, unlocked: false },
    { id: 'collector', title: '⭐️ Колекціонер', desc: 'Додай 5 слів до обраного', target: 5, current: 0, reward: 40, unlocked: false }
];

export function initAchievements() {
    const saved = StorageEngine.get('a2_achievements', null);
    if (saved && Array.isArray(saved)) {
        achievements.forEach(a => {
            const found = saved.find(s => s.id === a.id);
            if (found) {
                a.current = found.current;
                a.unlocked = found.unlocked;
            }
        });
    }
    saveAchievements();
}

export function saveAchievements() {
    StorageEngine.set('a2_achievements', achievements.map(a => ({ id: a.id, current: a.current, unlocked: a.unlocked })));
}

export function checkAchievement(id, val = 1, absolute = false) {
    const ach = achievements.find(a => a.id === id);
    if (!ach || ach.unlocked) return;

    if (absolute) {
        ach.current = Math.max(ach.current, val);
    } else {
        ach.current += val;
    }

    if (ach.current >= ach.target) {
        ach.current = ach.target;
        ach.unlocked = true;
        addXp(ach.reward);
        AudioEngine.play('levelup');
        Haptics.trigger('success');
        if (typeof confetti === 'function') {
            confetti({ particleCount: 200, spread: 150, origin: { y: 0.5 }, colors: ['#06b6d4', '#fcd34d', '#ec4899'] });
        }
        showToast(`🏆 ДОСЯГНЕННЯ РОЗБЛОКОВАНО: ${ach.title}! +${ach.reward} XP`, 'success');
    }
    saveAchievements();
    if (typeof window.renderAchievementsUI === 'function') {
        window.renderAchievementsUI();
    }
}

export function renderAchievementsModalContent() {
    const container = document.getElementById("achievements-modal-content");
    if (!container) return;

    container.innerHTML = achievements.map(a => `
        <div class="glass-panel p-3.5 rounded-2xl border ${a.unlocked ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'} space-y-2">
            <div class="flex justify-between items-center text-xs">
                <span class="font-black text-white flex items-center gap-1.5">
                    ${a.title}
                    ${a.unlocked ? '<i class="fa-solid fa-circle-check text-emerald-400"></i>' : ''}
                </span>
                <span class="font-bold text-pink-400">+${a.reward} XP</span>
            </div>
            <div class="text-[11px] text-slate-400">${a.desc}</div>
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>Прогрес: ${a.current} / ${a.target}</span>
                <span class="${a.unlocked ? 'text-emerald-400 font-black' : 'text-cyan-400'}">${a.unlocked ? 'ВИКОНАНО' : 'В ПРОЦЕСІ'}</span>
            </div>
        </div>
    `).join('');
}

import { toggleModal } from './utils.js';

export function openAchievementsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    renderAchievementsModalContent();
    toggleModal("achievements-modal", "achievements-box", true);
}

export function closeAchievementsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("achievements-modal", "achievements-box", false);
}

window.openAchievementsModal = openAchievementsModal;
window.closeAchievementsModal = closeAchievementsModal;

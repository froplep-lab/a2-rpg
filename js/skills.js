import { hero } from './state.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { StorageEngine } from './storage.js';
import { toggleModal, showToast } from './utils.js';

let unlockedSkills = new Set(StorageEngine.get('a2_unlocked_skills') || []);

const SKILLS = [
    { id: 'xp_boost', name: 'Нейро-прискорювач', desc: '+25% більше XP за всі завдання та дуелі', costLevel: 2, icon: '⚡' },
    { id: 'streak_shield', name: 'Кібер-щит стріку', desc: 'Зберігає стрік при пропуску одного дня', costLevel: 3, icon: '🛡️' },
    { id: 'exam_master', name: 'Дипломат B1', desc: 'Додаткова підказка в симуляторі іспиту', costLevel: 4, icon: '🎓' },
    { id: 'master_reward', name: 'Гроссмейстер', desc: 'Подвійна нагорода за зламані душі слів', costLevel: 5, icon: '👑' }
];

export function openSkillTreeModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    renderSkillTreeContent();
    toggleModal("skills-modal", "skills-box", true);
}

export function closeSkillTreeModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("skills-modal", "skills-box", false);
}

export function renderSkillTreeContent() {
    const content = document.getElementById("skills-content");
    if (!content) return;

    content.innerHTML = `
        <div class="space-y-3">
            <div class="text-xs font-bold text-slate-300 text-center mb-2">Прокачуй пасивні навички агента за допомогою рівня (LVL)!</div>
            <div class="space-y-2.5">
                ${SKILLS.map(skill => {
                    const isUnlocked = unlockedSkills.has(skill.id);
                    const canUnlock = hero.level >= skill.costLevel && !isUnlocked;
                    return `
                        <div class="glass-panel p-3.5 rounded-2xl border ${isUnlocked ? 'border-cyan-500/50 bg-cyan-950/20' : canUnlock ? 'border-amber-500/50' : 'border-slate-800 opacity-60'} flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">${skill.icon}</span>
                                <div>
                                    <div class="text-xs font-black text-white">${skill.name}</div>
                                    <div class="text-[11px] text-slate-300">${skill.desc}</div>
                                    <div class="text-[10px] text-cyan-400 font-bold mt-1">Потрібен LVL ${skill.costLevel}</div>
                                </div>
                            </div>
                            <div>
                                ${isUnlocked ? '<span class="text-xs font-black text-cyan-400">АКТИВНО ✓</span>' : `<button onclick="unlockSkill('${skill.id}', ${skill.costLevel})" ${!canUnlock ? 'disabled' : ''} class="interactive-btn px-3 py-2 rounded-xl text-xs font-black ${canUnlock ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">ВЧИТИ</button>`}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

export function unlockSkill(skillId, costLevel) {
    if (hero.level < costLevel) {
        showToast("Недостатній рівень агента!", "error");
        AudioEngine.play('error');
        Haptics.trigger('error');
        return;
    }

    unlockedSkills.add(skillId);
    StorageEngine.set('a2_unlocked_skills', Array.from(unlockedSkills));
    AudioEngine.play('levelup');
    Haptics.trigger('success');
    showToast("Навичку успішно розблоковано! 🌟", "success");
    renderSkillTreeContent();
}

window.openSkillTreeModal = openSkillTreeModal;
window.closeSkillTreeModal = closeSkillTreeModal;
window.unlockSkill = unlockSkill;

import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { getXp, getLevel } from './xp.js';
import { StorageEngine } from './storage.js';
import { toggleModal, showToast } from './utils.js';

const TITLES = [
    { level: 1, title: "Рекрут (Anfänger)", desc: "Початковий агент мовного фронту" },
    { level: 3, title: "Оператор A2 (Agent)", desc: "Впевнено орієнтується в базовій німецькій" },
    { level: 5, title: "Шпигун лексики (Wort-Sniper)", desc: "Майстер словарного запасу та артиклів" },
    { level: 8, title: "Кібер-Поліглот (Cyber-Polyglot)", desc: "Елітний агент підготовки до іспиту B1" },
    { level: 12, title: "Майстер Штучного Інтелекту (KI-Meister)", desc: "Легенда німецької мови та RPG студії" }
];

let currentAgentTitle = StorageEngine.get('a2_agent_title') || TITLES[0].title;

export function openProfileModal() {
    AudioEngine.path && AudioEngine.play('click');
    Haptics.trigger('light');

    const xp = getXp();
    const level = getLevel();
    const unlockedTitles = TITLES.filter(t => level >= t.level);
    currentAgentTitle = StorageEngine.get('a2_agent_title') || unlockedTitles[unlockedTitles.length - 1].title;

    document.getElementById("profile-content").innerHTML = `
        <div class="space-y-4">
            <div class="glass-panel p-5 rounded-3xl border border-cyan-500/40 text-center space-y-3 bg-slate-950/70">
                <div class="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-3xl mx-auto shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    🛡️
                </div>
                <div>
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Оперативний позивний</div>
                    <div class="text-lg font-black text-white mt-0.5">Агент Микола</div>
                    <div class="text-xs font-bold text-cyan-400 mt-1">${currentAgentTitle}</div>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div class="text-slate-300">Рівень: <b class="text-cyan-400">LVL ${level}</b></div>
                    <div class="text-slate-300">Досвід: <b class="text-pink-400">${xp} XP</b></div>
                </div>
            </div>

            <div class="space-y-2">
                <div class="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Доступні звання оператора:</div>
                <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    ${TITLES.map(t => {
                        const isUnlocked = level >= t.level;
                        const isSelected = currentAgentTitle === t.title;
                        return `
                            <div class="glass-panel p-3 rounded-2xl border ${isSelected ? 'border-cyan-400 bg-cyan-950/30' : isUnlocked ? 'border-slate-700' : 'border-slate-800 opacity-50'} flex justify-between items-center">
                                <div>
                                    <div class="text-xs font-black ${isUnlocked ? 'text-white' : 'text-slate-500'}">${t.title}</div>
                                    <div class="text-[10px] text-slate-400">${t.desc} (LVL ${t.level}+)</div>
                                </div>
                                ${isUnlocked ? `
                                    <button onclick="selectAgentTitle('${t.title.replace(/'/g, "\\'")}')" class="interactive-btn px-3 py-1.5 rounded-xl text-[10px] font-black ${isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-cyan-300 border border-cyan-500/30'}">
                                        ${isSelected ? 'АКТИВНО' : 'ВИБРАТИ'}
                                    </button>
                                ` : `
                                    <span class="text-[10px] text-slate-600 font-bold">БЛОК</span>
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    toggleModal("profile-modal", "profile-box", true);
}

export function closeProfileModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("profile-modal", "profile-box", false);
}

export function selectAgentTitle(title) {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    currentAgentTitle = title;
    StorageEngine.set('a2_agent_title', title);
    showToast(`Звання змінено на: ${title} 🎖️`, 'success');
    openProfileModal();
}

window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.selectAgentTitle = selectAgentTitle;

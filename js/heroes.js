import { StorageEngine } from './storage.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { showToast } from './utils.js';

export let heroesList = [
    { id: 'sky', name: 'Скай', title: 'Спритний розвідник', emoji: '🏹', bonus: '+10% XP за повторення карток', active: false },
    { id: 'ronan', name: 'Ронан', title: 'Лицар таверни', emoji: '🛡️', bonus: '+15% XP за зламані душі слів', active: true },
    { id: 'bell', name: 'Белл', title: 'Маг знань', emoji: '✨', bonus: '+20% XP за іспити та бліци', active: false }
];

export let activeHeroId = StorageEngine.get('a2_active_hero', 'ronan');

export function initHeroes() {
    const saved = StorageEngine.get('a2_active_hero', null);
    if (saved) {
        activeHeroId = saved;
    }
    heroesList.forEach(h => {
        h.active = (h.id === activeHeroId);
    });
}

export function setActiveHero(heroId) {
    activeHeroId = heroId;
    heroesList.forEach(h => {
        h.active = (h.id === heroId);
    });
    StorageEngine.set('a2_active_hero', activeHeroId);
    AudioEngine.play('success');
    Haptics.trigger('success');
    const hero = heroesList.find(h => h.id === heroId);
    showToast(`🍻 Герой таверни обраний: ${hero.emoji} ${hero.name}!`, 'success');
    renderHeroesModalContent();
}

export function getXpMultiplier(actionType) {
    if (activeHeroId === 'sky' && actionType === 'review') return 1.1;
    if (activeHeroId === 'ronan' && actionType === 'master') return 1.15;
    if (activeHeroId === 'bell' && (actionType === 'exam' || actionType === 'quiz')) return 1.2;
    return 1.0;
}

export function renderHeroesModalContent() {
    const container = document.getElementById("heroes-modal-content");
    if (!container) return;

    container.innerHTML = heroesList.map(h => `
        <div onclick="selectHero('${h.id}')" class="interactive-btn glass-panel p-4 rounded-2xl border ${h.active ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-slate-800'} flex items-center justify-between cursor-pointer">
            <div class="flex items-center gap-3">
                <span class="text-3xl">${h.emoji}</span>
                <div>
                    <div class="text-xs font-black text-white">${h.name} — <span class="text-cyan-400">${h.title}</span></div>
                    <div class="text-[10px] text-slate-300 mt-0.5">${h.bonus}</div>
                </div>
            </div>
            <div>
                ${h.active ? '<span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-cyan-400 text-slate-950">АКТИВНИЙ</span>' : '<span class="text-[10px] font-bold text-slate-400 px-2 py-1">ВИБРАТИ</span>'}
            </div>
        </div>
    `).join('');
}

window.selectHero = setActiveHero;

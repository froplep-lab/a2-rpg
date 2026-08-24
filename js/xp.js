import { checkAchievement } from './achievements.js';
import { getXpMultiplier } from './heroes.js';
import { hero } from './state.js';
import { StorageEngine } from './storage.js';
import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { showToast } from './utils.js';

export function updateHeroUI() {
    const lvlEl = document.getElementById("hero-level-label");
    const streakEl = document.getElementById("hero-streak-label");
    if (lvlEl) lvlEl.innerText = `LVL ${hero.level}`;
    if (streakEl) streakEl.innerText = `${hero.streak}x`;
}

export function addXp(amount, actionType = 'default') {
    const multiplier = getXpMultiplier(actionType);
    const finalAmount = Math.round(amount * multiplier);

    hero.xp += finalAmount;
    const requiredXp = hero.level * 150;
    if (hero.xp >= requiredXp) {
        hero.level++;
        hero.xp -= requiredXp;
        AudioEngine.play('levelup');
        Haptics.trigger('success');
        if (typeof confetti === 'function') {
            confetti({ particleCount: 300, spread: 200, origin: { y: 0.5 }, colors: ['#06b6d4', '#ec4899', '#fcd34d'] });
        }
        showToast(`🎉 РІВЕНЬ ПІДНЯТО! Новий рівень: ${hero.level}`, 'success');
    } else {
        const bonusStr = multiplier > 1.0 ? ` (з бонусом героя!)` : '';
        showToast(`+${finalAmount} XP отримано${bonusStr}`, 'info');
    }
    StorageEngine.set('a2_hero', hero);
    updateHeroUI();
}

export function checkDailyLoginBonus() {
    const today = new Date().toDateString();
    const lastLogin = StorageEngine.get('a2_last_login', '');
    if (lastLogin !== today) {
        StorageEngine.set('a2_last_login', today);
        hero.streak++;
        addXp(50, 'default');
        checkAchievement('streak_3', hero.streak, true);
        showToast(`🔥 ЩОДЕННИЙ ВХІД! Стрік: ${hero.streak}x | +50 XP`, 'success');
        StorageEngine.set('a2_hero', hero);
        updateHeroUI();
    }
}

export function getXp() { return hero.xp || 0; }
export function getLevel() { return hero.level || 1; }

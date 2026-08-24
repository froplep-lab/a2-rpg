import { cards, masteredWords, bookmarkedWords, hero } from './state.js';
import { AudioEngine } from './audio.js';
import { toggleModal, showToast } from './utils.js';

export function openSoundSettingsModal() { AudioEngine.play('click'); toggleModal("sound-settings-modal", "sound-box", true); }
export function closeSoundSettingsModal() { AudioEngine.play('click'); toggleModal("sound-settings-modal", "sound-box", false); }

export function openStatsModal() {
    AudioEngine.play('click');
    document.getElementById("stat-mastered-count").innerText = `${masteredWords.size} / ${cards.length || 84}`;
    document.getElementById("stat-streak-count").innerText = `${hero.streak}x`;
    document.getElementById("stat-level").innerText = `LVL ${hero.level}`;
    document.getElementById("stat-xp").innerText = `${hero.xp} XP`;
    document.getElementById("stat-bookmarks").innerText = bookmarkedWords.size;
    toggleModal("stats-modal", "stats-box", true);
}
export function closeStatsModal() { AudioEngine.play('click'); toggleModal("stats-modal", "stats-box", false); }

export function exportProgress() {
    AudioEngine.play('click');
    try {
        const backup = {};
        Object.keys(localStorage).filter(k => k.startsWith('a2_')).forEach(k => backup[k] = localStorage.getItem(k));
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `a2_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        a.remove();
    } catch (e) {
        showToast('Помилка експорту даних', 'error');
    }
}

export function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm("⚠️ Замінити поточний прогрес даними з файлу?")) {
                Object.keys(data).forEach(k => { if (k.startsWith('a2_')) localStorage.setItem(k, data[k]); });
                window.location.reload();
            }
        } catch (err) {
            showToast('Пошкоджений файл резервної копії', 'error');
        }
    };
    reader.readAsText(file);
}
import { initAchievements, renderAchievementsModalContent } from './achievements.js';

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
window.renderAchievementsUI = renderAchievementsModalContent;

import { initHeroes, renderHeroesModalContent } from './heroes.js';

export function openHeroesModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    renderHeroesModalContent();
    toggleModal("heroes-modal", "heroes-box", true);
}

export function closeHeroesModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("heroes-modal", "heroes-box", false);
}

window.openHeroesModal = openHeroesModal;
window.closeHeroesModal = closeHeroesModal;

import { cards, masteredWords, bookmarkedWords, hero } from './state.js';
import { AudioEngine } from './audio.js';
import { toggleModal, showToast } from './utils.js';

export function openSoundSettingsModal() { AudioEngine.play('click'); toggleModal("sound-settings-modal", "sound-box", true); }
export function closeSoundSettingsModal() { AudioEngine.play('click'); toggleModal("sound-settings-modal", "sound-box", false); }

export function openStatsModal() {
    AudioEngine.play('click');
    const total = cards && cards.length > 0 ? cards.length : 16;
    const masteredEl = document.getElementById("stat-mastered-count");
    const streakEl = document.getElementById("stat-streak-count");
    const levelEl = document.getElementById("stat-level");
    const xpEl = document.getElementById("stat-xp");
    const bookmarksEl = document.getElementById("stat-bookmarks");

    if (masteredEl) masteredEl.innerText = `${masteredWords.size} / ${total}`;
    if (streakEl) streakEl.innerText = `${hero.streak}x`;
    if (levelEl) levelEl.innerText = `LVL ${hero.level}`;
    if (xpEl) xpEl.innerText = `${hero.xp} XP`;
    if (bookmarksEl) bookmarksEl.innerText = bookmarkedWords.size;

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

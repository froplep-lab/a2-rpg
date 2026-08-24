import { AudioEngine } from './audio.js';
import { Haptics } from './telegram.js';
import { getProgress, setProgress } from './storage.js';
import { showToast, toggleModal } from './utils.js';
import { cards, currentIndex, bookmarks, setBookmarks } from './state.js';
import { updateCard } from './cards.js';

export function openSoundSettingsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("sound-settings-modal", "sound-box", true);
}

export function closeSoundSettingsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("sound-settings-modal", "sound-box", false);
}

export function openStatsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    
    const masteredEl = document.getElementById("stat-mastered-count");
    const streakEl = document.getElementById("stat-streak-count");
    const levelEl = document.getElementById("stat-level");
    const xpEl = document.getElementById("stat-xp");
    const bookmarksEl = document.getElementById("stat-bookmarks");

    const p = getProgress();
    if (masteredEl) masteredEl.innerText = `${p.masteredWords ? p.masteredWords.length : 0} / ${cards.length}`;
    if (streakEl) streakEl.innerText = `${p.streak || 0}x`;
    if (levelEl) levelEl.innerText = `LVL ${p.level || 1}`;
    if (xpEl) xpEl.innerText = `${p.xp || 0} XP`;
    if (bookmarksEl) bookmarksEl.innerText = `${bookmarks.size}`;

    toggleModal("stats-modal", "stats-box", true);
}

export function closeStatsModal() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("stats-modal", "stats-box", false);
}

export function exportProgress() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    try {
        const data = getProgress();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DE-B1-RPG-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Прогрес успішно експортовано! 📦", "success");
    } catch (e) {
        showToast("Помилка експорту прогресу", "error");
    }
}

export function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data && typeof data === 'object') {
                setProgress(data);
                AudioEngine.play('levelup');
                Haptics.trigger('success');
                showToast("Прогрес успішно імпортовано! Оновлюємо...", "success");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error("Invalid JSON structure");
            }
        } catch (err) {
            AudioEngine.play('error');
            Haptics.trigger('error');
            showToast("Невірний формат файлу резервної копії", "error");
        }
    };
    reader.readAsText(file);
}

window.openSoundSettingsModal = openSoundSettingsModal;
window.closeSoundSettingsModal = closeSoundSettingsModal;
window.openStatsModal = openStatsModal;
window.closeStatsModal = closeStatsModal;
window.exportProgress = exportProgress;
window.importProgress = importProgress;

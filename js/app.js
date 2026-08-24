import { TelegramBridge } from './telegram.js';
import { AudioEngine, toggleAudioMute, updateAudioVolume, toggleAutoSpeak, toggleSpeechRate, syncSoundUI } from './audio.js';
import { speakWord } from './speech.js';
import { setCards } from './state.js';
import { updateHeroUI, checkDailyLoginBonus } from './xp.js';
import { updateCard, flipCard, nextCard, prevCard, attackEnemyClick, toggleBookmark } from './cards.js';
import { switchDisplayMode, filterCompactWords, clearCompactSearch, setRarityFilter } from './vocabulary.js';
import { openExamSimulator, closeExamSimulator } from './exam.js';
import { openSoundSettingsModal, closeSoundSettingsModal, openStatsModal, closeStatsModal, exportProgress, importProgress } from './ui.js';

window.toggleAudioMute = toggleAudioMute;
window.updateAudioVolume = updateAudioVolume;
window.toggleAutoSpeak = toggleAutoSpeak;
window.toggleSpeechRate = toggleSpeechRate;
window.speakWord = speakWord;
window.flipCard = flipCard;
window.nextCard = nextCard;
window.prevCard = prevCard;
window.attackEnemyClick = attackEnemyClick;
window.toggleBookmark = toggleBookmark;
window.switchDisplayMode = switchDisplayMode;
window.filterCompactWords = filterCompactWords;
window.clearCompactSearch = clearCompactSearch;
window.setRarityFilter = setRarityFilter;
window.openExamSimulator = openExamSimulator;
window.closeExamSimulator = closeExamSimulator;
window.openSoundSettingsModal = openSoundSettingsModal;
window.closeSoundSettingsModal = closeSoundSettingsModal;
window.openStatsModal = openStatsModal;
window.closeStatsModal = closeStatsModal;
window.exportProgress = exportProgress;
window.importProgress = importProgress;

document.addEventListener('DOMContentLoaded', async () => {
    TelegramBridge.init();

    try {
        const res = await fetch('data/words.json');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCards(Array.isArray(data) && data.length > 0 ? data : [{ german: "das Beispiel", grammar: "Nomen", ukrainian: "приклад", hint: "Демонстрація", emoji: "📌", sentence: "Das ist ein Beispiel." }]);
    } catch (e) {
        setCards([{ german: "der Fehler", grammar: "Nomen", ukrainian: "помилка", hint: "Проблема", emoji: "⚠️", sentence: "Ein Fehler ist aufgetreten." }]);
    }

    checkDailyLoginBonus();
    syncSoundUI();
    updateHeroUI();
    updateCard();

    document.addEventListener('click', () => { AudioEngine.init(); }, { once: true });
});

window.addEventListener('keydown', (e) => {
    if (document.querySelector('.fixed.inset-0:not(.pointer-events-none)')) {
        if (e.key === 'Escape') {
            closeSoundSettingsModal();
            closeStatsModal();
            closeExamSimulator();
        }
        return;
    }
    const gameView = document.getElementById("game-view-container");
    if (gameView && !gameView.classList.contains("hidden")) {
        if (e.key === 'ArrowRight' || e.key === 'd') nextCard();
        else if (e.key === 'ArrowLeft' || e.key === 'a') prevCard();
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
        else if (e.key === 's' || e.key === 'і') { e.preventDefault(); speakWord(); }
    }
});
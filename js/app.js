import { initHeroes } from './heroes.js';
import { openQuizModal, closeQuizModal, startQuickQuiz, checkQuizAnswer } from './quiz.js';
import { initAchievements } from './achievements.js';
import { TelegramBridge } from './telegram.js';
import { AudioEngine, toggleAudioMute, updateAudioVolume, toggleAutoSpeak, toggleSpeechRate, syncSoundUI } from './audio.js';
import { speakWord } from './speech.js';
import { setCards } from './state.js';
import { updateHeroUI, checkDailyLoginBonus } from './xp.js';
import { updateCard, flipCard, nextCard, prevCard, attackEnemyClick, toggleBookmark } from './cards.js';
import { switchDisplayMode, filterCompactWords, clearCompactSearch, setRarityFilter } from './vocabulary.js';
import { openExamSimulator, closeExamSimulator } from './exam.js';
import { openSoundSettingsModal, closeSoundSettingsModal, openStatsModal, closeStatsModal, exportProgress, importProgress } from './ui.js';
import { initQuests, claimQuestReward, claimBonusReward } from './quests.js';

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
window.claimQuestReward = claimQuestReward;
window.claimBonusReward = claimBonusReward;

document.addEventListener('DOMContentLoaded', async () => {
    TelegramBridge.init();
    initQuests();
    initAchievements();
    initHeroes();

    try {
        const res = await fetch('data/words.json');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCards(Array.isArray(data) && data.length > 0 ? data : [{ german: "das Beispiel", grammar: "Nomen, n.", ukrainian: "приклад", hint: "Демонстрація чогось", sentence: "Das ist ein Beispiel.", emoji: "📌", rarity: "звичайний" }]);
    } catch (e) {
        setCards([{ german: "das Beispiel", grammar: "Nomen, n.", ukrainian: "приклад", hint: "Демонстрація чогось", sentence: "Das ist ein Beispiel.", emoji: "📌", rarity: "звичайний" }]);
    }

    checkDailyLoginBonus();
    updateCard();
    syncSoundUI();
});

window.openQuizModal = openQuizModal;
window.closeQuizModal = closeQuizModal;
window.startQuickQuiz = startQuickQuiz;
window.checkQuizAnswer = checkQuizAnswer;

import { progressQuest } from './quests.js';
import { cards, currentIndex } from './state.js';
import { currentSpeechRate } from './audio.js';
import { showToast } from './utils.js';

export const SpeechEngine = {
    isSupported() {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    },
    
    cancel() {
        if (this.isSupported()) {
            try {
                window.speechSynthesis.cancel();
                if (window._speechTimeout) {
                    clearTimeout(window._speechTimeout);
                    window._speechTimeout = null;
                }
            } catch (e) {}
        }
    },

    speak(text, rate = 0.9, onStart = null, onEnd = null) {
        if (!this.isSupported()) {
            if (onEnd) onEnd();
            return;
        }

        this.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = rate;
        utterance.pitch = 1.0;

        const setBestVoice = () => {
            try {
                const voices = window.speechSynthesis.getVoices();
                if (voices && voices.length > 0) {
                    const deVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('de'));
                    const bestVoice = deVoices.find(v => v.lang.toLowerCase() === 'de-DE' || v.lang.toLowerCase() === 'de_de') ||
                                      deVoices[0] ||
                                      voices.find(v => v.name && v.name.toLowerCase().includes('german'));
                    if (bestVoice) {
                        utterance.voice = bestVoice;
                    }
                }
            } catch (e) {}
        };

        setBestVoice();
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                setBestVoice();
                window.speechSynthesis.onvoiceschanged = null;
            };
        }

        utterance.onstart = () => {
            document.querySelectorAll('.speech-active-indicator').forEach(el => el.classList.add('text-cyan-400'));
            if (onStart) onStart();
        };

        utterance.onend = () => {
            document.querySelectorAll('.speech-active-indicator').forEach(el => el.classList.remove('text-cyan-400'));
            if (onEnd) onEnd();
        };

        utterance.onerror = () => {
            document.querySelectorAll('.speech-active-indicator').forEach(el => el.classList.remove('text-cyan-400'));
            if (onEnd) onEnd();
        };

        window._currentUtterance = utterance;
        
        window._speechTimeout = setTimeout(() => {
            try {
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                if (onEnd) onEnd();
            }
        }, 20);
    }
};

export function speakWord() {
    const card = cards[currentIndex];
    if (card && SpeechEngine.isSupported()) {
        SpeechEngine.speak(card.german, currentSpeechRate);
        progressQuest('listen_words', 1);
    }
}

window.SpeechEngine = SpeechEngine;
window.speakWord = speakWord;

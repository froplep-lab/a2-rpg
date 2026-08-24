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
            } catch (e) {
                console.warn("[SpeechEngine] Cancel error:", e);
            }
        }
    },

    speak(text, rate = 0.9, onStart = null, onEnd = null) {
        if (!this.isSupported()) {
            showToast("Аудіовимова не підтримується цим браузером", "info");
            if (onEnd) onEnd();
            return;
        }

        try {
            window.speechSynthesis.cancel();
        } catch (e) {}

        const cleanText = text.replace(/^(der|die|das)\s+/i, '').trim();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = rate;
        utterance.pitch = 1.0;

        const setBestVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                // Find best de-DE or de voice
                const bestVoice = voices.find(v => v.lang === 'de-DE' || v.lang === 'de_DE') ||
                                  voices.find(v => v.lang.startsWith('de') || v.lang.includes('de'));
                if (bestVoice) {
                    utterance.voice = bestVoice;
                }
            }
        };

        setBestVoice();
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                setBestVoice();
                window.speechSynthesis.onvoiceschanged = null;
            };
        }

        utterance.onstart = () => {
            document.querySelectorAll('.speech-active-indicator').forEach(el => el.classList.add('animate-pulse', 'text-cyan-400'));
            if (onStart) onStart();
        };

        utterance.onend = () => {
            document.querySelectorAll('.speech-active-indicator').forEach(el => el.classList.remove('animate-pulse', 'text-cyan-400'));
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            console.warn("[SpeechEngine] Utterance error:", e);
            document.querySelectorAll('.speech-active-indicator').forEach(el => el.classList.remove('animate-pulse', 'text-cyan-400'));
            if (onEnd) onEnd();
        };

        window._currentUtterance = utterance;
        
        // Slight timeout for mobile Safari/WebView reliability
        setTimeout(() => {
            try {
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.error("[SpeechEngine] Speak call exception:", err);
                if (onEnd) onEnd();
            }
        }, 50);
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

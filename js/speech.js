import { cards, currentIndex } from './state.js';
import { currentSpeechRate } from './audio.js';
import { showToast } from './utils.js';

export const SpeechEngine = {
    isSupported() {
        return 'speechSynthesis' in window;
    },
    speak(text, rate = 0.9) {
        if (!this.isSupported()) return;
        try {
            window.speechSynthesis.cancel();
        } catch (e) {}

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = rate;

        const attemptSpeak = () => {
            try {
                const voices = window.speechSynthesis.getVoices();
                const germanVoice = voices.find(v => v.lang === 'de-DE' || v.lang === 'de_DE' || v.lang.startsWith('de') || v.lang.includes('de'));
                if (germanVoice) {
                    utterance.voice = germanVoice;
                }
                window._currentUtterance = utterance;
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.warn("[SpeechEngine] Speak execution error:", e);
            }
        };

        try {
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = () => {
                    attemptSpeak();
                    window.speechSynthesis.onvoiceschanged = null;
                };
            } else {
                attemptSpeak();
            }
        } catch (e) {
            attemptSpeak();
        }

        utterance.onerror = (e) => {
            // Suppress benign cancellation errors or false-positive browser speech errors from triggering UI toasts
            if (e && e.error && e.error !== 'canceled' && e.error !== 'interrupted') {
                console.warn("[SpeechEngine] Utterance error:", e);
            }
        };
    }
};

if ('speechSynthesis' in window) {
    try {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    } catch (e) {}
}

export function speakWord() {
    const card = cards[currentIndex];
    if (card && SpeechEngine.isSupported()) {
        SpeechEngine.speak(card.german, currentSpeechRate);
    }
}

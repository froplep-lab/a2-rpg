import { cards, currentIndex } from './state.js';
import { currentSpeechRate } from './audio.js';
import { showToast } from './utils.js';

export const SpeechEngine = {
    isSupported() {
        return 'speechSynthesis' in window;
    },
    speak(text, rate = 0.9) {
        if (!this.isSupported()) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = rate;

        const attemptSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const germanVoice = voices.find(v => v.lang === 'de-DE' || v.lang === 'de_DE' || v.lang.startsWith('de') || v.lang.includes('de'));
            if (germanVoice) {
                utterance.voice = germanVoice;
            }
            window._currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                attemptSpeak();
                window.speechSynthesis.onvoiceschanged = null;
            };
        } else {
            attemptSpeak();
        }

        utterance.onerror = (e) => {
            console.warn("[SpeechEngine] Utterance error:", e);
            if (typeof showToast === 'function') {
                showToast("Помилка відтворення аудіо", "error");
            }
        };
    }
};

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

export function speakWord() {
    const card = cards[currentIndex];
    if (card && SpeechEngine.isSupported()) {
        SpeechEngine.speak(card.german, currentSpeechRate);
    }
}
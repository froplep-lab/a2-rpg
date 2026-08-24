// ==========================================
// SPEECH SYNTHESIS HELPER (Web Speech API)
// ==========================================

const SpeechEngine = {
    isSupported() {
        return 'speechSynthesis' in window;
    },
    speak(text, rate = 0.9) {
        if (!this.isSupported()) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = rate;

        const voices = window.speechSynthesis.getVoices();
        const germanVoice = voices.find(v => v.lang === 'de-DE' || v.lang === 'de_DE' || v.lang.startsWith('de'));
        if (germanVoice) {
            utterance.voice = germanVoice;
        }

        window.speechSynthesis.speak(utterance);
    }
};

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
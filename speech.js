// ==========================================
// SPEECH SYNTHESIS MODULE (Німецька озвучка)
// ==========================================

let cachedDeVoice = null;

function getGermanVoice() {
    if (cachedDeVoice) return cachedDeVoice;
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    cachedDeVoice = voices.find(v => v.lang === 'de-DE' || v.lang === 'de_DE' || v.lang === 'de-AT' || v.lang.startsWith('de'));
    return cachedDeVoice;
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            cachedDeVoice = null;
            getGermanVoice();
        };
    }
}

function getCleanGermanWord(raw) {
    if (!raw) return '';
    if (/[.!?]/.test(raw) || (raw.split(' ').length > 4 && !raw.includes('/'))) {
        return raw; 
    }
    let clean = raw.split('/')[0];
    clean = clean.split(',')[0];
    clean = clean.replace(/\(.*?\)/g, '');
    clean = clean.replace(/[·•]/g, '');
    clean = clean.replace(/\bsich\b/gi, '');
    clean = clean.replace(/\b(der|die|das)\b/gi, '');
    clean = clean.replace(/[^a-zA-ZäöüßÄÖÜ\s-]/g, '');
    return clean.trim();
}

function speakCompactWord(text) {
    if (typeof AudioEngine !== 'undefined' && AudioEngine.muted) return;
    if (!('speechSynthesis' in window)) return;

    const cleanText = getCleanGermanWord(text);
    if (!cleanText) return;

    window.speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.86;
    utterance.pitch = 1.0;

    const voice = getGermanVoice();
    if (voice) {
        utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
    } else {
        setTimeout(() => {
            const delayedVoice = getGermanVoice();
            if (delayedVoice) utterance.voice = delayedVoice;
            window.speechSynthesis.speak(utterance);
        }, 120);
    }
}

function speakText(text) {
    speakCompactWord(text);
}

function speakWord(e) {
    if (e) e.stopPropagation();
    if (typeof cards !== 'undefined' && typeof currentIndex !== 'undefined') {
        const card = cards[currentIndex];
        if (card && card.german) speakText(card.german);
    }
}

function speakMarathonSentence(idx) {
    if (typeof marathonWords !== 'undefined') {
        const w = marathonWords[idx];
        if (w && w.sentence) {
            speakText(w.sentence);
        }
    }
}

function speakTrialWord() {
    if (typeof currentTrialTarget !== 'undefined' && currentTrialTarget && currentTrialTarget.german) {
        speakText(currentTrialTarget.german);
    }
}
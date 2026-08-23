function speakWord(e) {
    if (e) e.stopPropagation(); // Зупиняємо переворот картки при натисканні на динамік
    const card = cards[currentIndex];
    if (card && card.german) {
        speakCompactWord(card.german);
    }
}

function speakCompactWord(wordStr) {
    if (!('speechSynthesis' in window)) {
        console.warn("Speech synthesis not supported");
        return;
    }
    
    // Зупиняємо попереднє озвучування, щоб не було накладання
    window.speechSynthesis.cancel();

    // Очищаємо текст від зайвих артиклів чи слешів для чистішого звуку (наприклад, беремо перше слово або чистий німецький варіант)
    let cleanText = wordStr.split('/')[0].replace(/\(.*?\)/g, '').replace(/·/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.95; // Трохи сповільнена швидкість для кращого сприйняття слів

    // Пробуємо знайти німецький голос в системі телефону
    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find(v => v.lang.startsWith('de'));
    if (deVoice) {
        utterance.voice = deVoice;
    }

    window.speechSynthesis.speak(utterance);
}

// Завантаження голосів заздалегідь для мобільних браузерів
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
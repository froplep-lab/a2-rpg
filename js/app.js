import { loadVocabulary } from './storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Ініціалізація Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Безпечне завантаження словника
    const words = await loadVocabulary();
    
    // Перевірка результату в консолі для дебагу
    console.log("Завантажені слова:", words);
    
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
        if (words.length > 0) {
            statusElement.textContent = `Успіх! Завантажено ${words.length} слів. Можна починати бій.`;
            statusElement.style.color = '#4ade80'; 
        } else {
            statusElement.textContent = 'Помилка: 0 слів. Файл words.json не знайдено або він порожній.';
            statusElement.style.color = '#f87171';
        }
    }
});

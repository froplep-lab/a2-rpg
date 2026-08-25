export async function loadVocabulary() {
    const basePath = window.location.pathname.includes('a2-rpg') ? '/a2-rpg' : '';
    let words = JSON.parse(localStorage.getItem('rpg_words')) || [];
    
    if (words.length === 0) {
        try {
            const response = await fetch(`${basePath}/data/words.json`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            words = await response.json();
            
            if (words.length > 0) {
                localStorage.setItem('rpg_words', JSON.stringify(words));
            }
        } catch (error) {
            console.error('Помилка завантаження словника:', error);
            return []; 
        }
    }
    return words;
}

export function clearCache() {
    localStorage.removeItem('rpg_words');
    console.log('Кеш очищено.');
}

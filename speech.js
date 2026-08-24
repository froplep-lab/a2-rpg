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
```[cite: 6]

---

### 2. `style.css`
Створи або очисти файл `style.css` і встав туди цей код[cite: 7]:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
    .glass-panel {
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    }
}

body {
    background-color: #090d16;
    color: #f8fafc;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    user-select: none;
    -webkit-user-select: none;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.6);
}
::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.4);
    border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.8);
}

/* Animations */
@keyframes float-up {
    0% {
        opacity: 1;
        transform: translateY(0) scale(0.9);
    }
    100% {
        opacity: 0;
        transform: translateY(-50px) scale(1.1);
    }
}

@keyframes toast-slide {
    0% { transform: translateY(100px); opacity: 0; }
    15% { transform: translateY(0); opacity: 1; }
    85% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-50px); opacity: 0; }
}

.cyber-toast {
    animation: toast-slide 3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.interactive-btn {
    transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}
.interactive-btn:active {
    transform: scale(0.96);
}
```[cite: 7]

---

### 3. `words.json`
Створи або очисти файл `words.json` і встав туди цей код[cite: 8]:

```json
[
  {
    "german": "das Beispiel",
    "grammar": "Nomen, n.",
    "ukrainian": "приклад",
    "hint": "Демонстрація чогось",
    "emoji": "📌",
    "sentence": "Das ist ein gutes Beispiel für unsere Arbeit.",
    "rarity": "звичайний"
  },
  {
    "german": "entwickeln",
    "grammar": "Verb",
    "ukrainian": "розробляти",
    "hint": "Створювати щось нове",
    "emoji": "💻",
    "sentence": "Wir entwickeln eine neue Web-App.",
    "rarity": "рідкісний"
  },
  {
    "german": "die Gelegenheit",
    "grammar": "Nomen, f.",
    "ukrainian": "можливість, нагода",
    "hint": "Сприятливий момент",
    "emoji": "✨",
    "sentence": "Das ist eine tolle Gelegenheit.",
    "rarity": "епічний"
  },
  {
    "german": "zuverlässig",
    "grammar": "Adjektiv",
    "ukrainian": "надійний",
    "hint": "Той, на кого можна покластися",
    "emoji": "🛡️",
    "sentence": "Er ist ein sehr zuverlässiger Partner.",
    "rarity": "рідкісний"
  },
  {
    "german": "die Herausforderung",
    "grammar": "Nomen, f.",
    "ukrainian": "виклики, складне завдання",
    "hint": "Важке але цікаве завдання",
    "emoji": "⚡",
    "sentence": "Diese Prüfung ist eine große Herausforderung.",
    "rarity": "легендарний"
  },
  {
    "german": "erfolgreich",
    "grammar": "Adjektiv",
    "ukrainian": "успішний",
    "hint": "З хорошим результатом",
    "emoji": "🏆",
    "sentence": "Das Projekt war äußerst erfolgreich.",
    "rarity": "звичайний"
  }
]
```[cite: 8]

---

### 4. `app.js`
Створи або очисти файл `app.js` і встав туди цей код[cite: 9]:
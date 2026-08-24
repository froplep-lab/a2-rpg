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
```[cite: 1]

---

### 2. `style.css`[cite: 2]
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
    .glass-panel {
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
    }
}

body {
    background-color: #090d16;
    color: #f8fafc;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
}

/* GPU Hardware Acceleration for Smooth Mobile Animation */
.perspective, #flashcard-inner, .fixed.inset-0 {
    transform: translateZ(0);
    will-change: transform, opacity;
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
    transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.interactive-btn:active {
    transform: scale(0.95);
}
```[cite: 2]

---

### 3. `words.json`[cite: 3]
```json
[
  {
    "german": "das Beispiel",
    "grammar": "Nomen, n.",
    "ukrainian": "приклад",
    "hint": "Демонстрація чогось",
    "emoji": "📌",
    "sentence": "Das ist ein gutes Beispiel für unsere Arbeit.",
    "rarity": "звичайний",
    "article": "das"
  },
  {
    "german": "entwickeln",
    "grammar": "Verb",
    "ukrainian": "розробляти",
    "hint": "Створювати щось нове",
    "emoji": "💻",
    "sentence": "Wir entwickeln eine neue Web-App.",
    "rarity": "рідкісний",
    "article": "none"
  },
  {
    "german": "die Gelegenheit",
    "grammar": "Nomen, f.",
    "ukrainian": "можливість, нагода",
    "hint": "Сприятливий момент",
    "emoji": "✨",
    "sentence": "Das ist eine tolle Gelegenheit.",
    "rarity": "епічний",
    "article": "die"
  },
  {
    "german": "zuverlässig",
    "grammar": "Adjektiv",
    "ukrainian": "надійний",
    "hint": "Той, на кого можна покластися",
    "emoji": "🛡️",
    "sentence": "Er ist ein sehr zuverlässiger Partner.",
    "rarity": "рідкісний",
    "article": "none"
  },
  {
    "german": "die Herausforderung",
    "grammar": "Nomen, f.",
    "ukrainian": "виклики, складне завдання",
    "hint": "Важке але цікаве завдання",
    "emoji": "⚡",
    "sentence": "Diese Prüfung ist eine große Herausforderung.",
    "rarity": "легендарний",
    "article": "die"
  },
  {
    "german": "erfolgreich",
    "grammar": "Adjektiv",
    "ukrainian": "успішний",
    "hint": "З хорошим результатом",
    "emoji": "🏆",
    "sentence": "Das Projekt war äußerst erfolgreich.",
    "rarity": "звичайний",
    "article": "none"
  }
]
```[cite: 3]

---

### 4. `app.js`[cite: 4]
```javascript
// ==========================================
// DE B1 RPG STUDIO - CORE APPLICATION ENGINE (STABLE QA PASS)
// ==========================================

let cards = [];
let currentIndex = 0;
let isFlipped = false;
let masteredWords = new Set();
let bookmarkedWords = new Set();
let isActionLocked = false;
let examTimeoutId = null;
let lastActiveElement = null;

let hero = {
    level: 1,
    xp: 0,
    streak: 0,
    questsCompleted: {
        hackCount: 0,
        audioCount: 0,
        articleCount: 0,
        claimedRewards: {
            hack: false,
            audio: false,
            article: false,
            allCompleted: false
        }
    }
};

// ==========================================
// TELEGRAM WEBAPP & STORAGE ENGINES
// ==========================================
const TelegramBridge = {
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            try {
                tg.ready();
                tg.expand();
                tg.setHeaderColor('#090d16');
                tg.setBackgroundColor('#090d16');
            } catch (e) {
                console.warn("[TelegramBridge] Init error:", e);
            }
        }
    }
};

const Haptics = {
    trigger(type = 'medium') {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            const hf = window.Telegram.WebApp.HapticFeedback;
            if (type === 'success') hf.notificationOccurred('success');
            else if (type === 'error') hf.notificationOccurred('error');
            else if (type === 'light') hf.impactOccurred('light');
            else hf.impactOccurred('medium');
        } else if (navigator.vibrate) {
            if (type === 'success') navigator.vibrate([30, 50, 30]);
            else if (type === 'error') navigator.vibrate([100, 50, 100]);
            else navigator.vibrate(25);
        }
    }
};

const StorageEngine = {
    _memoryCache: {},
    get(key, fallback) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? JSON.parse(item) : fallback;
        } catch (e) {
            return this._memoryCache[key] !== undefined ? this._memoryCache[key] : fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this._memoryCache[key] = value;
        } catch (e) {
            this._memoryCache[key] = value;
        }
    }
};

// ==========================================
// TOAST NOTIFICATION ENGINE
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement('div');
    const borderColor = type === 'success' ? 'border-emerald-500/50 bg-emerald-950/85 text-emerald-300' : 
                        type === 'error' ? 'border-pink-500/50 bg-pink-950/85 text-pink-300' : 
                        'border-cyan-500/50 bg-slate-900/90 text-cyan-300';

    toast.className = `cyber-toast glass-panel px-4 py-3 rounded-2xl border ${borderColor} text-xs font-black shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center gap-2.5 pointer-events-auto`;
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${icon} text-sm" aria-hidden="true"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==========================================
// AUDIO ENGINE
// ==========================================
const AudioEngine = {
    muted: StorageEngine.get('a2_muted', false),
    volumes: StorageEngine.get('a2_volumes', { click: 0.5, hit: 0.5, success: 0.5, error: 0.5 }),
    audioCtx: null,
    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.audioCtx = new AudioContext();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },
    play(type) {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const now = this.audioCtx.currentTime;
            const vol = (this.volumes[type] !== undefined ? this.volumes[type] : 0.5) * 0.3;

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.setValueAtTime(120, now + 0.1);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'levelup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(500, now + 0.1);
                osc.frequency.setValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
        } catch (e) {
            console.warn("[AudioEngine] Playback error:", e);
        }
    }
};

function toggleAudioMute() {
    AudioEngine.muted = !AudioEngine.muted;
    StorageEngine.set('a2_muted', AudioEngine.muted);
    syncSoundUI();
    AudioEngine.play('click');
}

function updateAudioVolume(val) {
    const num = parseInt(val) / 100;
    AudioEngine.volumes = { click: num, hit: num, success: num, error: num, levelup: num };
    StorageEngine.set('a2_volumes', AudioEngine.volumes);
    const label = document.getElementById("volume-val-label");
    if (label) label.innerText = `${val}%`;
    AudioEngine.play('click');
}

let autoSpeakOnFlip = StorageEngine.get('a2_autospeak', false);
function toggleAutoSpeak() {
    autoSpeakOnFlip = !autoSpeakOnFlip;
    StorageEngine.set('a2_autospeak', autoSpeakOnFlip);
    syncSoundUI();
    AudioEngine.play('click');
}

let currentSpeechRate = StorageEngine.get('a2_speech_rate', 0.9);
function toggleSpeechRate() {
    currentSpeechRate = currentSpeechRate === 0.9 ? 0.7 : 0.9;
    StorageEngine.set('a2_speech_rate', currentSpeechRate);
    syncSoundUI();
    showToast(`Швидкість вимови: ${currentSpeechRate === 0.7 ? 'Повільна (0.7x)' : 'Нормальна (0.9x)'}`, 'info');
    AudioEngine.play('click');
}

function speakWord() {
    const card = cards[currentIndex];
    if (card && SpeechEngine.isSupported()) {
        SpeechEngine.speak(card.german, currentSpeechRate);
        if (!hero.questsCompleted) hero.questsCompleted = { hackCount: 0, audioCount: 0, articleCount: 0, claimedRewards: { hack: false, audio: false, article: false, allCompleted: false } };
        hero.questsCompleted.audioCount = (hero.questsCompleted.audioCount || 0) + 1;
        checkQuestMilestones();
        updateDailyQuestsUI();
    }
}

function syncSoundUI() {
    const muted = AudioEngine.muted;
    const icon = document.getElementById("sound-icon");
    if (icon) icon.className = muted ? 'fa-solid fa-volume-xmark text-pink-500' : 'fa-solid fa-volume-high text-cyan-400';
    
    const masterBtnHeader = document.getElementById("sound-master-btn-header");
    if (masterBtnHeader) masterBtnHeader.className = muted ? 'interactive-btn glass-panel text-pink-500 p-2.5 rounded-xl border border-pink-500/30 hover:bg-slate-800' : 'interactive-btn glass-panel text-cyan-400 p-2.5 rounded-xl border border-cyan-500/30 hover:bg-slate-800';

    const masterBtnModal = document.getElementById("sound-master-btn");
    if (masterBtnModal) {
        masterBtnModal.className = muted ? 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-slate-500' : 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-950 shadow-md';
        masterBtnModal.textContent = muted ? 'ВИМКНЕНО' : 'УВІМКНЕНО';
    }

    const autoBtn = document.getElementById("sound-autospeak-btn");
    if (autoBtn) {
        autoBtn.className = autoSpeakOnFlip ? 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-950 shadow-md' : 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-slate-500';
        autoBtn.textContent = autoSpeakOnFlip ? 'УВІМКНЕНО' : 'ВИМКНЕНО';
    }

    const rateBtn = document.getElementById("sound-rate-btn");
    if (rateBtn) {
        rateBtn.textContent = currentSpeechRate === 0.7 ? 'ПОВІЛЬНА (0.7X)' : 'НОРМАЛЬНА (0.9X)';
    }

    const currentVol = Math.round((AudioEngine.volumes.click !== undefined ? AudioEngine.volumes.click : 0.5) * 100);
    const slider = document.getElementById("sound-volume-slider");
    const label = document.getElementById("volume-val-label");
    if (slider) slider.value = currentVol;
    if (label) label.innerText = `${currentVol}%`;
}

// ==========================================
// HERO, XP & UNIFIED DAILY QUEST LOOP
// ==========================================
function updateHeroUI() {
    const lvlEl = document.getElementById("hero-level-label");
    const streakEl = document.getElementById("hero-streak-label");
    if (lvlEl) lvlEl.innerText = `LVL ${hero.level}`;
    if (streakEl) streakEl.innerText = `${hero.streak}x`;
    updateDailyQuestsUI();
}

function updateDailyQuestsUI() {
    if (!hero.questsCompleted) hero.questsCompleted = { hackCount: 0, audioCount: 0, articleCount: 0, claimedRewards: { hack: false, audio: false, article: false, allCompleted: false } };
    
    const q1Prog = Math.min(hero.questsCompleted.hackCount || 0, 3);
    const q2Prog = Math.min(hero.questsCompleted.audioCount || 0, 3);
    const q3Prog = Math.min(hero.questsCompleted.articleCount || 0, 2);
    
    const q1El = document.getElementById("quest-hack-progress");
    const q2El = document.getElementById("quest-audio-progress");
    const q3El = document.getElementById("quest-article-progress");

    if (q1El) q1El.innerText = `${q1Prog}/3`;
    if (q2El) q2El.innerText = `${q2Prog}/3`;
    if (q3El) q3El.innerText = `${q3Prog}/2`;
}

function checkQuestMilestones() {
    if (!hero.questsCompleted) return;
    
    if (hero.questsCompleted.hackCount >= 3 && !hero.questsCompleted.claimedRewards.hack) {
        hero.questsCompleted.claimedRewards.hack = true;
        addXp(40);
        showToast("🎁 Квест виконано: Зламо душ! +40 XP", "success");
    }
    if (hero.questsCompleted.audioCount >= 3 && !hero.questsCompleted.claimedRewards.audio) {
        hero.questsCompleted.claimedRewards.audio = true;
        addXp(30);
        showToast("🎁 Квест виконано: Аудіопрактика! +30 XP", "success");
    }
    if (hero.questsCompleted.articleCount >= 2 && !hero.questsCompleted.claimedRewards.article) {
        hero.questsCompleted.claimedRewards.article = true;
        addXp(50);
        showToast("🎁 Квест виконано: Дуель артиклів! +50 XP", "success");
    }

    if (hero.questsCompleted.hackCount >= 3 && hero.questsCompleted.audioCount >= 3 && hero.questsCompleted.articleCount >= 2 && !hero.questsCompleted.claimedRewards.allCompleted) {
        hero.questsCompleted.claimedRewards.allCompleted = true;
        addXp(100);
        if (typeof confetti === 'function') {
            confetti({ particleCount: 200, spread: 150, origin: { y: 0.6 } });
        }
        showToast("🌟 УСІ ЩОДЕННІ КВЕСТИ ВИКОНАНО! +100 XP бонус!", "success");
    }

    StorageEngine.set('a2_hero', hero);
}

function addXp(amount) {
    hero.xp += amount;
    const requiredXp = hero.level * 150;
    if (hero.xp >= requiredXp) {
        hero.level++;
        hero.xp -= requiredXp;
        AudioEngine.play('levelup');
        Haptics.trigger('success');
        if (typeof confetti === 'function') {
            confetti({ particleCount: 300, spread: 200, origin: { y: 0.5 }, colors: ['#06b6d4', '#ec4899', '#fcd34d'] });
        }
        showToast(`🎉 РІВЕНЬ ПІДНЯТО! Новий рівень: ${hero.level}`, 'success');
    } else {
        showToast(`+${amount} XP отримано`, 'info');
    }
    StorageEngine.set('a2_hero', hero);
    updateHeroUI();
}

function checkDailyLoginBonus() {
    const today = new Date().toDateString();
    const lastLogin = StorageEngine.get('a2_last_login', '');
    if (lastLogin !== today) {
        StorageEngine.set('a2_last_login', today);
        hero.streak++;
        addXp(50);
        showToast(`🔥 ЩОДЕННИЙ ВХІД! Стрік: ${hero.streak}x | +50 XP`, 'success');
        StorageEngine.set('a2_hero', hero);
        updateHeroUI();
    }
}

// ==========================================
// FIRST-TIME ONBOARDING (WELCOME MODAL)
// ==========================================
function checkFirstTimeOnboarding() {
    const isWelcomed = StorageEngine.get('a2_welcomed', false);
    if (!isWelcomed) {
        setTimeout(() => {
            toggleModal("welcome-modal", "welcome-box", true);
        }, 400);
    }
}

function closeWelcomeModal() {
    StorageEngine.set('a2_welcomed', true);
    AudioEngine.play('click');
    toggleModal("welcome-modal", "welcome-box", false);
    showToast("🚀 Бажаю успіхів у вивченні німецької!", "success");
}

// ==========================================
// CARD NAVIGATION & INTERACTION
// ==========================================
function updateCard() {
    const card = cards[currentIndex];
    if (!card) return;

    document.getElementById("card-german").innerText = card.german || '';
    document.getElementById("card-grammar").innerText = card.grammar || '';
    document.getElementById("card-ukrainian").innerText = card.ukrainian || '';
    document.getElementById("card-hint").innerText = card.hint || '';
    document.getElementById("card-sentence").innerText = card.sentence || '';
    document.getElementById("card-emoji").innerText = card.emoji || '📌';
    document.getElementById("card-index-indicator").innerText = `${currentIndex + 1} / ${cards.length}`;

    const rObj = [{ name: 'звичайний', color: 'border-cyan-500/30 text-cyan-300' }, { name: 'рідкісний', color: 'border-cyan-400 text-cyan-300' }, { name: 'епічний', color: 'border-purple-400 text-purple-300' }, { name: 'легендарний', color: 'border-yellow-400 text-yellow-300' }].find(r => r.name === (card.rarity || 'звичайний')) || { name: 'звичайний', color: 'border-cyan-500/30 text-cyan-300' };
    const badge = document.getElementById("card-rarity-badge");
    if (badge) {
        badge.className = `text-[10px] font-black px-2.5 py-1 rounded-md border ${rObj.color} uppercase`;
        badge.innerText = card.rarity ? card.rarity.toUpperCase() : 'ЗВИЧАЙНИЙ';
    }

    if (isFlipped) {
        flipCard(true);
    }
    updateMasteredUI();
    updateCardBookmarkUI();
}

function flipCard(forceReset = false) {
    if (isActionLocked && !forceReset) return;
    if (!forceReset) {
        isActionLocked = true;
        setTimeout(() => { isActionLocked = false; }, 250);
    }

    AudioEngine.play('click');
    Haptics.trigger('light');
    const inner = document.getElementById("flashcard-inner");
    if (!inner) return;

    if (forceReset) {
        isFlipped = false;
        inner.style.transform = "rotateY(0deg)";
        return;
    }

    isFlipped = !isFlipped;
    inner.style.transform = isFlipped ? "rotateY(180deg)" : "rotateY(0deg)";

    if (isFlipped && autoSpeakOnFlip) {
        speakWord();
    }
}

function nextCard() {
    if (isActionLocked) return;
    isActionLocked = true;
    setTimeout(() => { isActionLocked = false; }, 200);

    AudioEngine.play('click');
    Haptics.trigger('light');
    currentIndex = (currentIndex + 1) % cards.length;
    updateCard();
}

function prevCard() {
    if (isActionLocked) return;
    isActionLocked = true;
    setTimeout(() => { isActionLocked = false; }, 200);

    AudioEngine.play('click');
    Haptics.trigger('light');
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCard();
}

// ==========================================
// MOBILE SWIPE GESTURES
// ==========================================
let touchStartX = 0;
let touchEndX = 0;

function initSwipeGestures() {
    const cardContainer = document.querySelector('.perspective');
    if (!cardContainer) return;

    cardContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    cardContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            nextCard();
        } else if (touchEndX > touchStartX + threshold) {
            prevCard();
        }
    }, { passive: true });
}

function updateMasteredUI() {
    const card = cards[currentIndex];
    if (!card) return;
    const isM = masteredWords.has(card.german);
    const btn = document.getElementById("soul-hack-btn");
    
    if (isM) {
        if (btn) {
            btn.className = "interactive-btn w-full glass-panel text-slate-500 border border-slate-700 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed mt-2";
            btn.innerHTML = `<i class="fa-solid fa-ghost" aria-hidden="true"></i> Душу зламано ✓`;
            btn.disabled = true;
        }
    } else {
        if (btn) {
            btn.className = "interactive-btn w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] mt-2";
            btn.innerHTML = `<i class="fa-solid fa-bolt" aria-hidden="true"></i> Зламати душу`;
            btn.disabled = false;
        }
    }

    const progressEl = document.getElementById("theme-progress-text");
    if (progressEl && cards.length > 0) {
        const percent = Math.round((masteredWords.size / cards.length) * 100);
        progressEl.innerText = `${percent}%`;
    }
}

function attackEnemyClick() {
    if (isActionLocked) return;
    const card = cards[currentIndex];
    if (!card || masteredWords.has(card.german)) return;

    isActionLocked = true;
    setTimeout(() => { isActionLocked = false; }, 300);

    masteredWords.add(card.german);
    StorageEngine.set('a2_mastered', Array.from(masteredWords));
    
    if (!hero.questsCompleted) hero.questsCompleted = { hackCount: 0, audioCount: 0, articleCount: 0, claimedRewards: { hack: false, audio: false, article: false, allCompleted: false } };
    hero.questsCompleted.hackCount = (hero.questsCompleted.hackCount || 0) + 1;
    checkQuestMilestones();

    AudioEngine.play('success');
    Haptics.trigger('success');
    addXp(25);
    updateMasteredUI();
    isCompactDirty = true;
    showToast(`⚡ Душу слова "${card.german}" успішно зламано!`, 'success');
}

// ==========================================
// BOOKMARK / STARRED SYSTEM
// ==========================================
function toggleBookmark() {
    const card = cards[currentIndex];
    if (!card) return;
    
    if (bookmarkedWords.has(card.german)) {
        bookmarkedWords.delete(card.german);
        showToast('Видалено з обраного', 'info');
    } else {
        bookmarkedWords.add(card.german);
        showToast('Додано в обране ⭐️', 'success');
    }
    StorageEngine.set('a2_bookmarks', Array.from(bookmarkedWords));
    updateCardBookmarkUI();
    isCompactDirty = true;
    AudioEngine.play('click');
    Haptics.trigger('light');
}

function updateCardBookmarkUI() {
    const card = cards[currentIndex];
    const btn = document.getElementById("card-bookmark-btn");
    if (!card || !btn) return;
    
    const isBookmarked = bookmarkedWords.has(card.german);
    btn.className = isBookmarked 
        ? "interactive-btn glass-panel text-yellow-400 py-3 px-1 rounded-2xl border border-yellow-500/50 bg-yellow-950/20 flex flex-col items-center shadow-md"
        : "interactive-btn glass-panel text-slate-400 hover:text-yellow-400 py-3 px-1 rounded-2xl border border-slate-700 flex flex-col items-center shadow-md";
    btn.innerHTML = `<i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star text-sm mb-1" aria-hidden="true"></i> <span class="truncate">ЗІРКА</span>`;
}

// ==========================================
// DISPLAY MODES & COMPACT VIEW (DEBOUNCED SEARCH)
// ==========================================
let isCompactDirty = true;
let currentSearchQuery = "";
let currentRarityFilter = 'all';

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const debouncedFilterSearch = debounce((query) => {
    currentSearchQuery = query.toLowerCase().trim();
    renderCompactBlock();
}, 150);

function filterCompactWords(query) {
    debouncedFilterSearch(query);
}

function clearCompactSearch() {
    const input = document.getElementById("compact-search-input");
    if (input) input.value = "";
    currentSearchQuery = "";
    renderCompactBlock();
}

function setRarityFilter(rarity) {
    currentRarityFilter = rarity;
    AudioEngine.play('click');
    Haptics.trigger('light');
    renderCompactBlock();
}

function switchDisplayMode(mode) {
    AudioEngine.play('click'); 
    Haptics.trigger('light');
    const gameView = document.getElementById("game-view-container");
    const compactView = document.getElementById("compact-block-view");
    const btnGame = document.getElementById("mode-game-btn");
    const btnCompact = document.getElementById("mode-compact-btn");

    if (mode === 'compact') {
        if (gameView) gameView.classList.add("hidden"); 
        if (compactView) compactView.classList.remove("hidden");
        if (btnCompact) {
            btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
            btnCompact.setAttribute("aria-selected", "true");
        }
        if (btnGame) {
            btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
            btnGame.setAttribute("aria-selected", "false");
        }
        
        if (isCompactDirty) {
            renderCompactBlock();
            isCompactDirty = false;
        }
    } else {
        if (compactView) compactView.classList.add("hidden"); 
        if (gameView) gameView.classList.remove("hidden");
        if (btnGame) {
            btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
            btnGame.setAttribute("aria-selected", "true");
        }
        if (btnCompact) {
            btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
            btnCompact.setAttribute("aria-selected", "false");
        }
    }
}

function renderCompactBlock() {
    const grid = document.getElementById("compact-words-grid");
    if (!grid) return;

    const filteredCards = cards.filter(card => {
        if (currentRarityFilter === 'bookmarked') {
            if (!bookmarkedWords.has(card.german)) return false;
        } else if (currentRarityFilter !== 'all') {
            if ((card.rarity || 'звичайний').toLowerCase() !== currentRarityFilter) return false;
        }
        if (!currentSearchQuery) return true;
        return (card.german || '').toLowerCase().includes(currentSearchQuery) || 
               (card.ukrainian || '').toLowerCase().includes(currentSearchQuery) ||
               (card.grammar || '').toLowerCase().includes(currentSearchQuery);
    });

    if (filteredCards.length === 0) {
        const isFavFilter = currentRarityFilter === 'bookmarked';
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-slate-400 text-xs font-bold space-y-2">
                <i class="fa-solid ${isFavFilter ? 'fa-star text-yellow-400' : 'fa-triangle-exclamation text-pink-500'} text-2xl mb-1 block" aria-hidden="true"></i>
                ${isFavFilter ? 'У вас поки немає обраних слів.<br>Натисніть зірочку на картці, щоб додати!' : `Нічого не знайдено за запитом "${currentSearchQuery}"`}
            </div>
        `;
        return;
    }

    const htmlContent = filteredCards.map((card) => {
        const isMastered = masteredWords.has(card.german);
        const isBookmarked = bookmarkedWords.has(card.german);
        return `
            <div onclick="jumpToCardFromCompact('${(card.german || '').replace(/'/g, "\\'")}')" class="interactive-btn glass-panel p-3.5 rounded-2xl border ${isMastered ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-700/60'} flex items-center justify-between cursor-pointer hover:border-cyan-400/60 shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${card.emoji || '📌'}</span>
                    <div>
                        <div class="text-xs font-black text-white">${card.german} ${isBookmarked ? '⭐️' : ''}</div>
                        <div class="text-[10px] text-emerald-400 font-bold">${card.ukrainian}</div>
                    </div>
                </div>
                ${isMastered ? '<span class="text-[9px] text-emerald-400 font-bold"><i class="fa-solid fa-check" aria-hidden="true"></i> Зламано</span>' : ''}
            </div>
        `;
    }).join('');

    grid.innerHTML = htmlContent;
}

function jumpToCardFromCompact(ger) {
    AudioEngine.play('click');
    Haptics.trigger('light');
    const targetIdx = cards.findIndex(c => c.german === ger);
    if (targetIdx !== -1) {
        currentIndex = targetIdx;
        switchDisplayMode('game');
        updateCard();
    }
}

// ==========================================
// EXAM SIMULATOR B1
// ==========================================
let examQuestions = [];
let examIndex = 0;
let examScore = 0;

function openExamSimulator() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    document.getElementById("exam-content").innerHTML = `
        <div class="text-center py-6 space-y-4">
            <div class="text-4xl">🎓</div>
            <div class="text-sm font-bold text-slate-300">Перевір готовність до іспиту B1! Тест складається з 10 випадкових питань.</div>
            <button onclick="startExamSession()" class="interactive-btn w-full max-w-xs mx-auto bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-black text-sm shadow-[0_10px_25px_rgba(236,72,153,0.4)]">ПОЧАТИ ТЕСТ</button>
        </div>
    `;
    toggleModal("exam-modal", "exam-box", true);
}

function closeExamSimulator() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    if (examTimeoutId) {
        clearTimeout(examTimeoutId);
        examTimeoutId = null;
    }
    toggleModal("exam-modal", "exam-box", false);
}

function startExamSession() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    examQuestions = [...cards].sort(() => Math.random() - 0.5).slice(0, 10);
    examIndex = 0;
    examScore = 0;
    renderExamQuestion();
}

function renderExamQuestion() {
    const modal = document.getElementById("exam-modal");
    if (!modal || modal.classList.contains("pointer-events-none")) return;

    const content = document.getElementById("exam-content");
    if (!content) return;

    if (examIndex >= examQuestions.length) {
        const percent = Math.round((examScore / examQuestions.length) * 100);
        const passed = percent >= 80;
        if (passed) {
            AudioEngine.play('levelup');
            Haptics.trigger('success');
            addXp(150);
        } else {
            AudioEngine.play('error');
            Haptics.trigger('error');
        }

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">${passed ? '🏆' : '⚠️'}</div>
                <div class="text-lg font-black ${passed ? 'text-emerald-400' : 'text-pink-400'}">${passed ? 'ІСПИТ СКЛАДЕНО УСПІШНО!' : 'ПОТРІБНА ДОДАТКОВА ПІДГОТОВКА'}</div>
                <div class="text-sm text-slate-300">Результат: <b>${examScore} / ${examQuestions.length}</b> (${percent}%)</div>
                <button onclick="openExamSimulator()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОВТОРИТИ СПРОБУ</button>
            </div>
        `;
        return;
    }

    const currentCard = examQuestions[examIndex];
    let wrongOptions = cards.filter(c => c.ukrainian !== currentCard.ukrainian).sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.ukrainian);
    while (wrongOptions.length < 3) {
        wrongOptions.push("Немає перекладу");
    }
    const options = [...wrongOptions, currentCard.ukrainian].sort(() => Math.random() - 0.5);
    const correctIdx = options.indexOf(currentCard.ukrainian);

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Питання ${examIndex + 1} / ${examQuestions.length}</span>
                <span class="text-cyan-400">Бали: ${examScore}</span>
            </div>
            <div class="glass-panel p-5 rounded-2xl border border-pink-500/30 text-center space-y-2">
                <div class="text-2xl font-black text-white">${currentCard.german}</div>
                <div class="text-xs text-pink-400 font-bold uppercase">${currentCard.grammar || 'Nomen'}</div>
            </div>
            <div class="grid grid-cols-1 gap-2.5">
                ${options.map((opt, idx) => `
                    <button onclick="checkExamAnswer(${idx}, ${correctIdx})" class="interactive-btn glass-panel border border-slate-700 text-slate-200 py-3 px-4 rounded-xl font-bold text-xs text-left hover:border-pink-400 hover:text-pink-300 exam-btn">
                        ${idx + 1}. ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function checkExamAnswer(selected, correct) {
    const btns = document.querySelectorAll(".exam-btn");
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correct) {
            btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-300");
        } else if (idx === selected) {
            btn.classList.add("border-pink-500", "bg-pink-500/20", "text-pink-300");
        } else {
            btn.classList.add("opacity-40");
        }
    });

    if (selected === correct) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        examScore++;
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
    }

    examIndex++;
    if (examTimeoutId) clearTimeout(examTimeoutId);
    examTimeoutId = setTimeout(() => {
        renderExamQuestion();
    }, 900);
}

// ==========================================
// ARTICLE RUSH MINI-GAME (DER / DIE / DAS)
// ==========================================
let articleGameQuestions = [];
let articleGameIndex = 0;
let articleGameScore = 0;

function openArticleMiniGame() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    const nouns = cards.filter(c => c.article && c.article !== 'none');
    if (nouns.length === 0) {
        showToast("Немає слів з артиклями для гри", "error");
        return;
    }
    articleGameQuestions = [...nouns].sort(() => Math.random() - 0.5).slice(0, 5);
    articleGameIndex = 0;
    articleGameScore = 0;
    renderArticleQuestion();
    toggleModal("article-modal", "article-box", true);
}

function closeArticleMiniGame() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    toggleModal("article-modal", "article-box", false);
}

function renderArticleQuestion() {
    const content = document.getElementById("article-content");
    if (!content) return;

    if (articleGameIndex >= articleGameQuestions.length) {
        AudioEngine.play('levelup');
        Haptics.trigger('success');
        
        if (!hero.questsCompleted) hero.questsCompleted = { hackCount: 0, audioCount: 0, articleCount: 0, claimedRewards: { hack: false, audio: false, article: false, allCompleted: false } };
        hero.questsCompleted.articleCount = (hero.questsCompleted.articleCount || 0) + 1;
        checkQuestMilestones();
        addXp(50);

        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-5xl">⚡</div>
                <div class="text-lg font-black text-cyan-400">ДУЕЛЬ АРТИКЛІВ ЗАВЕРШЕНО!</div>
                <div class="text-sm text-slate-300">Правильних відповідей: <b>${articleGameScore} / ${articleGameQuestions.length}</b></div>
                <button onclick="openArticleMiniGame()" class="interactive-btn w-full max-w-xs mx-auto bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ЗІГРАТИ ЩЕ РАЗ</button>
            </div>
        `;
        return;
    }

    const q = articleGameQuestions[articleGameIndex];
    content.innerHTML = `
        <div class="space-y-4 text-center">
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Артикльний раунд ${articleGameIndex + 1} / ${articleGameQuestions.length}</div>
            <div class="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-2">
                <div class="text-3xl font-black text-white">${q.german}</div>
                <div class="text-xs text-emerald-400 font-bold">${q.ukrainian}</div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <button onclick="checkArticleAnswer('der', '${q.article}')" class="interactive-btn glass-panel border border-cyan-500/40 py-3.5 rounded-xl font-black text-xs text-cyan-300 hover:bg-cyan-950/40">DER</button>
                <button onclick="checkArticleAnswer('die', '${q.article}')" class="interactive-btn glass-panel border border-pink-500/40 py-3.5 rounded-xl font-black text-xs text-pink-300 hover:bg-pink-950/40">DIE</button>
                <button onclick="checkArticleAnswer('das', '${q.article}')" class="interactive-btn glass-panel border border-yellow-500/40 py-3.5 rounded-xl font-black text-xs text-yellow-300 hover:bg-yellow-950/40">DAS</button>
            </div>
        </div>
    `;
}

function checkArticleAnswer(chosen, correct) {
    if (chosen === correct) {
        AudioEngine.play('success');
        Haptics.trigger('success');
        articleGameScore++;
        showToast("Правильно! ⚡", "success");
    } else {
        AudioEngine.play('error');
        Haptics.trigger('error');
        showToast(`Помилка! Правильно: ${correct.toUpperCase()}`, "error");
    }
    articleGameIndex++;
    setTimeout(() => {
        renderArticleQuestion();
    }, 700);
}

// ==========================================
// MODALS & FOCUS MANAGEMENT (A11Y)
// ==========================================
function toggleModal(modalId, boxId, show) {
    const modal = document.getElementById(modalId);
    const box = document.getElementById(boxId);
    if (!modal || !box) return;
    
    if (show) {
        lastActiveElement = document.activeElement;
        document.body.style.overflow = 'hidden';
        modal.classList.remove("pointer-events-none", "opacity-0");
        modal.classList.add("opacity-100");
        box.classList.remove("scale-90", "opacity-0", "translate-y-4");
        box.classList.add("scale-100", "opacity-100", "translate-y-0");

        setTimeout(() => {
            const firstInputOrBtn = box.querySelector('button, input, [tabindex="0"]');
            if (firstInputOrBtn) firstInputOrBtn.focus();
        }, 100);
    } else {
        box.classList.remove("scale-100", "opacity-100", "translate-y-0");
        box.classList.add("scale-90", "opacity-0", "translate-y-4");
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0", "pointer-events-none");
        if (document.querySelectorAll('.fixed.inset-0:not(.pointer-events-none)').length <= 0) {
            document.body.style.overflow = '';
        }
        if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
            lastActiveElement.focus();
        }
    }
}

function handleModalBackdrop(event, modalId, boxId, closeFnName) {
    const box = document.getElementById(boxId);
    if (box && !box.contains(event.target)) {
        window[closeFnName]();
    }
}

function openSoundSettingsModal() { AudioEngine.play('click'); toggleModal("sound-settings-modal", "sound-box", true); }
function closeSoundSettingsModal() { AudioEngine.play('click'); toggleModal("sound-settings-modal", "sound-box", false); }

function openStatsModal() {
    AudioEngine.play('click');
    document.getElementById("stat-mastered-count").innerText = `${masteredWords.size} / ${cards.length || 84}`;
    document.getElementById("stat-streak-count").innerText = `${hero.streak}x`;
    document.getElementById("stat-level").innerText = `LVL ${hero.level}`;
    document.getElementById("stat-xp").innerText = `${hero.xp} XP`;
    document.getElementById("stat-bookmarks").innerText = bookmarkedWords.size;
    toggleModal("stats-modal", "stats-box", true);
}
function closeStatsModal() { AudioEngine.play('click'); toggleModal("stats-modal", "stats-box", false); }

function exportProgress() {
    AudioEngine.play('click');
    try {
        const backup = {};
        Object.keys(localStorage).filter(k => k.startsWith('a2_')).forEach(k => backup[k] = localStorage.getItem(k));
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `a2_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        a.remove();
    } catch (e) {
        showToast('Помилка експорту даних', 'error');
    }
}

function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm("⚠️ Замінити поточний прогрес даними з файлу?")) {
                Object.keys(data).forEach(k => { if (k.startsWith('a2_')) localStorage.setItem(k, data[k]); });
                window.location.reload();
            }
        } catch (err) {
            showToast('Пошкоджений файл резервної копії', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    TelegramBridge.init();

    try {
        const res = await fetch('words.json');
        if (!res.ok) throw new Error();
        const data = await res.json();
        cards = Array.isArray(data) && data.length > 0 ? data.map(c => ({
            german: c.german || "Beispiel",
            grammar: c.grammar || "Nomen",
            ukrainian: c.ukrainian || "приклад",
            hint: c.hint || "",
            emoji: c.emoji || "📌",
            sentence: c.sentence || "",
            rarity: c.rarity || "звичайний",
            article: c.article || "none"
        })) : [{ german: "das Beispiel", grammar: "Nomen", ukrainian: "приклад", hint: "Демонстрація", emoji: "📌", sentence: "Das ist ein Beispiel.", article: "das" }];
    } catch (e) {
        cards = [{ german: "der Fehler", grammar: "Nomen", ukrainian: "помилка", hint: "Проблема", emoji: "⚠️", sentence: "Ein Fehler ist aufgetreten.", article: "der" }];
    }

    masteredWords = new Set(StorageEngine.get('a2_mastered', []));
    bookmarkedWords = new Set(StorageEngine.get('a2_bookmarks', []));
    hero = StorageEngine.get('a2_hero', { level: 1, xp: 0, streak: 0, questsCompleted: { hackCount: 0, audioCount: 0, articleCount: 0, claimedRewards: { hack: false, audio: false, article: false, allCompleted: false } } });

    checkDailyLoginBonus();
    syncSoundUI();
    updateHeroUI();
    updateCard();
    initSwipeGestures();
    checkFirstTimeOnboarding();

    document.addEventListener('click', () => { AudioEngine.init(); }, { once: true });
});

window.addEventListener('keydown', (e) => {
    if (document.querySelector('.fixed.inset-0:not(.pointer-events-none)')) {
        if (e.key === 'Escape') {
            closeSoundSettingsModal();
            closeStatsModal();
            closeExamSimulator();
            closeArticleMiniGame();
        }
        return;
    }
    const gameView = document.getElementById("game-view-container");
    if (gameView && !gameView.classList.contains("hidden")) {
        if (e.key === 'ArrowRight' || e.key === 'd') nextCard();
        else if (e.key === 'ArrowLeft' || e.key === 'a') prevCard();
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
        else if (e.key === 's' || e.key === 'і') { e.preventDefault(); speakWord(); }
    }
});
```[cite: 4]

---

### 5. `index.html`[cite: 5]
```html
<!DOCTYPE html>
<html lang="uk" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>DE B1 RPG Studio — Німецька мова</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body class="min-h-screen flex flex-col items-center justify-between p-4 selection:bg-cyan-500 selection:text-slate-950">

    <!-- HEADER / NAVIGATION -->
    <header class="w-full max-w-md flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
            <div class="glass-panel px-3.5 py-2 rounded-2xl border border-cyan-500/30 flex items-center gap-2 shadow-md" role="region" aria-label="Рівень агента">
                <i class="fa-solid fa-shield-halved text-cyan-400" aria-hidden="true"></i>
                <span id="hero-level-label" class="text-xs font-black text-white">LVL 1</span>
            </div>
            <div class="glass-panel px-3.5 py-2 rounded-2xl border border-pink-500/30 flex items-center gap-2 shadow-md" role="region" aria-label="Стрік">
                <i class="fa-solid fa-fire text-pink-400" aria-hidden="true"></i>
                <span id="hero-streak-label" class="text-xs font-black text-white">0x</span>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <button onclick="openStatsModal()" aria-label="Статистика" class="interactive-btn glass-panel text-cyan-300 px-3 py-2.5 rounded-xl border border-cyan-500/30 text-xs font-bold flex items-center gap-2 hover:bg-slate-800">
                <i class="fa-solid fa-chart-pie text-cyan-400" aria-hidden="true"></i>
            </button>
            <button onclick="openExamSimulator()" aria-label="Екзамен B1" class="interactive-btn glass-panel text-pink-400 px-3 py-2.5 rounded-xl border border-pink-500/30 text-xs font-bold flex items-center gap-2 hover:bg-slate-800">
                <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>
            </button>
            <button onclick="toggleAudioMute()" id="sound-master-btn-header" aria-label="Звук" class="interactive-btn glass-panel text-cyan-400 p-2.5 rounded-xl border border-cyan-500/30 hover:bg-slate-800">
                <i id="sound-icon" class="fa-solid fa-volume-high" aria-hidden="true"></i>
            </button>
            <button onclick="openSoundSettingsModal()" aria-label="Налаштування" class="interactive-btn glass-panel text-slate-300 p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800">
                <i class="fa-solid fa-gear" aria-hidden="true"></i>
            </button>
        </div>
    </header>

    <!-- MAIN VIEW CONTAINER -->
    <main class="w-full max-w-md flex-1 flex flex-col justify-center relative">
        
        <!-- MODE SWITCHER TABS & MINI-GAMES -->
        <div class="flex justify-between items-center mb-3">
            <div class="flex gap-2" role="tablist" aria-label="Режими відображення">
                <button onclick="switchDisplayMode('game')" id="mode-game-btn" role="tab" aria-selected="true" class="interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20">КАРТКИ</button>
                <button onclick="switchDisplayMode('compact')" id="mode-compact-btn" role="tab" aria-selected="false" class="interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700">БЛОК</button>
            </div>
            <button onclick="openArticleMiniGame()" class="interactive-btn glass-panel text-yellow-400 border border-yellow-500/40 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-bolt"></i> АРТИКЛІ
            </button>
        </div>

        <!-- GAME VIEW CONTAINER -->
        <div id="game-view-container" class="space-y-4">
            <!-- Theme Progress & Daily Quests Widget -->
            <div class="glass-panel p-3.5 rounded-2xl border border-cyan-500/30 space-y-2">
                <div class="flex items-center justify-between">
                    <div class="text-xs font-bold text-slate-300">ПРОГРЕС ТЕМИ A2</div>
                    <div id="theme-progress-text" class="text-xs font-black text-cyan-400">0%</div>
                </div>
                <!-- Daily Bounties -->
                <div class="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800 text-[10px] text-slate-300 font-bold">
                    <div class="flex flex-col items-center bg-slate-900/60 p-1.5 rounded-xl border border-cyan-500/20 text-center">
                        <span class="text-[9px] text-slate-400">Душі</span>
                        <span id="quest-hack-progress" class="text-cyan-400 font-black">0/3</span>
                    </div>
                    <div class="flex flex-col items-center bg-slate-900/60 p-1.5 rounded-xl border border-emerald-500/20 text-center">
                        <span class="text-[9px] text-slate-400">Аудіо</span>
                        <span id="quest-audio-progress" class="text-emerald-400 font-black">0/3</span>
                    </div>
                    <div class="flex flex-col items-center bg-slate-900/60 p-1.5 rounded-xl border border-yellow-500/20 text-center">
                        <span class="text-[9px] text-slate-400">Артиклі</span>
                        <span id="quest-article-progress" class="text-yellow-400 font-black">0/2</span>
                    </div>
                </div>
            </div>

            <!-- FLASHCARD CONTAINER -->
            <div class="perspective w-full h-[320px] cursor-pointer" onclick="flipCard()">
                <div id="flashcard-inner" class="relative w-full h-full duration-500 transform-gpu preserve-3d shadow-[0_20px_50px_rgba(6,182,212,0.15)] rounded-3xl">
                    
                    <!-- FRONT FACE -->
                    <div class="absolute inset-0 w-full h-full glass-panel border border-cyan-500/40 rounded-3xl p-6 flex flex-col justify-between backface-hidden">
                        <div class="flex justify-between items-center">
                            <span id="card-rarity-badge" class="text-[10px] font-black px-2.5 py-1 rounded-md border border-cyan-500/30 text-cyan-300 uppercase">ЗВИЧАЙНИЙ</span>
                            <span id="card-index-indicator" class="text-xs font-bold text-slate-400">1 / 84</span>
                        </div>
                        <div class="text-center space-y-3">
                            <div id="card-emoji" class="text-6xl mb-1">📌</div>
                            <div id="card-german" class="text-2xl font-black text-white tracking-wide">Beispiel</div>
                            <div id="card-grammar" class="text-xs font-bold text-pink-400 uppercase tracking-widest">Nomen, n.</div>
                        </div>
                        <div class="text-center text-[11px] text-slate-400 font-bold">Натисни або свайпни, щоб перевернути</div>
                    </div>

                    <!-- BACK FACE -->
                    <div class="absolute inset-0 w-full h-full glass-panel border border-pink-500/40 rounded-3xl p-6 flex flex-col justify-between backface-hidden rotate-y-180">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] font-black px-2.5 py-1 rounded-md border border-pink-500/30 text-pink-300 uppercase">ПЕРЕКЛАД</span>
                            <span class="text-xs font-bold text-slate-400">А2 ЛЕКСИКА</span>
                        </div>
                        <div class="text-center space-y-3">
                            <div id="card-ukrainian" class="text-2xl font-black text-emerald-400">приклад</div>
                            <div id="card-hint" class="text-xs text-slate-300 italic">Демонстрація чогось</div>
                            <div id="card-sentence" class="text-[11px] text-cyan-300 bg-slate-900/50 p-2.5 rounded-xl border border-cyan-500/20">Das ist ein Beispiel.</div>
                        </div>
                        <div class="text-center text-[11px] text-slate-400 font-bold">Зворотний бік картки</div>
                    </div>

                </div>
            </div>

            <!-- CONTROLS ROW -->
            <div class="grid grid-cols-5 gap-2 mt-5">
                <button onclick="prevCard()" aria-label="Попередня картка" class="interactive-btn glass-panel text-slate-300 py-3 px-1 rounded-2xl text-[11px] font-bold border border-cyan-500/20 flex flex-col items-center shadow-md">
                    <i class="fa-solid fa-arrow-left text-sm mb-1 text-cyan-400" aria-hidden="true"></i> <span class="truncate">НАЗАД</span>
                </button>
                <button onclick="flipCard()" aria-label="Перевернути картку" class="interactive-btn glass-panel text-cyan-400 py-3 px-1 rounded-2xl text-[11px] font-bold border border-cyan-500/20 flex flex-col items-center shadow-md">
                    <i class="fa-solid fa-rotate text-sm mb-1" aria-hidden="true"></i> <span class="truncate">ОБЕРТ</span>
                </button>
                <button onclick="speakWord()" aria-label="Озвучити слово" class="interactive-btn glass-panel text-emerald-400 py-3 px-1 rounded-2xl text-[11px] font-bold border border-emerald-500/20 flex flex-col items-center shadow-md">
                    <i class="fa-solid fa-volume-high text-sm mb-1" aria-hidden="true"></i> <span class="truncate">АУДІО</span>
                </button>
                <button onclick="nextCard()" aria-label="Наступна картка" class="interactive-btn bg-cyan-400 text-slate-950 py-3 px-1 rounded-2xl text-[11px] font-black flex flex-col items-center shadow-[0_5px_15px_rgba(6,182,212,0.4)]">
                    <i class="fa-solid fa-arrow-right text-sm mb-1" aria-hidden="true"></i> <span class="truncate">ДАЛІ</span>
                </button>
                <button onclick="toggleBookmark()" id="card-bookmark-btn" aria-label="Додати в обране" class="interactive-btn glass-panel text-slate-400 hover:text-yellow-400 py-3 px-1 rounded-2xl border border-slate-700 flex flex-col items-center shadow-md">
                    <i class="fa-regular fa-star text-sm mb-1" aria-hidden="true"></i> <span class="truncate">ЗІРКА</span>
                </button>
            </div>

            <!-- SOUL HACK ACTION BUTTON -->
            <button onclick="attackEnemyClick()" id="soul-hack-btn" class="interactive-btn w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] mt-2">
                <i class="fa-solid fa-bolt" aria-hidden="true"></i> Зламати душу
            </button>
        </div>

        <!-- COMPACT BLOCK VIEW -->
        <div id="compact-block-view" class="hidden space-y-4 animate-[fade-in_0.3s_ease-out]">
            <div class="glass-panel p-4 rounded-3xl border border-cyan-500/30 space-y-3">
                <div class="flex items-center gap-3">
                    <i class="fa-solid fa-magnifying-glass text-cyan-400" aria-hidden="true"></i>
                    <input type="text" id="compact-search-input" oninput="filterCompactWords(this.value)" placeholder="Шукати слово..." aria-label="Шукати слово" class="w-full bg-transparent text-white text-xs font-bold placeholder-slate-500 focus:outline-none">
                    <button onclick="clearCompactSearch()" aria-label="Очистити пошук" class="interactive-btn text-slate-400 hover:text-white text-xs px-2"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
                </div>
                <!-- Фільтри рідкості та обраного -->
                <div class="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800" id="rarity-filter-pills">
                    <button onclick="setRarityFilter('all')" class="interactive-btn text-[10px] font-black px-2.5 py-1 rounded-lg bg-cyan-400 text-slate-950">ВСІ</button>
                    <button onclick="setRarityFilter('звичайний')" class="interactive-btn text-[10px] font-black px-2.5 py-1 rounded-lg glass-panel text-slate-300 border border-slate-700">ЗВИЧАЙНИЙ</button>
                    <button onclick="setRarityFilter('рідкісний')" class="interactive-btn text-[10px] font-black px-2.5 py-1 rounded-lg glass-panel text-cyan-400 border border-cyan-500/30">РІДКІСНИЙ</button>
                    <button onclick="setRarityFilter('епічний')" class="interactive-btn text-[10px] font-black px-2.5 py-1 rounded-lg glass-panel text-purple-400 border border-purple-500/30">ЕПІЧНИЙ</button>
                    <button onclick="setRarityFilter('легендарний')" class="interactive-btn text-[10px] font-black px-2.5 py-1 rounded-lg glass-panel text-yellow-400 border border-yellow-500/30">ЛЕГЕНДАРНИЙ</button>
                    <button onclick="setRarityFilter('bookmarked')" class="interactive-btn text-[10px] font-black px-2.5 py-1 rounded-lg glass-panel text-yellow-400 border border-yellow-500/30">⭐️ ОБРАНЕ</button>
                </div>
            </div>
            
            <div id="compact-words-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-12 max-h-[60vh] overflow-y-auto"></div>
        </div>

    </main>

    <!-- WELCOME / ONBOARDING MODAL -->
    <div id="welcome-modal" onclick="handleModalBackdrop(event, 'welcome-modal', 'welcome-box', 'closeWelcomeModal')" class="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true" aria-label="Вітання">
        <div class="glass-panel border border-cyan-500/50 rounded-3xl w-full max-w-sm p-6 shadow-[0_20px_50px_rgba(6,182,212,0.2)] transform scale-90 translate-y-4 transition-all duration-400 space-y-4 text-center" id="welcome-box">
            <div class="text-5xl mb-2">⚡</div>
            <h3 class="font-black text-base text-cyan-400 uppercase tracking-widest">Вітаємо у DE B1 RPG Studio!</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
                Це гра для вивчення німецької мови. Перевертай картки, слухай вимову, зламуй душі слів та виконуй щоденні квести заради прокачки рівня!
            </p>
            <button onclick="closeWelcomeModal()" class="interactive-btn w-full bg-cyan-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ ГРУ</button>
        </div>
    </div>

    <!-- SOUND SETTINGS MODAL -->
    <div id="sound-settings-modal" onclick="handleModalBackdrop(event, 'sound-settings-modal', 'sound-box', 'closeSoundSettingsModal')" class="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true" aria-label="Налаштування">
        <div class="glass-panel border border-cyan-500/40 rounded-3xl w-full max-w-sm p-6 shadow-[0_20px_50px_rgba(6,182,212,0.15)] transform scale-90 translate-y-4 transition-all duration-400 max-h-[85vh] overflow-y-auto" id="sound-box">
            <div class="flex justify-between items-center mb-5 pb-3 border-b border-slate-700/50">
                <h3 class="font-black text-sm text-cyan-400 flex items-center gap-2 tracking-widest uppercase"><i class="fa-solid fa-sliders" aria-hidden="true"></i> Налаштування</h3>
                <button onclick="closeSoundSettingsModal()" aria-label="Закрити" class="interactive-btn text-slate-400 hover:text-white p-2 bg-slate-800/50 rounded-xl"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
            <div class="space-y-4 text-xs font-bold">
                <div class="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-cyan-500/20">
                    <span class="text-slate-200 uppercase tracking-wide">Система аудіо</span>
                    <button onclick="toggleAudioMute()" id="sound-master-btn" class="interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-950 shadow-md">УВІМКНЕНО</button>
                </div>
                <div class="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-cyan-500/20">
                    <span class="text-slate-200 uppercase tracking-wide">Автоозвучка при овертоті</span>
                    <button onclick="toggleAutoSpeak()" id="sound-autospeak-btn" class="interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-slate-500">ВИМКНЕНО</button>
                </div>
                <div class="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-cyan-500/20">
                    <span class="text-slate-200 uppercase tracking-wide">Швидкість вимови</span>
                    <button onclick="toggleSpeechRate()" id="sound-rate-btn" class="interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-cyan-400 border border-cyan-500/30">НОРМАЛЬНА (0.9X)</button>
                </div>
                <div class="bg-slate-900/50 p-4 rounded-2xl border border-cyan-500/20 space-y-2">
                    <div class="flex justify-between items-center text-slate-300">
                        <span>Гучність ефектів</span>
                        <span id="volume-val-label" class="text-cyan-400">50%</span>
                    </div>
                    <input type="range" min="0" max="100" value="50" id="sound-volume-slider" oninput="updateAudioVolume(this.value)" aria-label="Гучність ефектів" class="w-full accent-cyan-400 cursor-pointer">
                </div>
                <div class="bg-slate-900/50 p-4 rounded-2xl border border-cyan-500/20 space-y-3">
                    <div class="text-slate-300 uppercase tracking-wide">Резервна копія даних</div>
                    <div class="flex gap-2">
                        <button onclick="exportProgress()" class="interactive-btn bg-slate-800 text-cyan-300 py-2.5 px-3 rounded-xl font-bold text-[11px] flex-1 hover:bg-slate-700 flex items-center justify-center gap-1.5 border border-cyan-500/30">
                            <i class="fa-solid fa-download" aria-hidden="true"></i> ЕКСПОРТ
                        </button>
                        <label class="interactive-btn bg-slate-800 text-pink-300 py-2.5 px-3 rounded-xl font-bold text-[11px] flex-1 hover:bg-slate-700 flex items-center justify-center gap-1.5 cursor-pointer border border-pink-500/30">
                            <i class="fa-solid fa-upload" aria-hidden="true"></i> ІМПОРТ
                            <input type="file" id="import-file-input" accept=".json" onchange="importProgress(event)" aria-label="Імпорт файлу резервної копії" class="hidden">
                        </label>
                    </div>
                </div>
                <button onclick="closeSoundSettingsModal()" class="interactive-btn w-full bg-cyan-500 text-slate-950 py-3.5 rounded-2xl font-black text-xs mt-2 shadow-[0_5px_15px_rgba(6,182,212,0.3)]">ЗБЕРЕГТИ НАЛАШТУВАННЯ</button>
            </div>
        </div>
    </div>

    <!-- STATS MODAL -->
    <div id="stats-modal" onclick="handleModalBackdrop(event, 'stats-modal', 'stats-box', 'closeStatsModal')" class="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true" aria-label="Статистика">
        <div class="glass-panel border border-cyan-500/40 rounded-3xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(6,182,212,0.15)] transform scale-90 translate-y-4 transition-all duration-400 max-h-[85vh] overflow-y-auto" id="stats-box">
            <div class="flex justify-between items-center mb-5 pb-3 border-b border-cyan-500/20">
                <h3 class="font-black text-sm text-cyan-400 uppercase tracking-widest"><i class="fa-solid fa-chart-pie mr-2" aria-hidden="true"></i> Статистика</h3>
                <button onclick="closeStatsModal()" aria-label="Закрити" class="interactive-btn text-cyan-400 hover:text-white p-2 bg-cyan-900/20 rounded-xl"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
            <div class="space-y-4 text-xs">
                <div class="grid grid-cols-2 gap-3">
                    <div class="glass-panel p-4 rounded-2xl border border-cyan-500/30 text-center">
                        <div class="text-[10px] text-slate-400 uppercase font-bold mb-1">Зламано душ</div>
                        <div id="stat-mastered-count" class="text-2xl font-black text-cyan-400">0 / 84</div>
                    </div>
                    <div class="glass-panel p-4 rounded-2xl border border-pink-500/30 text-center">
                        <div class="text-[10px] text-slate-400 uppercase font-bold mb-1">Поточний Стрік</div>
                        <div id="stat-streak-count" class="text-2xl font-black text-pink-400">0x</div>
                    </div>
                </div>
                <div class="glass-panel p-4 rounded-2xl border border-slate-700 space-y-3">
                    <div class="flex justify-between font-bold text-slate-300">
                        <span>Рівень агента:</span>
                        <span id="stat-level" class="text-cyan-400">LVL 1</span>
                    </div>
                    <div class="flex justify-between font-bold text-slate-300">
                        <span>Досвід (XP):</span>
                        <span id="stat-xp" class="text-pink-400">0 XP</span>
                    </div>
                    <div class="flex justify-between font-bold text-slate-300">
                        <span>Обраних слів:</span>
                        <span id="stat-bookmarks" class="text-yellow-400">0</span>
                    </div>
                </div>
                <button onclick="closeStatsModal()" class="interactive-btn w-full bg-cyan-400 text-slate-950 py-3.5 rounded-xl font-black text-xs shadow-[0_5px_15px_rgba(6,182,212,0.4)]">ЗАКРИТИ СТАТИСТИКУ</button>
            </div>
        </div>
    </div>

    <!-- EXAM SIMULATOR MODAL -->
    <div id="exam-modal" onclick="handleModalBackdrop(event, 'exam-modal', 'exam-box', 'closeExamSimulator')" class="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true" aria-label="Симулятор B1 Іспиту">
        <div class="glass-panel border border-pink-500/40 rounded-3xl w-full max-w-lg p-6 shadow-[0_20px_50px_rgba(236,72,153,0.15)] transform scale-90 translate-y-4 transition-all duration-400 max-h-[85vh] overflow-y-auto" id="exam-box">
            <div class="flex justify-between items-center mb-5 pb-3 border-b border-pink-500/20">
                <h3 class="font-black text-sm text-pink-400 uppercase tracking-widest"><i class="fa-solid fa-graduation-cap mr-2" aria-hidden="true"></i> Симулятор B1 Іспиту</h3>
                <button onclick="closeExamSimulator()" aria-label="Закрити" class="interactive-btn text-pink-400 hover:text-white p-2 bg-pink-900/20 rounded-xl"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
            <div id="exam-content" class="space-y-4">
                <div class="text-center py-6 space-y-4">
                    <div class="text-4xl">🎓</div>
                    <div class="text-sm font-bold text-slate-300">Перевір готовність до іспиту B1! Тест складається з 10 випадкових питань.</div>
                    <button onclick="startExamSession()" class="interactive-btn w-full max-w-xs mx-auto bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-black text-sm shadow-[0_10px_25px_rgba(236,72,153,0.4)]">ПОЧАТИ ТЕСТ</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ARTICLE RUSH MINI-GAME MODAL -->
    <div id="article-modal" onclick="handleModalBackdrop(event, 'article-modal', 'article-box', 'closeArticleMiniGame')" class="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" role="dialog" aria-modal="true" aria-label="Дуель Артиклів">
        <div class="glass-panel border border-yellow-500/40 rounded-3xl w-full max-w-sm p-6 shadow-[0_20px_50px_rgba(234,179,8,0.15)] transform scale-90 translate-y-4 transition-all duration-400 max-h-[85vh] overflow-y-auto" id="article-box">
            <div class="flex justify-between items-center mb-5 pb-3 border-b border-yellow-500/20">
                <h3 class="font-black text-sm text-yellow-400 uppercase tracking-widest"><i class="fa-solid fa-bolt mr-2" aria-hidden="true"></i> Дуель Артиклів</h3>
                <button onclick="closeArticleMiniGame()" aria-label="Закрити" class="interactive-btn text-yellow-400 hover:text-white p-2 bg-yellow-900/20 rounded-xl"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
            <div id="article-content" class="space-y-4">
                <div class="text-center py-6 space-y-4">
                    <div class="text-4xl">⚡</div>
                    <div class="text-sm font-bold text-slate-300">Вибери правильний артикль (der / die / das) на швидкість!</div>
                    <button onclick="openArticleMiniGame()" class="interactive-btn w-full bg-yellow-400 text-slate-950 py-3.5 rounded-2xl font-black text-xs shadow-md">ПОЧАТИ ДУЕЛЬ</button>
                </div>
            </div>
        </div>
    </div>

    <!-- TOAST NOTIFICATION CONTAINER -->
    <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none" aria-live="polite"></div>

    <script src="speech.js"></script>
    <script src="app.js"></script>
</body>
</html>
```[cite: 5]
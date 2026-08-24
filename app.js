// ==========================================
// DE B1 RPG STUDIO - CORE APPLICATION ENGINE
// ==========================================

let cards = [];
let currentIndex = 0;
let isFlipped = false;
let masteredWords = new Set();
let bookmarkedWords = new Set();

let hero = {
    level: 1,
    xp: 0,
    streak: 0
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
    },
    clearPrefix(prefix) {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
            keys.forEach(k => localStorage.removeItem(k));
            Object.keys(this._memoryCache).forEach(k => {
                if (k.startsWith(prefix)) delete this._memoryCache[k];
            });
        } catch (e) {
            this._memoryCache = {};
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
    const borderColor = type === 'success' ? 'border-emerald-500/50 bg-emerald-950/80 text-emerald-300' : 
                        type === 'error' ? 'border-pink-500/50 bg-pink-950/80 text-pink-300' : 
                        'border-cyan-500/50 bg-slate-900/90 text-cyan-300';

    toast.className = `cyber-toast glass-panel px-4 py-3 rounded-2xl border ${borderColor} text-xs font-black shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center gap-2.5 pointer-events-auto`;
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${icon} text-sm"></i> <span>${message}</span>`;

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
// HERO & XP MANAGEMENT
// ==========================================
function updateHeroUI() {
    const lvlEl = document.getElementById("hero-level-label");
    const streakEl = document.getElementById("hero-streak-label");
    if (lvlEl) lvlEl.innerText = `LVL ${hero.level}`;
    if (streakEl) streakEl.innerText = `${hero.streak}x`;
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
// CARD NAVIGATION & INTERACTION
// ==========================================
function updateCard() {
    const card = cards[currentIndex];
    if (!card) return;

    document.getElementById("card-german").innerText = card.german;
    document.getElementById("card-grammar").innerText = card.grammar;
    document.getElementById("card-ukrainian").innerText = card.ukrainian;
    document.getElementById("card-hint").innerText = card.hint;
    document.getElementById("card-sentence").innerText = card.sentence;
    document.getElementById("card-emoji").innerText = card.emoji || '📌';
    document.getElementById("card-index-indicator").innerText = `${currentIndex + 1} / ${cards.length}`;

    const rObj = [{ name: 'звичайний', color: 'border-cyan-500/30 text-cyan-300' }, { name: 'рідкісний', color: 'border-cyan-400 text-cyan-300' }, { name: 'епічний', color: 'border-purple-400 text-purple-300' }, { name: 'легендарний', color: 'border-yellow-400 text-yellow-300' }].find(r => r.name === card.rarity) || { name: 'звичайний', color: 'border-cyan-500/30 text-cyan-300' };
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
    AudioEngine.play('click');
    Haptics.trigger('light');
    currentIndex = (currentIndex + 1) % cards.length;
    updateCard();
}

function prevCard() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCard();
}

function updateMasteredUI() {
    const card = cards[currentIndex];
    if (!card) return;
    const isM = masteredWords.has(card.german);
    const btn = document.getElementById("soul-hack-btn");
    
    if (isM) {
        if (btn) {
            btn.className = "interactive-btn w-full glass-panel text-slate-500 border border-slate-700 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed mt-2";
            btn.innerHTML = `<i class="fa-solid fa-ghost"></i> Душу зламано ✓`;
            btn.disabled = true;
        }
    } else {
        if (btn) {
            btn.className = "interactive-btn w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] mt-2";
            btn.innerHTML = `<i class="fa-solid fa-bolt"></i> Зламати душу`;
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
    const card = cards[currentIndex];
    if (!card || masteredWords.has(card.german)) return;

    masteredWords.add(card.german);
    StorageEngine.set('a2_mastered', Array.from(masteredWords));
    
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
    btn.innerHTML = `<i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star text-sm mb-1"></i> <span class="truncate">ЗІРКА</span>`;
}

// ==========================================
// DISPLAY MODES & COMPACT VIEW
// ==========================================
let isCompactDirty = true;
let currentSearchQuery = "";
let currentRarityFilter = 'all';

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
        if (btnCompact) btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
        if (btnGame) btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
        
        if (isCompactDirty) {
            renderCompactBlock();
            isCompactDirty = false;
        }
    } else {
        if (compactView) compactView.classList.add("hidden"); 
        if (gameView) gameView.classList.remove("hidden");
        if (btnGame) btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
        if (btnCompact) btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
    }
}

function filterCompactWords(query) {
    currentSearchQuery = query.toLowerCase().trim();
    renderCompactBlock();
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
        return card.german.toLowerCase().includes(currentSearchQuery) || 
               card.ukrainian.toLowerCase().includes(currentSearchQuery) ||
               card.grammar.toLowerCase().includes(currentSearchQuery);
    });

    if (filteredCards.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-slate-500 text-xs font-bold">
                <i class="fa-solid fa-triangle-exclamation text-xl mb-2 text-pink-500 block"></i>
                Нічого не знайдено
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredCards.map((card) => {
        const isMastered = masteredWords.has(card.german);
        const isBookmarked = bookmarkedWords.has(card.german);
        return `
            <div onclick="jumpToCardFromCompact('${card.german.replace(/'/g, "\\'")}')" class="interactive-btn glass-panel p-3.5 rounded-2xl border ${isMastered ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-700/60'} flex items-center justify-between cursor-pointer hover:border-cyan-400/60 shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-xl">${card.emoji || '📌'}</span>
                    <div>
                        <div class="text-xs font-black text-white">${card.german} ${isBookmarked ? '⭐️' : ''}</div>
                        <div class="text-[10px] text-emerald-400 font-bold">${card.ukrainian}</div>
                    </div>
                </div>
                ${isMastered ? '<span class="text-[9px] text-emerald-400 font-bold"><i class="fa-solid fa-check"></i> Зламано</span>' : ''}
            </div>
        `;
    }).join('');
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
    const wrongOptions = cards.filter(c => c.ukrainian !== currentCard.ukrainian).sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.ukrainian);
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
    setTimeout(() => {
        renderExamQuestion();
    }, 900);
}

// ==========================================
// MODALS & BACKUP
// ==========================================
function toggleModal(modalId, boxId, show) {
    const modal = document.getElementById(modalId);
    const box = document.getElementById(boxId);
    if (!modal || !box) return;
    
    if (show) {
        document.body.style.overflow = 'hidden';
        modal.classList.remove("pointer-events-none", "opacity-0");
        modal.classList.add("opacity-100");
        box.classList.remove("scale-90", "opacity-0", "translate-y-4");
        box.classList.add("scale-100", "opacity-100", "translate-y-0");
    } else {
        box.classList.remove("scale-100", "opacity-100", "translate-y-0");
        box.classList.add("scale-90", "opacity-0", "translate-y-4");
        modal.classList.remove("opacity-100");
        modal.classList.add("opacity-0", "pointer-events-none");
        if (document.querySelectorAll('.fixed.inset-0:not(.pointer-events-none)').length <= 0) {
            document.body.style.overflow = '';
        }
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
        cards = Array.isArray(data) && data.length > 0 ? data : [{ german: "das Beispiel", grammar: "Nomen", ukrainian: "приклад", hint: "Демонстрація", emoji: "📌", sentence: "Das ist ein Beispiel." }];
    } catch (e) {
        cards = [{ german: "der Fehler", grammar: "Nomen", ukrainian: "помилка", hint: "Проблема", emoji: "⚠️", sentence: "Ein Fehler ist aufgetreten." }];
    }

    masteredWords = new Set(StorageEngine.get('a2_mastered', []));
    bookmarkedWords = new Set(StorageEngine.get('a2_bookmarks', []));
    hero = StorageEngine.get('a2_hero', { level: 1, xp: 0, streak: 0 });

    checkDailyLoginBonus();
    syncSoundUI();
    updateHeroUI();
    updateCard();

    document.addEventListener('click', () => { AudioEngine.init(); }, { once: true });
});

window.addEventListener('keydown', (e) => {
    if (document.querySelector('.fixed.inset-0:not(.pointer-events-none)')) {
        if (e.key === 'Escape') {
            closeSoundSettingsModal();
            closeStatsModal();
            closeExamSimulator();
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
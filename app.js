const APP_VERSION = "v2.1.0 (Polished)";

const StorageEngine = {
    get(key, fallback) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? JSON.parse(item) : fallback;
        } catch (e) {
            console.warn(`[Storage] Read error for key "${key}":`, e);
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`[Storage] Write error for key "${key}":`, e);
        }
    }
};

const Haptics = {
    trigger(type = 'light') {
        try {
            const tg = window.Telegram?.WebApp;
            if (tg && tg.HapticFeedback) {
                if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(type)) {
                    tg.HapticFeedback.impactOccurred(type);
                } else if (['error', 'success', 'warning'].includes(type)) {
                    tg.HapticFeedback.notificationOccurred(type);
                }
            }
        } catch (e) { console.warn("Haptics not supported"); }
    }
};

const AudioEngine = {
    ctx: null,
    muted: StorageEngine.get('a2_muted', false),
    volumes: StorageEngine.get('a2_volumes', {"click":0.5,"hit":0.5,"success":0.5,"error":0.5}),
    init() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    play(type) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const vol = this.volumes[type] !== undefined ? this.volumes[type] : 0.5;
        if (vol <= 0) return;
        
        if (type === 'click' || type === 'flip') {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.frequency.setValueAtTime(type === 'flip' ? 350 : 440, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
            g.gain.setValueAtTime(0.03 * vol, now);
            g.gain.linearRampToValueAtTime(0.001, now + 0.04);
            osc.connect(g); g.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.04);
        } else if (type === 'hit') {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.linearRampToValueAtTime(70, now + 0.07);
            g.gain.setValueAtTime(0.04 * vol, now);
            g.gain.linearRampToValueAtTime(0.001, now + 0.07);
            osc.connect(g); g.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.07);
        } else if (type === 'success' || type === 'levelup') {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now + i * 0.05);
                g.gain.setValueAtTime(0.04 * vol, now + i * 0.05);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
                osc.connect(g); g.connect(this.ctx.destination);
                osc.start(now + i * 0.05); osc.stop(now + i * 0.05 + 0.15);
            });
        } else if (type === 'error') {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.08);
            g.gain.setValueAtTime(0.04 * vol, now);
            g.gain.linearRampToValueAtTime(0.001, now + 0.08);
            osc.connect(g); g.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.08);
        }
    }
};

const tg = window.Telegram?.WebApp;
let tgUser = tg?.initDataUnsafe?.user;

if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('#030712');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#030712');
}

let hero = {
    telegramId: tgUser ? tgUser.id : 'local_pc_user',
    name: tgUser ? (tgUser.first_name || 'Cyber-Runner') : 'Микола',
    level: parseInt(StorageEngine.get('a2_hero_level', 1)),
    xp: parseInt(StorageEngine.get('a2_hero_xp', 0)),
    maxXp: 100,
    cls: StorageEngine.get('a2_hero_class', 'Cyber-Runner'),
    weapon: StorageEngine.get('a2_weapon', 'neural_blade'),
    visor: StorageEngine.get('a2_visor', false),
    pet: StorageEngine.get('a2_pet', '🐲'),
    streak: 0
};

hero.maxXp = 100 + Math.max(0, hero.level - 1) * 50;
let trophies = StorageEngine.get('a2_trophies', []);
let envIndex = 0;
const environments = [
    { name: "🌆 Cyber Berlin", class: "glass-panel", border: "border-cyan-500/30" },
    { name: "⚡ Neon Trap", class: "glass-panel", border: "border-pink-500/30" },
    { name: "🕶️ Underworld", class: "bg-slate-950", border: "border-indigo-500/30" }
];

const rarities = [
    { name: "Common", color: "text-slate-300 border-slate-700 bg-slate-900/80", chance: 0.6 },
    { name: "Rare", color: "text-cyan-400 border-cyan-500/50 bg-cyan-500/10", chance: 0.25 },
    { name: "Epic", color: "text-purple-400 border-purple-500/50 bg-purple-500/10", chance: 0.1 },
    { name: "Legendary", color: "text-pink-400 border-pink-500/50 bg-pink-500/20", chance: 0.05 }
];

const slangPhrases = ["Bock drauf!", "Digga, läuft!", "Sheesh!", "Ehrenmann!", "Voll cringe!"];

let cards = [];
let currentIndex = 0;
let isFlipped = false;
let isFlipLocked = false;
let maxBossHp = 3000;
let wordHpMap = StorageEngine.get('a2_word_hp_map', {});
let masteredWords = new Set(StorageEngine.get('a2_mastered_thema8', []));
let claimedAchievements = StorageEngine.get('a2_achievements', []);

function getCurrentWordHp() {
    const card = cards[currentIndex];
    if (!card) return maxBossHp;
    if (masteredWords.has(card.german)) return 0;
    if (wordHpMap[card.german] !== undefined) return wordHpMap[card.german];
    return maxBossHp;
}

function setCurrentWordHp(val) {
    const card = cards[currentIndex];
    if (!card) return;
    wordHpMap[card.german] = Math.max(0, val);
    StorageEngine.set('a2_word_hp_map', wordHpMap);
}

function updateHeroUI() {
    const lvlEl = document.getElementById("hero-level-badge");
    if (lvlEl) lvlEl.innerText = `LVL ${hero.level}`;
    const clsEl = document.getElementById("hero-class-label");
    if (clsEl) clsEl.innerText = hero.cls;
    const petEl = document.getElementById("pet-display");
    if (petEl) petEl.innerText = hero.pet;
    
    const verEl = document.getElementById("app-version-badge");
    if (verEl) verEl.innerText = APP_VERSION;
    
    const pct = Math.min(100, (hero.xp / hero.maxXp) * 100);
    const xpBar = document.getElementById("hero-xp-bar");
    if (xpBar) xpBar.style.width = `${pct}%`;
    const xpText = document.getElementById("hero-xp-text");
    if (xpText) xpText.innerText = `XP: ${hero.xp} / ${hero.maxXp}`;
    
    const combo = document.getElementById("combo-badge");
    if (combo) combo.innerText = `x${Math.min(5, 1 + Math.floor(hero.streak / 3))}`;
    const slang = document.getElementById("slang-hint");
    if (slang) slang.innerText = `"${slangPhrases[hero.streak % slangPhrases.length]}"`;
    
    const weaponLine = document.getElementById("hero-weapon-line");
    if (weaponLine) {
        if (hero.weapon === 'neural_blade') {
            weaponLine.setAttribute("x2", "94"); weaponLine.setAttribute("y2", "30");
            weaponLine.setAttribute("class", "stroke-pink-500 stroke-[4.5]");
        } else if (hero.weapon === 'cyber_staff') {
            weaponLine.setAttribute("x2", "96"); weaponLine.setAttribute("y2", "20");
            weaponLine.setAttribute("class", "stroke-cyan-400 stroke-[5]");
        }
    }

    const visor = document.getElementById("hero-visor");
    if (visor) {
        if (hero.visor) visor.classList.remove("hidden"); else visor.classList.add("hidden");
    }

    const invBadge = document.getElementById("inv-count-badge");
    if (invBadge) invBadge.innerText = trophies.length;
    const subTrophies = document.getElementById("sub-trophies-count");
    if (subTrophies) subTrophies.innerText = trophies.length;
    const subTrophiesInv = document.getElementById("sub-trophies-count-inv");
    if (subTrophiesInv) subTrophiesInv.innerText = trophies.length;
    
    updateAchievementsCount();
    renderInlineTrophies();

    StorageEngine.set('a2_hero_level', hero.level);
    StorageEngine.set('a2_hero_xp', hero.xp);
    StorageEngine.set('a2_hero_class', hero.cls);
    StorageEngine.set('a2_weapon', hero.weapon);
    StorageEngine.set('a2_visor', hero.visor);
    StorageEngine.set('a2_pet', hero.pet);
}

function addXp(amount, emoji, word, isSystemReward = false) {
    if (!isSystemReward) {
        hero.streak++;
        if (hero.streak > 1 && hero.streak % 3 === 0) {
            AudioEngine.play('success');
            Haptics.trigger('success');
        }
        const mult = Math.min(5, 1 + Math.floor(hero.streak / 3));
        hero.xp += amount * mult;
    } else {
        hero.xp += amount;
    }

    if (emoji && word) {
        const rand = Math.random();
        let acc = 0, chosen = rarities[0];
        for (let r of rarities) { acc += r.chance; if (rand <= acc) { chosen = r; break; } }
        if (!trophies.find(t => t.emoji === emoji && t.german === word)) {
            trophies.push({ emoji, rarity: chosen.name, german: word });
            StorageEngine.set('a2_trophies', trophies);
        }
    }

    let leveledUp = false;
    while (hero.xp >= hero.maxXp) {
        hero.xp -= hero.maxXp;
        hero.level++;
        hero.maxXp += 50;
        leveledUp = true;
    }
    if (leveledUp) {
        AudioEngine.play('levelup');
        Haptics.trigger('success');
        if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 140, origin: { y: 0.5 }, colors: ['#06b6d4', '#ec4899', '#fcd34d'] });
    }
    updateHeroUI();
}

function cycleEnvironment() {
    AudioEngine.play('click');
    Haptics.trigger('light');
    envIndex = (envIndex + 1) % environments.length;
    const env = environments[envIndex];
    const arenaBox = document.getElementById("arena-box");
    if (arenaBox) arenaBox.className = `w-full ${env.class} border ${env.border} rounded-3xl p-4 sm:p-5 my-2 relative overflow-hidden gpu-accel transition-all duration-500`;
    const envBtn = document.getElementById("env-btn");
    if (envBtn) envBtn.innerText = env.name;
}

function attackEnemyClick() {
    const card = cards[currentIndex];
    if (!card || masteredWords.has(card.german)) return;
    
    Haptics.trigger('rigid'); 
    AudioEngine.play('hit');

    const heroBox = document.getElementById("hero-avatar-box");
    const enemyBox = document.getElementById("enemy-container");
    if (heroBox) {
        heroBox.classList.remove("anim-attack");
        void heroBox.offsetWidth; 
        heroBox.classList.add("anim-attack");
    }
    if (enemyBox) {
        enemyBox.classList.remove("anim-hurt");
        void enemyBox.offsetWidth; 
        enemyBox.classList.add("anim-hurt");
    }

    let hp = getCurrentWordHp();
    hp = Math.max(0, hp - 15);
    setCurrentWordHp(hp);
    updateEnemyHpUI();

    if (hp === 0) {
        masteredWords.add(card.german);
        StorageEngine.set('a2_mastered_thema8', [...masteredWords]);
        if (enemyBox) enemyBox.classList.add("anim-soul");
        addXp(35, card.emoji, card.german, false);
        Haptics.trigger('heavy'); 
        if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } });
        setTimeout(() => {
            if (enemyBox) enemyBox.classList.remove("anim-soul");
            updateMasteredUI();
            if(!document.getElementById("compact-block-view").classList.contains("hidden")) {
                renderCompactBlock();
            }
        }, 700);
    }
}

function updateEnemyHpUI() {
    const hp = getCurrentWordHp();
    const pct = Math.max(0, Math.min(100, (hp / maxBossHp) * 100));
    const hpBar = document.getElementById("enemy-hp-bar");
    if (hpBar) hpBar.style.width = `${pct}%`;
    const hpText = document.getElementById("enemy-hp-text");
    if (hpText) hpText.innerText = `${hp} / ${maxBossHp}`;
}

// ----------------- MODALS & SCROLL LOCKING -----------------
function toggleModal(modalId, boxId, show) {
    const modal = document.getElementById(modalId);
    const box = document.getElementById(boxId);
    if (!modal || !box) return;
    
    if (show) {
        document.body.style.overflow = 'hidden';
        modal.classList.remove("opacity-0", "pointer-events-none");
        box.classList.remove("scale-90", "opacity-0", "translate-y-4");
        box.classList.add("scale-100", "opacity-100", "translate-y-0");
    } else {
        modal.classList.add("opacity-0", "pointer-events-none");
        box.classList.add("scale-90", "opacity-0", "translate-y-4");
        box.classList.remove("scale-100", "opacity-100", "translate-y-0");
        
        const openModals = document.querySelectorAll('.fixed.inset-0:not(.pointer-events-none)');
        if (openModals.length <= 1) {
            document.body.style.overflow = '';
        }
    }
}

// ----------------- MARATHON -----------------
let marathonWords = [];
let marathonIndex = 0;
let marathonScore = 0;

function openMarathonModal() { AudioEngine.play('click'); Haptics.trigger('light'); toggleModal("marathon-modal", "marathon-box", true); }
function closeMarathonModal() { AudioEngine.play('click'); Haptics.trigger('light'); toggleModal("marathon-modal", "marathon-box", false); }

function startMarathon() {
    AudioEngine.play('success');
    Haptics.trigger('medium');
    marathonWords = [...cards].sort(() => Math.random() - 0.5);
    marathonIndex = 0; marathonScore = 0;
    renderMarathonQuestion();
}

function renderMarathonQuestion() {
    const content = document.getElementById("marathon-content");
    if (!content) return;

    if (marathonIndex >= marathonWords.length) {
        content.innerHTML = `
            <div class="text-center py-6 space-y-4 gpu-accel">
                <div class="text-6xl animate-bounce drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">👑</div>
                <div class="text-lg font-black text-pink-400">РЕЙД-БОСС: BUG-LORD 9000</div>
                <div class="text-sm text-slate-300 max-w-md mx-auto">Систему очищено! Знищ фінальний вірус.</div>
                <button onclick="startRaidBossFinal()" class="interactive-btn w-full max-w-sm mx-auto bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-2xl font-black text-sm shadow-[0_5px_20px_rgba(236,72,153,0.4)]">АТАКУВАТИ БОСА</button>
            </div>
        `;
        return;
    }
    const w = marathonWords[marathonIndex];
    const others = cards.filter(c => c.german !== w.german).sort(() => Math.random() - 0.5);
    const opts = [w.ukrainian, others[0]?.ukrainian || "Помилка", others[1]?.ukrainian || "Помилка", others[2]?.ukrainian || "Помилка"].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(w.ukrainian);

    content.innerHTML = `
        <div class="flex justify-between items-center text-xs sm:text-sm text-slate-400 mb-4 px-1">
            <span class="text-cyan-400 font-bold">Хвиля: ${marathonIndex + 1}/${marathonWords.length}</span>
            <span class="text-pink-400 font-bold">Очки: ${marathonScore}</span>
        </div>
        <div class="glass-panel p-5 rounded-2xl border border-cyan-500/30 mb-5 relative shadow-inner gpu-accel">
            <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Контекст:</span>
                <button onclick="speakText('${w.sentence.replace(/'/g, "\\'")}')" class="interactive-btn bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5">
                    <i class="fa-solid fa-volume-high text-pink-400"></i>
                </button>
            </div>
            <div class="text-lg font-bold text-white italic leading-relaxed py-1">"${w.sentence}"</div>
        </div>
        <div class="flex items-center justify-center gap-3 mb-5 flex-wrap">
            <div class="flex items-center gap-2 glass-panel px-5 py-3 rounded-2xl border border-pink-500/40 shadow-lg shadow-pink-500/10">
                <span class="text-lg font-black text-pink-400 tracking-wide">${w.german}</span>
                <span class="text-2xl drop-shadow-md">${w.emoji}</span>
                <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn text-cyan-400 hover:text-white p-2 rounded-xl bg-slate-900/50 ml-1"><i class="fa-solid fa-volume-high text-sm"></i></button>
            </div>
        </div>
        <div class="space-y-3">
            ${opts.map((opt, i) => `
                <button onclick="checkMarathonAnswer(${i}, ${correctIdx})" class="marathon-btn interactive-btn w-full glass-panel hover:bg-slate-800 text-slate-200 p-4 rounded-2xl border border-cyan-500/20 text-left text-sm font-semibold shadow-sm flex items-center justify-between group">
                    <span><span class="text-cyan-400 font-black mr-3 opacity-70">${String.fromCharCode(65+i)}</span> ${opt}</span>
                    <i class="fa-solid fa-chevron-right text-xs text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
                </button>
            `).join('')}
        </div>
    `;
}

function checkMarathonAnswer(selected, correct) {
    const btns = document.querySelectorAll(".marathon-btn");
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        btn.classList.remove("glass-panel", "hover:bg-slate-800", "border-cyan-500/20");
        if (idx === correct) {
            btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-300");
        } else if (idx === selected) {
            btn.classList.add("border-pink-500", "bg-pink-500/20", "text-pink-300");
        } else {
            btn.classList.add("border-slate-800", "bg-slate-900", "text-slate-600", "opacity-40");
        }
    });
    if (selected === correct) { 
        AudioEngine.play('success'); 
        Haptics.trigger('success');
        marathonScore++; 
    } else { 
        AudioEngine.play('error'); 
        Haptics.trigger('error');
    }
    marathonIndex++;
    setTimeout(() => {
        if(!document.getElementById("marathon-modal").classList.contains("opacity-0")) {
            renderMarathonQuestion();
        }
    }, 850);
}

// ----------------- RAID BOSS -----------------
let bossStep = 0;
function startRaidBossFinal() { AudioEngine.play('click'); Haptics.trigger('heavy'); bossStep = 1; renderBossQuestion(); }

function renderBossQuestion() {
    const content = document.getElementById("marathon-content");
    if (!content) return;

    if (bossStep > 3) {
        AudioEngine.play('levelup');
        Haptics.trigger('success');
        if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 160, origin: { y: 0.5 } });
        addXp(250, '👑', 'Bug-Lord Defeated', true);
        content.innerHTML = `
            <div class="text-center py-8 space-y-4">
                <div class="text-6xl animate-bounce drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">👑</div>
                <div class="text-xl font-black text-emerald-400 tracking-wide">ВІРУС ЗНИЩЕНО!</div>
                <div class="text-sm text-slate-300 max-w-md mx-auto">Мережа безпечна. +250 XP та елітний трофей!</div>
                <button onclick="closeMarathonModal()" class="interactive-btn w-full max-w-sm mx-auto bg-cyan-500 text-slate-950 py-4 rounded-2xl font-black text-sm block mt-6 shadow-[0_5px_20px_rgba(6,182,212,0.4)]">ПОВЕРНУТИСЯ ДО БАЗИ</button>
            </div>
        `;
        return;
    }
    const w = cards[Math.floor(Math.random() * cards.length)];
    const others = cards.filter(c => c.german !== w.german).sort(() => Math.random() - 0.5);
    const opts = [w.ukrainian, others[0]?.ukrainian || "X", others[1]?.ukrainian || "Y", others[2]?.ukrainian || "Z"].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(w.ukrainian);

    content.innerHTML = `
        <div class="text-sm text-pink-500 font-black mb-4 flex items-center justify-between">
            <span>⚡ Атака БОСА</span>
            <span class="bg-pink-500/20 px-2 py-1 rounded text-xs">Етап ${bossStep}/3</span>
        </div>
        <div class="glass-panel p-5 rounded-2xl border border-pink-500/50 mb-5 flex items-center justify-between shadow-[0_0_15px_rgba(236,72,153,0.2)]">
            <span class="text-lg font-black text-white"><span class="text-cyan-400">${w.german}</span> <span class="text-2xl">${w.emoji}</span></span>
            <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn bg-pink-500/20 text-pink-300 px-4 py-2 rounded-xl"><i class="fa-solid fa-volume-high"></i></button>
        </div>
        <div class="space-y-3">
            ${opts.map((opt, i) => `
                <button onclick="checkBossAnswer(${i}, ${correctIdx})" class="boss-btn interactive-btn w-full glass-panel text-slate-200 p-4 rounded-2xl border border-pink-500/30 text-left text-sm font-bold shadow-sm hover:border-pink-400">
                    <span class="text-pink-400 opacity-70 mr-2">${String.fromCharCode(65+i)}</span> ${opt}
                </button>
            `).join('')}
        </div>
    `;
}

function checkBossAnswer(selected, correct) {
    const btns = document.querySelectorAll(".boss-btn");
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        btn.classList.remove("glass-panel", "border-pink-500/30", "hover:border-pink-400");
        if (idx === correct) {
            btn.classList.add("border-emerald-500", "bg-emerald-500/20", "text-emerald-300");
        } else if (idx === selected) {
            btn.classList.add("border-red-500", "bg-red-500/20", "text-red-300");
        } else {
            btn.classList.add("border-slate-800", "bg-slate-900", "opacity-40");
        }
    });
    
    if (selected === correct) {
        AudioEngine.play('success'); Haptics.trigger('medium'); bossStep++;
        setTimeout(() => {
            if(!document.getElementById("marathon-modal").classList.contains("opacity-0")) renderBossQuestion();
        }, 850);
    } else {
        AudioEngine.play('error'); Haptics.trigger('error');
        hero.streak = 0; updateHeroUI();
        const content = document.getElementById("marathon-content");
        if (content) {
            content.innerHTML = `
                <div class="text-center py-8 space-y-4">
                    <div class="text-6xl animate-bounce drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">💥</div>
                    <div class="text-xl font-black text-red-500">КРИТИЧНА ПОМИЛКА!</div>
                    <div class="text-sm text-slate-400">Бос відкинув тебе назад.</div>
                    <button onclick="startRaidBossFinal()" class="interactive-btn w-full max-w-sm mx-auto glass-panel border border-slate-700 text-white py-4 rounded-2xl font-bold text-sm block mt-6 hover:bg-slate-800">ПОВТОРИТИ СПРОБУ</button>
                </div>
            `;
        }
    }
}

// ----------------- DISPLAY MODES & CARDS -----------------
function switchDisplayMode(mode) {
    AudioEngine.play('click'); Haptics.trigger('light');
    const gameView = document.getElementById("game-view-container");
    const compactView = document.getElementById("compact-block-view");
    const btnGame = document.getElementById("mode-game-btn");
    const btnCompact = document.getElementById("mode-compact-btn");

    if (mode === 'compact') {
        if (gameView) gameView.classList.add("hidden"); 
        if (compactView) {
            compactView.classList.remove("hidden");
            compactView.classList.add("animate-[fade-in_0.3s_ease-out]");
        }
        if (btnCompact) btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
        if (btnGame) btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
        renderCompactBlock();
    } else {
        if (compactView) compactView.classList.add("hidden"); 
        if (gameView) {
            gameView.classList.remove("hidden");
            gameView.classList.add("animate-[fade-in_0.3s_ease-out]");
        }
        if (btnGame) btnGame.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-black bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20";
        if (btnCompact) btnCompact.className = "interactive-btn px-4 py-1.5 rounded-xl text-xs font-bold glass-panel text-slate-300 border border-slate-700";
    }
}

function renderCompactBlock() {
    const titleEl = document.getElementById("compact-title");
    if (titleEl) titleEl.innerText = `А2 Слова (${cards.length})`;
    const grid = document.getElementById("compact-words-grid");
    if (!grid) return;
    
    grid.innerHTML = cards.map((w, idx) => {
        const isM = masteredWords.has(w.german);
        return `
            <div class="glass-panel p-3.5 rounded-2xl border ${isM ? 'border-emerald-500/40 bg-emerald-900/20' : 'border-cyan-500/20'} flex items-center justify-between gap-3 text-xs gpu-accel transition-all hover:scale-[1.02]">
                <div class="flex items-center gap-3 truncate">
                    <span class="text-2xl drop-shadow-md">${w.emoji}</span>
                    <div class="truncate">
                        <div class="font-black text-white truncate text-sm">${w.german} ${isM ? '<span class="text-emerald-400">✓</span>' : ''}</div>
                        <div class="text-[10px] text-cyan-300 truncate mt-0.5 font-medium">${w.ukrainian}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn p-2 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700"><i class="fa-solid fa-volume-high text-xs"></i></button>
                    <button onclick="jumpToCardIndex(${idx})" class="interactive-btn p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:bg-pink-500/40"><i class="fa-solid fa-bolt text-xs"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function jumpToCardIndex(idx) { currentIndex = idx; switchDisplayMode('game'); updateCard(); }

function updateCard() {
    if (cards.length === 0) return;
    if (!cards[currentIndex]) currentIndex = 0;
    const card = cards[currentIndex];
    const cardInner = document.getElementById("card-inner");
    
    if (cardInner) {
        cardInner.style.transition = 'none';
        cardInner.classList.remove("rotate-y-180");
        isFlipped = false;
        setTimeout(() => { cardInner.style.transition = ''; }, 50);
    }

    document.getElementById("card-front-word").innerText = card.german;
    document.getElementById("card-front-grammar").innerText = card.grammar;
    document.getElementById("card-back-emoji").innerText = card.emoji;
    document.getElementById("card-back-translation").innerText = card.ukrainian;
    document.getElementById("card-back-hint").innerText = card.hint;
    document.getElementById("card-back-grammar-badge").innerText = card.grammar;
    document.getElementById("card-counter").innerText = `${currentIndex + 1} / ${cards.length}`;
    document.getElementById("battle-word-target").innerText = card.german;
    document.getElementById("battle-emoji-target").innerText = card.emoji;
    
    updateEnemyHpUI();
    updateMasteredUI();
}

function flipCard() {
    if (isFlipLocked) return;
    isFlipLocked = true;
    AudioEngine.play('flip'); 
    Haptics.trigger('light');
    isFlipped = !isFlipped;
    const cardInner = document.getElementById("card-inner");
    if (cardInner) cardInner.classList.toggle("rotate-y-180", isFlipped);
    setTimeout(() => { isFlipLocked = false; }, 500);
}

function nextCard() { AudioEngine.play('click'); Haptics.trigger('light'); if(cards.length > 0) currentIndex = (currentIndex + 1) % cards.length; updateCard(); }
function prevCard() { AudioEngine.play('click'); Haptics.trigger('light'); if(cards.length > 0) currentIndex = (currentIndex - 1 + cards.length) % cards.length; updateCard(); }

// ----------------- INIT & SHUFFLE (No Reload) -----------------
let isShuffled = false;

window.addEventListener('error', (event) => { console.error('[A2 RPG] Error:', event.error); });
window.addEventListener('unhandledrejection', (event) => { console.error('[A2 RPG] Promise:', event.reason); });

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('words.json');
        cards = await response.json();
    } catch (err) {
        console.error("Помилка JSON:", err);
    }

    document.addEventListener('click', () => { AudioEngine.init(); }, { once: true });

    if (AudioEngine.muted) {
        const icon = document.getElementById("sound-icon");
        if (icon) icon.className = "fa-solid fa-volume-xmark text-pink-500";
        const masterBtn = document.getElementById("sound-master-btn");
        if (masterBtn) {
            masterBtn.className = "interactive-btn px-4 py-2 rounded-xl font-bold text-[10px] bg-slate-800 text-slate-500";
            masterBtn.innerText = "ВИМКНЕНО";
        }
    }
    syncSoundUI(); updateHeroUI(); updateCard(); renderCompactBlock();
});

function toggleShuffle() {
    AudioEngine.play('click'); 
    Haptics.trigger('light');
    isShuffled = !isShuffled;
    
    if (isShuffled) {
        cards.sort(() => Math.random() - 0.5);
        const shuffleBtn = document.getElementById("shuffle-btn");
        if (shuffleBtn) shuffleBtn.classList.add("text-cyan-400", "border-cyan-400/50", "bg-cyan-950/30");
    } else {
        fetch('words.json')
            .then(res => res.json())
            .then(data => {
                cards = data;
                currentIndex = 0;
                updateCard();
                renderCompactBlock();
            })
            .catch(err => console.error("Reload error:", err));
        const shuffleBtn = document.getElementById("shuffle-btn");
        if (shuffleBtn) shuffleBtn.classList.remove("text-cyan-400", "border-cyan-400/50", "bg-cyan-950/30");
        return;
    }
    currentIndex = 0; 
    updateCard(); 
    renderCompactBlock();
}

function openAchievementsModal() { AudioEngine.play('click'); Haptics.trigger('light'); toggleModal("achievements-modal", "achievements-box", true); renderAchievements(); }
function closeAchievementsModal() { AudioEngine.play('click'); Haptics.trigger('light'); toggleModal("achievements-modal", "achievements-box", false); }

const achievementsList = [
    { id: 'first_soul', title: 'Перший злам', desc: 'Зламайте душу 1 слова', reward: 50, check: () => masteredWords.size >= 1 },
    { id: 'soul_collector', title: 'Мисливець', desc: 'Зламайте 10 душ', reward: 150, check: () => masteredWords.size >= 10 },
    { id: 'cyber_lvl3', title: 'Кібер-Агент', desc: 'Досягніть 3 рівня', reward: 200, check: () => hero.level >= 3 },
    { id: 'polyglot', title: 'Поліглот', desc: 'Зламайте всі душі', reward: 500, check: () => cards.length > 0 && masteredWords.size >= cards.length }
];

function updateAchievementsCount() {
    let completed = achievementsList.filter(a => a.check()).length;
    document.getElementById("ach-count-badge").innerText = `${completed}/${achievementsList.length}`;
}

function renderAchievements() {
    const list = document.getElementById("achievements-list");
    if (!list) return;
    list.innerHTML = achievementsList.map(ach => {
        const isDone = ach.check();
        const isClaimed = claimedAchievements.includes(ach.id);
        return `
            <div class="glass-panel p-3.5 rounded-2xl border ${isDone ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-slate-800'} flex items-center justify-between text-xs transition-all">
                <div>
                    <div class="font-black ${isDone ? 'text-yellow-400' : 'text-white'}">${ach.title} ${isDone ? '✓' : ''}</div>
                    <div class="text-[10px] text-slate-400 mt-1">${ach.desc} <span class="text-pink-400">(+${ach.reward} XP)</span></div>
                </div>
                <div>
                    ${isClaimed ? '<span class="text-[10px] text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">Отримано</span>' : (isDone ? `<button onclick="claimAchievement('${ach.id}', ${ach.reward})" class="interactive-btn bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-950 px-4 py-2 rounded-xl font-black text-[10px] shadow-lg shadow-yellow-500/20">Забрати</button>` : '<span class="text-[10px] text-slate-600">Заблоковано</span>')}
                </div>
            </div>
        `;
    }).join('');
}

function claimAchievement(id, reward) {
    if (claimedAchievements.includes(id)) return;
    AudioEngine.play('success'); Haptics.trigger('success');
    claimedAchievements.push(id);
    StorageEngine.set('a2_achievements', claimedAchievements);
    addXp(reward, null, null, true);
    renderAchievements();
}

// TRIAL, INVENTORY, WORD BROWSER 
let currentTrialTarget = null;
let currentTrialCleanWord = "";
let trialAssembled = [];
let trialAvailableModules = [];

function getWordModules(cleanWord) {
    if (!cleanWord) return [];
    let parts = cleanWord.split(/[\s-]+/).filter(Boolean);
    if (parts.length === 0) parts = [cleanWord];
    let mods = [];
    parts.forEach(p => {
        if (p.length > 4) {
            mods.push(p.slice(0, 3));
            mods.push(p.slice(3));
        } else {
            mods.push(p);
        }
    });
    return mods.filter(Boolean);
}

function openMasteryTrial() {
    AudioEngine.play('click'); Haptics.trigger('light');
    const card = cards[currentIndex];
    if (!card || masteredWords.has(card.german)) return;
    currentTrialTarget = card;
    currentTrialCleanWord = getCleanGermanWord(card.german);
    document.getElementById("trial-translation-target").innerHTML = `${card.ukrainian} <span class="text-cyan-400 font-normal text-[10px]">(${card.grammar})</span>`;
    resetTrialAssemblyCore();
    toggleModal("trial-modal", "trial-box", true);
}
function closeTrial() { toggleModal("trial-modal", "trial-box", false); }

function resetTrialAssemblyCore() {
    let modules = getWordModules(currentTrialCleanWord);
    const noisePool = ["en", "ge", "ver", "aus", "auf", "ein", "der", "die", "das", "keit", "ung", "sch"];
    let noise = noisePool[Math.floor(Math.random() * noisePool.length)];
    if (!modules.includes(noise)) modules.push(noise);
    trialAssembled = [];
    trialAvailableModules = modules.sort(() => Math.random() - 0.5);
    renderTrialUI();
}

function renderTrialUI() {
    const slotsContainer = document.getElementById("trial-slots");
    const modulesContainer = document.getElementById("trial-modules");
    if (!slotsContainer || !modulesContainer) return;

    slotsContainer.innerHTML = trialAssembled.length === 0 
        ? `<div class="text-cyan-500/40 text-[10px] font-bold w-full text-center py-2 uppercase tracking-widest"><i class="fa-solid fa-microchip mr-1"></i> Очікування модулів</div>`
        : trialAssembled.map((mod, i) => `<button onclick="removeFromAssembly(${i})" class="interactive-btn glass-panel text-cyan-300 border border-cyan-400/50 px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1 shadow-sm">${mod} <i class="fa-solid fa-xmark text-[10px] text-cyan-500 ml-1"></i></button>`).join('');

    modulesContainer.innerHTML = trialAvailableModules.map((mod, i) => `<button onclick="appendToAssembly(${i})" class="interactive-btn bg-slate-800 text-slate-200 border border-slate-600 px-4 py-2 rounded-xl font-black text-sm hover:border-pink-400 hover:text-pink-400 transition-colors">${mod}</button>`).join('');
}

function appendToAssembly(index) { AudioEngine.play('click'); Haptics.trigger('light'); trialAssembled.push(trialAvailableModules.splice(index, 1)[0]); renderTrialUI(); }
function removeFromAssembly(index) { AudioEngine.play('click'); Haptics.trigger('light'); trialAvailableModules.push(trialAssembled.splice(index, 1)[0]); renderTrialUI(); }
function resetTrialAssembly() { AudioEngine.play('click'); Haptics.trigger('light'); resetTrialAssemblyCore(); }

function verifyTrialAssembly() {
    const assembledStr = trialAssembled.join('');
    const targetStr = currentTrialCleanWord.replace(/\s+/g, '');
    if (assembledStr === targetStr) {
        AudioEngine.play('success'); Haptics.trigger('success');
        masteredWords.add(currentTrialTarget.german);
        StorageEngine.set('a2_mastered_thema8', [...masteredWords]);
        setCurrentWordHp(0); updateEnemyHpUI(); 
        addXp(50, currentTrialTarget.emoji, currentTrialTarget.german, false);
        if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
        setTimeout(() => { closeTrial(); updateMasteredUI(); if(!document.getElementById("compact-block-view").classList.contains("hidden")) renderCompactBlock(); }, 800);
    } else {
        AudioEngine.play('error'); Haptics.trigger('error');
        hero.streak = 0; updateHeroUI();
        document.getElementById("trial-slots").classList.add("animate-pulse");
        setTimeout(() => document.getElementById("trial-slots").classList.remove("animate-pulse"), 500);
    }
}

function updateMasteredUI() {
    const card = cards[currentIndex];
    if (!card) return;
    const isM = masteredWords.has(card.german);
    const btn = document.getElementById("soul-hack-btn");
    
    if (isM) {
        if (btn) {
            btn.className = "interactive-btn glass-panel text-slate-500 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-not-allowed";
            btn.innerHTML = `<i class="fa-solid fa-ghost"></i> Душу зламано ✓`;
            btn.disabled = true;
        }
    } else {
        if (btn) {
            btn.className = "interactive-btn bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]";
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

function openInventoryModal() { AudioEngine.play('click'); Haptics.trigger('light'); renderClasses(); renderPets(); renderGear(); renderTrophiesGrid(); toggleModal("inventory-modal", "inventory-box", true); }
function closeInventoryModal() { toggleModal("inventory-modal", "inventory-box", false); }

function openWordBrowser() { AudioEngine.play('click'); Haptics.trigger('light'); renderBrowserList(cards); toggleModal("word-browser-modal", "browser-box", true); }
function closeWordBrowser() { toggleModal("word-browser-modal", "browser-box", false); }
function filterWords() {
    const q = document.getElementById("browser-search").value.toLowerCase();
    renderBrowserList(cards.filter(w => w.german.toLowerCase().includes(q) || w.ukrainian.toLowerCase().includes(q)));
}
function renderBrowserList(list) {
    document.getElementById("browser-list").innerHTML = list.map(w => `
        <div class="glass-panel p-3 rounded-2xl border border-cyan-500/20 flex items-center justify-between text-xs">
            <div class="flex items-center gap-3"><span class="text-2xl">${w.emoji}</span><div><div class="font-black text-white text-sm">${w.german}</div><div class="text-emerald-400 text-[10px] mt-0.5 font-medium">${w.ukrainian}</div></div></div>
            <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn p-2 rounded-xl bg-slate-800 text-cyan-400"><i class="fa-solid fa-volume-high text-xs"></i></button>
        </div>
    `).join('');
}

function openSoundSettingsModal() { AudioEngine.play('click'); syncSoundUI(); toggleModal("sound-settings-modal", "sound-box", true); }
function closeSoundSettingsModal() { toggleModal("sound-settings-modal", "sound-box", false); }
function syncSoundUI() {
    const muted = AudioEngine.muted;
    document.getElementById('sound-icon').className = muted ? 'fa-solid fa-volume-xmark text-pink-500' : 'fa-solid fa-volume-high text-cyan-400';
    document.getElementById('sound-master-btn').className = muted ? 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-slate-500' : 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-900 shadow-md shadow-cyan-400/20';
    document.getElementById('sound-master-btn').textContent = muted ? 'ВИМКНЕНО' : 'УВІМКНЕНО';
}
function toggleAudioMute() { AudioEngine.muted = !AudioEngine.muted; StorageEngine.set('a2_muted', AudioEngine.muted); if (!AudioEngine.muted) { AudioEngine.init(); AudioEngine.play('success'); Haptics.trigger('light'); } syncSoundUI(); }

function renderClasses() {
    const classes = [{ name: 'Cyber-Runner', desc: 'Швидкість' }, { name: 'Trap-Hacker', desc: 'Злам ядер' }, { name: 'Neon-Mage', desc: 'Синтаксис' }];
    document.getElementById("class-list").innerHTML = classes.map(c => `<button onclick="setHeroClass('${c.name}')" class="interactive-btn p-3 rounded-2xl border ${hero.cls === c.name ? 'border-cyan-400 bg-cyan-900/30 text-cyan-300' : 'border-slate-800 glass-panel text-slate-400'} text-left text-xs"><div class="font-black text-white">${c.name}</div><div class="text-[10px] mt-1 opacity-80">${c.desc}</div></button>`).join('');
}
function setHeroClass(name) { AudioEngine.play('click'); Haptics.trigger('light'); hero.cls = name; updateHeroUI(); renderClasses(); }

function renderPets() {
    const pets = ['🐲', '🤖', '👾', '🦊', '🐱', '🦾'];
    document.getElementById("pet-list").innerHTML = pets.map(p => `<button onclick="setHeroPet('${p}')" class="interactive-btn p-3 rounded-2xl border ${hero.pet === p ? 'border-pink-500 bg-pink-900/30' : 'border-slate-800 glass-panel'} text-2xl flex items-center justify-center">${p}</button>`).join('');
}
function setHeroPet(p) { AudioEngine.play('click'); Haptics.trigger('light'); hero.pet = p; updateHeroUI(); renderPets(); }

function renderGear() {
    const weapons = [{ id: 'neural_blade', name: 'Neural Blade ⚡' }, { id: 'cyber_staff', name: 'Cyber Staff 🔮' }];
    document.getElementById("gear-list").innerHTML = `
        <div><div class="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Зброя:</div><div class="space-y-2">${weapons.map(w => `<button onclick="setWeapon('${w.id}')" class="interactive-btn w-full p-3 rounded-xl border ${hero.weapon === w.id ? 'border-cyan-400 bg-cyan-900/30 text-cyan-300' : 'border-slate-700 glass-panel text-slate-400'} text-left text-xs font-black">${w.name}</button>`).join('')}</div></div>
        <div><div class="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Візор:</div><button onclick="toggleVisor()" class="interactive-btn w-full p-3 rounded-xl border ${hero.visor ? 'border-pink-500 bg-pink-900/30 text-pink-300' : 'border-slate-700 glass-panel text-slate-400'} text-left text-xs font-black">Cyber Visor [${hero.visor ? 'ON' : 'OFF'}]</button></div>
    `;
}
function setWeapon(wid) { AudioEngine.play('click'); Haptics.trigger('light'); hero.weapon = wid; updateHeroUI(); renderGear(); }
function toggleVisor() { AudioEngine.play('click'); Haptics.trigger('light'); hero.visor = !hero.visor; updateHeroUI(); renderGear(); }

function renderTrophiesGrid() {
    document.getElementById("trophies-grid").innerHTML = trophies.length === 0 ? `<div class="col-span-full text-slate-500 text-xs py-2 font-medium">Сховище порожнє</div>` : trophies.map(t => `<div class="text-3xl p-2 glass-panel rounded-xl border border-cyan-500/30 flex items-center justify-center shadow-inner hover:scale-110 transition-transform">${t.emoji}</div>`).join('');
}
function renderInlineTrophies() {
    document.getElementById("inline-trophies").innerHTML = trophies.length === 0 ? `<div class="col-span-full text-slate-500 text-[10px] text-center py-1">Трофеїв немає. Зламуй душі!</div>` : trophies.map(t => {
        const found = cards.find(w => w.emoji === t.emoji && w.german === t.german) || { german: t.german, ukrainian: "?", grammar: "Nomen" };
        const rObj = rarities.find(r => r.name === t.rarity) || rarities[0];
        return `<div onclick="inspectSoul('${found.german}', '${found.ukrainian}', '${found.grammar}', '${t.emoji}', '${t.rarity}')" class="interactive-btn glass-panel p-2 rounded-xl border ${rObj.color.split(' ')[1]} text-2xl flex items-center justify-center">${t.emoji}</div>`;
    }).join('');
}

function inspectSoul(ger, ukr, gram, emoji, rarity) {
    AudioEngine.play('click'); Haptics.trigger('medium');
    document.getElementById("inspect-emoji").innerText = emoji;
    document.getElementById("inspect-german").innerText = ger;
    document.getElementById("inspect-grammar").innerText = gram;
    document.getElementById("inspect-translation").innerText = ukr;
    const rObj = rarities.find(r => r.name === rarity) || rarities[0];
    document.getElementById("inspect-rarity").className = `text-[10px] text-center font-black px-3 py-1 rounded-md mb-3 inline-block border ${rObj.color}`;
    document.getElementById("inspect-rarity").innerText = `КЛАС: ${rarity.toUpperCase()}`;
    toggleModal("soul-inspect-modal", "soul-inspect-box", true);
}
function closeSoulInspect() { toggleModal("soul-inspect-modal", "soul-inspect-box", false); }
const APP_VERSION = "v1.7.6";

const AudioEngine = {
    ctx: null,
    muted: localStorage.getItem('a2_muted') === 'true',
    volumes: JSON.parse(localStorage.getItem('a2_volumes') || '{"click":0.5,"hit":0.5,"success":0.5,"error":0.5}'),
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
    if (typeof tg.requestFullscreen === 'function') tg.requestFullscreen();
}

let hero = {
    telegramId: tgUser ? tgUser.id : 'local_pc_user',
    name: tgUser ? (tgUser.first_name || 'Cyber-Runner') : 'Микола',
    level: parseInt(localStorage.getItem('a2_hero_level') || '1'),
    xp: parseInt(localStorage.getItem('a2_hero_xp') || '0'),
    maxXp: 100,
    cls: localStorage.getItem('a2_hero_class') || 'Cyber-Runner',
    weapon: localStorage.getItem('a2_weapon') || 'neural_blade',
    visor: localStorage.getItem('a2_visor') === 'true',
    pet: localStorage.getItem('a2_pet') || '🐲',
    streak: 0
};

hero.maxXp = 100 + Math.max(0, hero.level - 1) * 50;
let trophies = JSON.parse(localStorage.getItem('a2_trophies') || '[]');
let envIndex = 0;
const environments = [
    { name: "🌆 Cyber Berlin", class: "bg-slate-900", border: "border-cyan-500/30" },
    { name: "⚡ Neon Trap", class: "bg-slate-900", border: "border-pink-500/30" },
    { name: "🕶️ Underworld", class: "bg-slate-950", border: "border-indigo-500/30" }
];

const rarities = [
    { name: "Common", color: "text-slate-300 border-slate-700 bg-slate-900", chance: 0.6 },
    { name: "Rare", color: "text-cyan-400 border-cyan-500/50 bg-cyan-500/10", chance: 0.25 },
    { name: "Epic", color: "text-purple-400 border-purple-500/50 bg-purple-500/10", chance: 0.1 },
    { name: "Legendary", color: "text-pink-400 border-pink-500/50 bg-pink-500/20", chance: 0.05 }
];

const slangPhrases = ["Bock drauf!", "Digga, läuft!", "Sheesh!", "Ehrenmann!", "Voll cringe!"];

let cards = [];
let currentIndex = 0;
let isFlipped = false;
let isShuffled = false;
let maxBossHp = 3000;
let wordHpMap = JSON.parse(localStorage.getItem('a2_word_hp_map') || '{}');
let masteredWords = new Set(JSON.parse(localStorage.getItem('a2_mastered_thema8') || '[]'));
let claimedAchievements = JSON.parse(localStorage.getItem('a2_achievements') || '[]');

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
    localStorage.setItem('a2_word_hp_map', JSON.stringify(wordHpMap));
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

    localStorage.setItem('a2_hero_level', hero.level);
    localStorage.setItem('a2_hero_xp', hero.xp);
    localStorage.setItem('a2_hero_class', hero.cls);
    localStorage.setItem('a2_weapon', hero.weapon);
    localStorage.setItem('a2_visor', hero.visor);
    localStorage.setItem('a2_pet', hero.pet);
}

function addXp(amount, emoji, word) {
    hero.streak++;
    if (hero.streak > 1 && hero.streak % 3 === 0) AudioEngine.play('success');
    const mult = Math.min(5, 1 + Math.floor(hero.streak / 3));
    hero.xp += amount * mult;

    if (emoji) {
        const rand = Math.random();
        let acc = 0, chosen = rarities[0];
        for (let r of rarities) { acc += r.chance; if (rand <= acc) { chosen = r; break; } }
        if (!trophies.find(t => t.emoji === emoji && t.german === word)) {
            trophies.push({ emoji, rarity: chosen.name, german: word });
            localStorage.setItem('a2_trophies', JSON.stringify(trophies));
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
        if (typeof confetti === 'function') confetti({ particleCount: 120, spread: 130, origin: { y: 0.5 } });
    }
    updateHeroUI();
}

function cycleEnvironment() {
    AudioEngine.play('click');
    envIndex = (envIndex + 1) % environments.length;
    const env = environments[envIndex];
    const arenaBox = document.getElementById("arena-box");
    if (arenaBox) arenaBox.className = `w-full ${env.class} border ${env.border} rounded-3xl p-4 sm:p-5 my-2 relative overflow-hidden`;
    const envBtn = document.getElementById("env-btn");
    if (envBtn) envBtn.innerText = env.name;
}

function attackEnemyClick() {
    const card = cards[currentIndex];
    if (!card || masteredWords.has(card.german)) return;
    const heroBox = document.getElementById("hero-avatar-box");
    const enemyBox = document.getElementById("enemy-container");
    if (heroBox) heroBox.classList.remove("anim-attack"); 
    if (enemyBox) enemyBox.classList.remove("anim-hurt");
    if (heroBox) void heroBox.offsetWidth;
    if (heroBox) heroBox.classList.add("anim-attack"); 
    if (enemyBox) enemyBox.classList.add("anim-hurt");
    AudioEngine.play('hit');

    let hp = getCurrentWordHp();
    hp = Math.max(0, hp - 15);
    setCurrentWordHp(hp);
    updateEnemyHpUI();

    if (hp === 0) {
        masteredWords.add(card.german);
        localStorage.setItem('a2_mastered_thema8', JSON.stringify([...masteredWords]));
        if (enemyBox) enemyBox.classList.add("anim-soul");
        addXp(35, card.emoji, card.german);
        if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
        setTimeout(() => {
            if (enemyBox) enemyBox.classList.remove("anim-soul");
            updateMasteredUI();
            renderCompactBlock();
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

let marathonWords = [];
let marathonIndex = 0;
let marathonScore = 0;

function openMarathonModal() {
    AudioEngine.play('click');
    const modal = document.getElementById("marathon-modal");
    if (modal) modal.classList.remove("opacity-0", "pointer-events-none");
    const box = document.getElementById("marathon-box");
    if (box) box.classList.remove("scale-95");
}

function closeMarathonModal() {
    AudioEngine.play('click');
    const modal = document.getElementById("marathon-modal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
    const box = document.getElementById("marathon-box");
    if (box) box.classList.add("scale-95");
}

function startMarathon(type) {
    AudioEngine.play('success');
    marathonWords = [...cards].sort(() => Math.random() - 0.5);
    marathonIndex = 0; marathonScore = 0;
    renderMarathonQuestion();
}

function renderMarathonQuestion() {
    const content = document.getElementById("marathon-content");
    if (!content) return;

    if (marathonIndex >= marathonWords.length) {
        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-6xl animate-bounce">👑</div>
                <div class="text-lg font-bold text-pink-400">РЕЙД-БОСС: BUG-LORD 9000</div>
                <div class="text-sm text-slate-300 max-w-md mx-auto">Ти пройшов усі слова! Знищ фінальний вірус системи, щоб завершити місію.</div>
                <button onclick="startRaidBossFinal()" class="interactive-btn w-full max-w-sm mx-auto bg-pink-500 hover:bg-pink-400 text-slate-950 py-3.5 rounded-2xl font-bold text-sm shadow-lg block">АТАКУВАТИ БОСА</button>
            </div>
        `;
        return;
    }
    const w = marathonWords[marathonIndex];
    const others = cards.filter(c => c.german !== w.german).sort(() => Math.random() - 0.5);
    const opts = [w.ukrainian, others[0]?.ukrainian || "Falsch 1", others[1]?.ukrainian || "Falsch 2", others[2]?.ukrainian || "Falsch 3"].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(w.ukrainian);

    content.innerHTML = `
        <div class="flex justify-between items-center text-xs sm:text-sm text-slate-400 mb-4 px-1">
            <span class="text-cyan-400 font-bold">Питання: ${marathonIndex + 1} / ${marathonWords.length}</span>
            <span class="text-pink-400 font-bold">Рахунок: ${marathonScore}</span>
        </div>
        <div class="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 mb-5 relative shadow-inner">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs uppercase tracking-wider text-cyan-400 font-bold">Приклад у реченні:</span>
                <button onclick="speakText('${w.sentence.replace(/'/g, "\\'")}')" class="interactive-btn bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5">
                    <i class="fa-solid fa-volume-high text-pink-400"></i> Речення
                </button>
            </div>
            <div class="text-lg sm:text-xl font-bold text-white italic leading-relaxed py-1">"${w.sentence}"</div>
        </div>
        <div class="flex items-center justify-center gap-3 mb-5 flex-wrap">
            <span class="text-base font-bold text-slate-300">Визнач значення слова:</span>
            <div class="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-pink-500/40 shadow-sm">
                <span class="text-base font-black text-pink-400">${w.german}</span>
                <span class="text-xl">${w.emoji}</span>
                <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn text-cyan-400 hover:text-white p-1.5 rounded-lg bg-slate-900 ml-1"><i class="fa-solid fa-volume-high text-sm"></i></button>
            </div>
        </div>
        <div class="space-y-3">
            ${opts.map((opt, i) => `
                <button onclick="checkMarathonAnswer(${i}, ${correctIdx})" class="marathon-btn interactive-btn w-full bg-slate-950 hover:bg-slate-900 text-slate-200 p-4 rounded-2xl border border-cyan-500/20 text-left text-sm font-semibold shadow-sm flex items-center justify-between group">
                    <span><span class="text-cyan-400 font-bold mr-2">${String.fromCharCode(65+i)})</span> ${opt}</span>
                    <i class="fa-solid fa-chevron-right text-xs text-slate-600 group-hover:text-cyan-400"></i>
                </button>
            `).join('')}
        </div>
    `;
}

function checkMarathonAnswer(selected, correct) {
    const btns = document.querySelectorAll(".marathon-btn");
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correct) btn.className = "w-full p-4 rounded-2xl border border-emerald-500 bg-emerald-500/20 text-emerald-300 text-left text-sm font-bold flex items-center justify-between";
        else if (idx === selected) btn.className = "w-full p-4 rounded-2xl border border-pink-500 bg-pink-500/20 text-pink-300 text-left text-sm font-bold flex items-center justify-between";
        else btn.className = "w-full p-4 rounded-2xl border border-slate-950 bg-slate-950 text-slate-600 text-left text-sm opacity-40 flex items-center justify-between";
    });
    if (selected === correct) { AudioEngine.play('success'); marathonScore++; } else { AudioEngine.play('error'); }
    marathonIndex++;
    setTimeout(() => renderMarathonQuestion(), 850);
}

let bossStep = 0;
function startRaidBossFinal() { AudioEngine.play('click'); bossStep = 1; renderBossQuestion(); }

function renderBossQuestion() {
    const content = document.getElementById("marathon-content");
    if (!content) return;

    if (bossStep > 3) {
        AudioEngine.play('levelup');
        if (typeof confetti === 'function') confetti({ particleCount: 160, spread: 130, origin: { y: 0.5 } });
        addXp(250, '👑', 'Bug-Lord Defeated');
        content.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="text-6xl animate-bounce">👑</div>
                <div class="text-base font-bold text-emerald-400">РЕЙД-БОСС ПЕРЕМОЖЕНИЙ!</div>
                <div class="text-sm text-slate-300 max-w-md mx-auto">Ти отримав +250 XP, елітний трофей та врятував мережу!</div>
                <button onclick="closeMarathonModal()" class="interactive-btn w-full max-w-sm mx-auto bg-cyan-500 text-slate-950 py-3.5 rounded-2xl font-bold text-sm block">ЗАВЕРШИТИ ТА ОТРИМАТИ НАГОРОДУ</button>
            </div>
        `;
        return;
    }
    const w = cards[Math.floor(Math.random() * cards.length)];
    const others = cards.filter(c => c.german !== w.german).sort(() => Math.random() - 0.5);
    const opts = [w.ukrainian, others[0]?.ukrainian || "Falsch 1", others[1]?.ukrainian || "Falsch 2", others[2]?.ukrainian || "Falsch 3"].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(w.ukrainian);

    content.innerHTML = `
        <div class="text-sm text-pink-400 font-bold mb-3">⚡ Атака БОСА: Хвиля ${bossStep} / 3</div>
        <div class="bg-slate-950 p-4 rounded-2xl border border-pink-500/30 mb-4 flex items-center justify-between">
            <span class="text-base font-black text-white">Вірусне слово: <span class="text-cyan-400">${w.german}</span> ${w.emoji}</span>
            <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn bg-pink-500/20 text-pink-300 px-3 py-1 rounded-xl text-xs font-bold"><i class="fa-solid fa-volume-high"></i></button>
        </div>
        <div class="space-y-3">
            ${opts.map((opt, i) => `
                <button onclick="checkBossAnswer(${i}, ${correctIdx})" class="boss-btn interactive-btn w-full bg-slate-950 hover:bg-slate-800 text-slate-200 p-4 rounded-2xl border border-pink-500/30 text-left text-sm font-semibold">${String.fromCharCode(65+i)}) ${opt}</button>
            `).join('')}
        </div>
    `;
}

function checkBossAnswer(selected, correct) {
    const btns = document.querySelectorAll(".boss-btn");
    btns.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correct) btn.className = "w-full p-4 rounded-2xl border border-emerald-500 bg-emerald-500/20 text-emerald-300 text-left text-sm font-bold";
        else if (idx === selected) btn.className = "w-full p-4 rounded-2xl border border-pink-500 bg-pink-500/20 text-pink-300 text-left text-sm font-bold";
        else btn.className = "w-full p-4 rounded-2xl border border-slate-950 bg-slate-950 text-slate-600 text-left text-sm opacity-40";
    });
    if (selected === correct) {
        AudioEngine.play('success'); bossStep++;
        setTimeout(() => renderBossQuestion(), 850);
    } else {
        AudioEngine.play('error');
        const content = document.getElementById("marathon-content");
        if (content) {
            content.innerHTML = `
                <div class="text-center py-6 space-y-3">
                    <div class="text-4xl">💥</div>
                    <div class="text-base font-bold text-pink-500">БОС ВІДКИНУВ ТЕБЕ НАЗАД!</div>
                    <button onclick="startRaidBossFinal()" class="interactive-btn w-full max-w-sm mx-auto bg-slate-800 text-slate-200 py-3 rounded-2xl font-bold text-sm block mt-3">ПОВТОРИТИ АТАКУ</button>
                </div>
            `;
        }
    }
}

function switchDisplayMode(mode) {
    AudioEngine.play('click');
    const gameView = document.getElementById("game-view-container");
    const compactView = document.getElementById("compact-block-view");
    const btnGame = document.getElementById("mode-game-btn");
    const btnCompact = document.getElementById("mode-compact-btn");

    if (mode === 'compact') {
        if (gameView) gameView.classList.add("hidden"); 
        if (compactView) compactView.classList.remove("hidden");
        if (btnCompact) btnCompact.className = "interactive-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950";
        if (btnGame) btnGame.className = "interactive-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-slate-300 border border-slate-800";
        renderCompactBlock();
    } else {
        if (compactView) compactView.classList.add("hidden"); 
        if (gameView) gameView.classList.remove("hidden");
        if (btnGame) btnGame.className = "interactive-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950";
        if (btnCompact) btnCompact.className = "interactive-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-slate-300 border border-slate-800";
    }
}

function renderCompactBlock() {
    const titleEl = document.getElementById("compact-title");
    if (titleEl) titleEl.innerText = `А2 Слова (${cards.length})`;
    const countEl = document.getElementById("compact-count");
    if (countEl) countEl.innerText = `${cards.length} слів`;
    const grid = document.getElementById("compact-words-grid");
    if (!grid) return;
    
    grid.innerHTML = cards.map((w, idx) => {
        const isM = masteredWords.has(w.german);
        return `
            <div class="bg-slate-950 p-3 rounded-2xl border ${isM ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-cyan-500/20'} flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2.5 truncate">
                    <span class="text-xl">${w.emoji}</span>
                    <div class="truncate">
                        <div class="font-bold text-white truncate">${w.german} ${isM ? '✓' : ''}</div>
                        <div class="text-[10px] text-emerald-400 truncate mt-0.5">${w.ukrainian}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn p-2 rounded-xl bg-slate-900 text-cyan-400 hover:text-pink-400"><i class="fa-solid fa-volume-high text-xs"></i></button>
                    <button onclick="jumpToCardIndex(${idx})" class="interactive-btn p-2 rounded-xl bg-slate-900 text-pink-400 hover:text-cyan-400"><i class="fa-solid fa-arrow-right text-xs"></i></button>
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
    if (cardInner) cardInner.classList.remove("rotate-y-180");
    isFlipped = false;

    const el1 = document.getElementById("card-front-word"); if (el1) el1.innerText = card.german;
    const el2 = document.getElementById("card-front-grammar"); if (el2) el2.innerText = card.grammar;
    const el3 = document.getElementById("card-back-emoji"); if (el3) el3.innerText = card.emoji;
    const el4 = document.getElementById("card-back-translation"); if (el4) el4.innerText = card.ukrainian;
    const el5 = document.getElementById("card-back-hint"); if (el5) el5.innerText = card.hint;
    const el6 = document.getElementById("card-back-grammar-badge"); if (el6) el6.innerText = card.grammar;
    const el7 = document.getElementById("card-counter"); if (el7) el7.innerText = `${currentIndex + 1} / ${cards.length}`;
    const el8 = document.getElementById("battle-word-target"); if (el8) el8.innerText = card.german;
    const el9 = document.getElementById("battle-emoji-target"); if (el9) el9.innerText = card.emoji;
    
    updateEnemyHpUI();
    updateMasteredUI();
}

function flipCard() {
    AudioEngine.play('flip');
    isFlipped = !isFlipped;
    const cardInner = document.getElementById("card-inner");
    if (cardInner) cardInner.classList.toggle("rotate-y-180", isFlipped);
}

function nextCard() { AudioEngine.play('click'); if(cards.length > 0) currentIndex = (currentIndex + 1) % cards.length; updateCard(); }
function prevCard() { AudioEngine.play('click'); if(cards.length > 0) currentIndex = (currentIndex - 1 + cards.length) % cards.length; updateCard(); }

window.addEventListener('error', (event) => {
    console.error('[A2 RPG] Runtime error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
    console.error('[A2 RPG] Promise error:', event.reason);
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('words.json');
        cards = await response.json();
    } catch (err) {
        console.error("Не вдалося завантажити words.json:", err);
    }

    document.addEventListener('click', () => {
        AudioEngine.init();
    }, { once: true });

    if (AudioEngine.muted) {
        const icon = document.getElementById("sound-icon");
        if (icon) icon.className = "fa-solid fa-volume-xmark text-pink-500";
        const masterBtn = document.getElementById("sound-master-btn");
        if (masterBtn) {
            masterBtn.className = "interactive-btn px-3 py-1.5 rounded-xl font-bold text-[10px] bg-slate-800 text-slate-400";
            masterBtn.innerText = "ВИМКНЕНО";
        }
    }
    syncSoundUI();
    updateHeroUI();
    updateCard();
    renderCompactBlock();
});

function toggleShuffle() {
    AudioEngine.play('click');
    isShuffled = !isShuffled;
    if (isShuffled) {
        cards.sort(() => Math.random() - 0.5);
        const btn = document.getElementById("shuffle-btn");
        if (btn) btn.classList.add("text-cyan-400", "border-cyan-400/50");
    } else { 
        window.location.reload(); 
    }
    currentIndex = 0; updateCard(); renderCompactBlock();
}

const achievementsList = [
    { id: 'first_soul', title: 'Перший злам', desc: 'Зламайте душу першого слова', reward: 50, check: () => masteredWords.size >= 1 },
    { id: 'soul_collector', title: 'Колекціонер душ', desc: 'Зламайте 10 душ слів', reward: 150, check: () => masteredWords.size >= 10 },
    { id: 'cyber_lvl3', title: 'Елітний Кібер-Агент', desc: 'Досягніть 3 рівня героя', reward: 200, check: () => hero.level >= 3 },
    { id: 'trophy_hunter', title: 'Мисливець за трофеями', desc: 'Зберіть 5 унікальних емодзі-трофеїв', reward: 100, check: () => trophies.length >= 5 },
    { id: 'polyglot', title: 'Кібер-Поліглот', desc: 'Зламайте всі душі теми', reward: 500, check: () => cards.length > 0 && masteredWords.size >= cards.length }
];

function updateAchievementsCount() {
    let completed = achievementsList.filter(a => a.check()).length;
    const badge = document.getElementById("ach-count-badge");
    if (badge) badge.innerText = `${completed}/${achievementsList.length}`;
}

function openAchievementsModal() {
    AudioEngine.play('click');
    const list = document.getElementById("achievements-list");
    if (list) {
        list.innerHTML = achievementsList.map(ach => {
            const isDone = ach.check();
            const isClaimed = claimedAchievements.includes(ach.id);
            return `
                <div class="bg-slate-950 p-3 rounded-2xl border ${isDone ? 'border-yellow-500/40' : 'border-slate-800'} flex items-center justify-between text-xs">
                    <div>
                        <div class="font-bold text-white">${ach.title} ${isDone ? '✓' : ''}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">${ach.desc} (+${ach.reward} XP)</div>
                    </div>
                    <div>
                        ${isClaimed ? '<span class="text-[10px] text-slate-500 font-bold">Отримано</span>' : (isDone ? `<button onclick="claimAchievement('${ach.id}', ${ach.reward})" class="interactive-btn bg-yellow-500 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-[10px]">Забрати</button>` : '<span class="text-[10px] text-slate-500">В процесі</span>')}
                    </div>
                </div>
            `;
        }).join('');
    }
    const modal = document.getElementById("achievements-modal");
    if (modal) modal.classList.remove("opacity-0", "pointer-events-none");
    const box = document.getElementById("achievements-box");
    if (box) box.classList.remove("scale-95");
}

function closeAchievementsModal() {
    AudioEngine.play('click');
    const modal = document.getElementById("achievements-modal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
    const box = document.getElementById("achievements-box");
    if (box) box.classList.add("scale-95");
}

function claimAchievement(id, reward) {
    if (claimedAchievements.includes(id)) return;
    AudioEngine.play('success');
    claimedAchievements.push(id);
    localStorage.setItem('a2_achievements', JSON.stringify(claimedAchievements));
    hero.xp += reward;
    while (hero.xp >= hero.maxXp) {
        hero.xp -= hero.maxXp;
        hero.level++;
        hero.maxXp += 50;
    }
    updateHeroUI(); openAchievementsModal();
    if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
}

let currentTrialTarget = null;
let currentTrialCleanWord = "";
let trialAssembled = [];
let trialAvailableModules = [];

function getWordModules(cleanWord) {
    let parts = cleanWord.split(' ');
    let modules = [];
    parts.forEach(part => {
        if (['der', 'die', 'das', 'sich'].includes(part.toLowerCase())) {
            modules.push(part);
        } else {
            let i = 0;
            while (i < part.length) {
                let chunkSize = (part.length - i === 4) ? 2 : 3;
                if (part.length - i <= 3) chunkSize = part.length - i;
                modules.push(part.substring(i, i + chunkSize));
                i += chunkSize;
            }
        }
    });
    return modules;
}

function openMasteryTrial() {
    AudioEngine.play('click');
    const card = cards[currentIndex];
    if (!card || masteredWords.has(card.german)) return;

    currentTrialTarget = card;
    currentTrialCleanWord = getCleanGermanWord(card.german);
    const targetEl = document.getElementById("trial-translation-target");
    if (targetEl) targetEl.innerHTML = `${card.ukrainian} <span class="text-cyan-400 font-normal text-xs">(${card.grammar})</span>`;
    
    let modules = getWordModules(currentTrialCleanWord);
    const noisePool = ["en", "ge", "ver", "aus", "auf", "ein", "der", "die", "das", "keit", "ung", "sch"];
    let noise = noisePool[Math.floor(Math.random() * noisePool.length)];
    if (!modules.includes(noise)) modules.push(noise);

    trialAssembled = [];
    trialAvailableModules = modules.sort(() => Math.random() - 0.5);
    renderTrialUI();

    const modal = document.getElementById("trial-modal");
    if (modal) modal.classList.remove("opacity-0", "pointer-events-none");
    const box = document.getElementById("trial-box");
    if (box) box.classList.remove("scale-95");
}

function renderTrialUI() {
    const slotsContainer = document.getElementById("trial-slots");
    const modulesContainer = document.getElementById("trial-modules");
    if (!slotsContainer || !modulesContainer) return;

    if (trialAssembled.length === 0) {
        slotsContainer.innerHTML = `<div class="text-cyan-500/50 flex items-center animate-pulse text-xs font-medium"><i class="fa-solid fa-microchip mr-2"></i> Очікування модулів...</div>`;
    } else {
        slotsContainer.innerHTML = trialAssembled.map((mod, i) => `
            <button onclick="removeFromAssembly(${i})" class="slot-chip interactive-btn bg-cyan-900/45 text-cyan-300 border border-cyan-400/50 px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1.5">
                ${mod} <i class="fa-solid fa-xmark text-[10px] text-cyan-400"></i>
            </button>
        `).join('');
    }

    modulesContainer.innerHTML = trialAvailableModules.map((mod, i) => `
        <button onclick="appendToAssembly(${i})" class="cyber-chip bg-slate-900 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-xl font-black text-sm tracking-wide select-none">${mod}</button>
    `).join('');
}

function appendToAssembly(index) { AudioEngine.play('click'); trialAssembled.push(trialAvailableModules.splice(index, 1)[0]); renderTrialUI(); }
function removeFromAssembly(index) { AudioEngine.play('click'); trialAvailableModules.push(trialAssembled.splice(index, 1)[0]); renderTrialUI(); }

function resetTrialAssembly() {
    AudioEngine.play('click');
    if (!currentTrialCleanWord) return;
    let modules = getWordModules(currentTrialCleanWord);
    const noisePool = ["en", "ge", "ver", "aus", "auf", "ein", "der", "die", "das", "keit", "ung", "sch"];
    let noise = noisePool[Math.floor(Math.random() * noisePool.length)];
    if (!modules.includes(noise)) modules.push(noise);
    trialAssembled = [];
    trialAvailableModules = modules.sort(() => Math.random() - 0.5);
    renderTrialUI();
}

function verifyTrialAssembly() {
    if (!currentTrialTarget) return;
    const assembledStr = trialAssembled.join('');
    const targetStr = currentTrialCleanWord.replace(/\s+/g, '');

    if (assembledStr === targetStr) {
        AudioEngine.play('success');
        masteredWords.add(currentTrialTarget.german);
        localStorage.setItem('a2_mastered_thema8', JSON.stringify([...masteredWords]));
        setCurrentWordHp(0);
        updateEnemyHpUI();
        addXp(50, currentTrialTarget.emoji, currentTrialTarget.german);
        if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
        setTimeout(() => {
            closeTrial(); updateMasteredUI(); renderCompactBlock();
        }, 800);
    } else {
        AudioEngine.play('error');
        hero.streak = 0; updateHeroUI();
    }
}

function closeTrial() {
    const modal = document.getElementById("trial-modal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
    const box = document.getElementById("trial-box");
    if (box) box.classList.add("scale-95");
}

function updateMasteredUI() {
    const card = cards[currentIndex];
    if (!card) return;
    const isM = masteredWords.has(card.german);
    const btn = document.getElementById("soul-hack-btn");
    const icon = document.getElementById("soul-hack-icon");
    const label = document.getElementById("soul-hack-label");
    if (!btn) return;
    
    if (isM) {
        btn.className = "interactive-btn bg-slate-800 text-slate-400 border-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5";
        if (icon) icon.className = "fa-solid fa-ghost text-slate-500"; 
        if (label) label.innerText = "Душу зламано ✓"; 
        btn.disabled = true;
    } else {
        btn.className = "interactive-btn bg-pink-500/20 text-pink-300 border-pink-500/40 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5";
        if (icon) icon.className = "fa-solid fa-bolt text-pink-400"; 
        if (label) label.innerText = "Зламати душу"; 
        btn.disabled = false;
    }
}

function renderInlineTrophies() {
    const grid = document.getElementById("inline-trophies");
    if (!grid) return;
    if (trophies.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-slate-400 text-[10px] text-center py-0.5">Сховище порожнє. Зламуй душі!</div>`;
        return;
    }
    grid.innerHTML = trophies.map(t => {
        const found = cards.find(w => w.emoji === t.emoji && w.german === t.german) || { german: t.german, ukrainian: "Невідомо", grammar: "Nomen" };
        const rObj = rarities.find(r => r.name === t.rarity) || rarities[0];
        return `<div onclick="inspectSoul('${found.german}', '${found.ukrainian}', '${found.grammar}', '${t.emoji}', '${t.rarity}')" class="interactive-btn bg-slate-900 p-1.5 rounded-lg border ${rObj.color.split(' ')[1]} text-xl flex items-center justify-center cursor-pointer">${t.emoji}</div>`;
    }).join('');
}

function inspectSoul(ger, ukr, gram, emoji, rarity) {
    AudioEngine.play('click');
    const el1 = document.getElementById("inspect-emoji"); if (el1) el1.innerText = emoji;
    const el2 = document.getElementById("inspect-german"); if (el2) el2.innerText = ger;
    const el3 = document.getElementById("inspect-grammar"); if (el3) el3.innerText = gram;
    const el4 = document.getElementById("inspect-translation"); if (el4) el4.innerText = ukr;
    
    const rObj = rarities.find(r => r.name === rarity) || rarities[0];
    const badge = document.getElementById("inspect-rarity");
    if (badge) {
        badge.innerText = `Рівень: ${rarity}`;
        badge.className = `text-[10px] text-center font-bold px-2.5 py-1 rounded-md mb-2 inline-block border ${rObj.color}`;
    }
    const modal = document.getElementById("soul-inspect-modal");
    if (modal) modal.classList.remove("opacity-0", "pointer-events-none");
    const box = document.getElementById("soul-inspect-box");
    if (box) box.classList.remove("scale-95");
}

function closeSoulInspect() {
    const modal = document.getElementById("soul-inspect-modal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
    const box = document.getElementById("soul-inspect-box");
    if (box) box.classList.add("scale-95");
}

function openInventoryModal() {
    AudioEngine.play('click');
    renderClasses(); renderPets(); renderGear(); renderTrophiesGrid();
    const modal = document.getElementById("inventory-modal");
    if (modal) modal.classList.remove("opacity-0", "pointer-events-none");
    const box = document.getElementById("inventory-box");
    if (box) box.classList.remove("scale-95");
}

function closeInventoryModal() {
    const modal = document.getElementById("inventory-modal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
    const box = document.getElementById("inventory-box");
    if (box) box.classList.add("scale-95");
}

function openSoundSettingsModal() {
    AudioEngine.play('click');
    syncSoundUI();
    const modal = document.getElementById('sound-settings-modal');
    const box = document.getElementById('sound-box');
    if (modal) modal.classList.remove('opacity-0', 'pointer-events-none');
    if (box) box.classList.remove('scale-95');
}

function closeSoundSettingsModal() {
    const modal = document.getElementById('sound-settings-modal');
    const box = document.getElementById('sound-box');
    if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
    if (box) box.classList.add('scale-95');
}

function syncSoundUI() {
    const icon = document.getElementById('sound-icon');
    const masterBtn = document.getElementById('sound-master-btn');
    const muted = AudioEngine.muted;
    if (icon) icon.className = muted ? 'fa-solid fa-volume-xmark text-pink-500' : 'fa-solid fa-volume-high text-cyan-400';
    if (masterBtn) {
        masterBtn.textContent = muted ? 'ВИМКНЕНО' : 'УВІМКНЕНО';
        masterBtn.className = muted
            ? 'interactive-btn px-3 py-1.5 rounded-xl font-bold text-[10px] bg-slate-800 text-slate-400'
            : 'interactive-btn px-3 py-1.5 rounded-xl font-bold text-[10px] bg-cyan-500 text-slate-950';
    }
}

function toggleAudioMute() {
    AudioEngine.muted = !AudioEngine.muted;
    localStorage.setItem('a2_muted', String(AudioEngine.muted));
    if (!AudioEngine.muted) AudioEngine.init();
    syncSoundUI();
}

function resetAllProgress() {
    resetProgress();
}

function resetProgress() {
    if (confirm("⚠️ Увага! Ти дійсно хочеш скинути весь свій прогрес, рівень та зламані душі?")) {
        AudioEngine.play('error');
        const keys = Object.keys(localStorage).filter(k => k.startsWith('a2_'));
        keys.forEach(k => localStorage.removeItem(k));
        window.location.reload();
    }
}

function renderClasses() {
    const classes = [{ name: 'Cyber-Runner', desc: 'Швидкий біг' }, { name: 'Trap-Hacker', desc: 'Злам ядер' }, { name: 'Neon-Mage', desc: 'Енергія синтаксису' }];
    const list = document.getElementById("class-list");
    if (!list) return;
    list.innerHTML = classes.map(c => `
        <button onclick="setHeroClass('${c.name}')" class="interactive-btn p-3 rounded-2xl border ${hero.cls === c.name ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-slate-800 bg-slate-950 text-slate-400'} text-left text-xs">
            <div class="font-bold text-white">${c.name}</div><div class="text-[10px] mt-0.5 opacity-80">${c.desc}</div>
        </button>
    `).join('');
}

function setHeroClass(name) { AudioEngine.play('click'); hero.cls = name; updateHeroUI(); renderClasses(); }

function renderPets() {
    const pets = ['🐲', '🤖', '👾', '🦊', '🐱', '🦾'];
    const list = document.getElementById("pet-list");
    if (!list) return;
    list.innerHTML = pets.map(p => `
        <button onclick="setHeroPet('${p}')" class="interactive-btn p-3 rounded-2xl border ${hero.pet === p ? 'border-pink-500 bg-pink-500/20' : 'border-slate-800 bg-slate-950'} text-2xl flex items-center justify-center">${p}</button>
    `).join('');
}

function setHeroPet(p) { AudioEngine.play('click'); hero.pet = p; updateHeroUI(); renderPets(); }

function renderGear() {
    const weapons = [{ id: 'neural_blade', name: 'Neural Blade ⚡' }, { id: 'cyber_staff', name: 'Cyber Staff 🔮' }];
    const gearList = document.getElementById("gear-list");
    if (!gearList) return;
    gearList.innerHTML = `
        <div>
            <div class="text-[10px] text-slate-400 mb-1.5 font-medium">Зброя:</div>
            <div class="space-y-1.5">
                ${weapons.map(w => `<button onclick="setWeapon('${w.id}')" class="interactive-btn w-full p-2.5 rounded-xl border ${hero.weapon === w.id ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-slate-800 bg-slate-950 text-slate-400'} text-left text-xs font-bold">${w.name}</button>`).join('')}
            </div>
        </div>
        <div>
            <div class="text-[10px] text-slate-400 mb-1.5 font-medium">Візор:</div>
            <button onclick="toggleVisor()" class="interactive-btn w-full p-2.5 rounded-xl border ${hero.visor ? 'border-pink-500 bg-pink-500/20 text-pink-300' : 'border-slate-800 bg-slate-950 text-slate-400'} text-left text-xs font-bold">Cyber Visor [${hero.visor ? 'ACTIVE' : 'OFF'}]</button>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-800">
            <button onclick="resetProgress()" class="interactive-btn w-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/40 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">
                <i class="fa-solid fa-trash-can"></i> Скинути весь прогрес гри
            </button>
        </div>
    `;
}

function setWeapon(wid) { AudioEngine.play('click'); hero.weapon = wid; updateHeroUI(); renderGear(); }
function toggleVisor() { AudioEngine.play('click'); hero.visor = !hero.visor; updateHeroUI(); renderGear(); }

function renderTrophiesGrid() {
    const grid = document.getElementById("trophies-grid");
    if (!grid) return;
    if (trophies.length === 0) { grid.innerHTML = `<div class="col-span-full text-slate-400 text-xs py-1">Сховище порожнє</div>`; return; }
    grid.innerHTML = trophies.map(t => `<div class="text-2xl p-1 bg-slate-900 rounded-lg border border-cyan-500/20 flex items-center justify-center">${t.emoji}</div>`).join('');
}

function openWordBrowser() {
    AudioEngine.play('click');
    renderBrowserList(cards);
    const modal = document.getElementById("word-browser-modal");
    if (modal) modal.classList.remove("opacity-0", "pointer-events-none");
    const box = document.getElementById("browser-box");
    if (box) box.classList.remove("scale-95");
}

function closeWordBrowser() {
    const modal = document.getElementById("word-browser-modal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
    const box = document.getElementById("browser-box");
    if (box) box.classList.add("scale-95");
}

function filterWords() {
    const searchInput = document.getElementById("browser-search");
    if (!searchInput) return;
    const q = searchInput.value.toLowerCase();
    renderBrowserList(cards.filter(w => w.german.toLowerCase().includes(q) || w.ukrainian.toLowerCase().includes(q)));
}

function renderBrowserList(list) {
    const container = document.getElementById("browser-list");
    if (!container) return;
    container.innerHTML = list.map(w => `
        <div class="bg-slate-950 p-3 rounded-2xl border border-cyan-500/20 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5"><span class="text-xl">${w.emoji}</span><div><div class="font-bold text-white">${w.german}</div><div class="text-emerald-400 text-[10px] mt-0.5">${w.ukrainian}</div></div></div>
            <button onclick="speakText('${w.german.replace(/'/g, "\\'")}')" class="interactive-btn p-2 rounded-xl bg-slate-900 text-cyan-400"><i class="fa-solid fa-volume-high text-xs"></i></button>
        </div>
    `).join('');
}
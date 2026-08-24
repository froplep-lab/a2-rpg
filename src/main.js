import Phaser from 'phaser';
import {TelegramBridge} from './telegram/TelegramBridge.js';
import {StorageManager} from './storage/StorageManager.js';
import {CardManager} from './cards/CardManager.js';
import {WordTrial} from './learning/WordTrial.js';
import {GameScene} from './game/GameScene.js';
import wordsData from '../data/words.json';

class App{
  constructor(){
    TelegramBridge.init();
    this.wordsData=wordsData;
    this.state=StorageManager.load(wordsData);
    this.game=null;this.battleManager=null;
    this.bindGlobal();this.renderHome();
  }
  save(){StorageManager.save(this.state)}
  active(){
    const today=StorageManager.today();
    if(this.state.lastActiveDate===today)return;
    const prev=this.state.lastActiveDate;
    if(prev){const d=Math.round((new Date(today)-new Date(prev))/86400000);this.state.streak=d===1?this.state.streak+1:1}else this.state.streak=1;
    this.state.lastActiveDate=today;this.state.daily={date:today,trial:0,battles:0};this.save();
  }
  bindGlobal(){
    document.getElementById('btn-back-home').onclick=()=>this.stopGame();
    document.getElementById('roll-btn').onclick=()=>{if(this.battleManager?.roll())TelegramBridge.haptic('light')};
    window.addEventListener('resize',()=>this.game?.scale.refresh());
  }
  show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active')}
  renderHome(){
    this.show('screen-home');const el=document.getElementById('screen-home');
    const req=this.state.playerLevel*200;const pct=Math.min(100,this.state.playerXP/req*100);const today=this.state.daily.date===StorageManager.today()?this.state.daily:{trial:0,battles:0};
    el.innerHTML=`
      <div class="shell">
        <div class="hero">
          <section class="hero-main">
            <div class="brand-row"><div class="brand-mark">🗣️</div><div><div class="eyebrow">LEARN • MERGE • DEFEND</div><div class="subtitle">Deutsch Dice</div></div></div>
            <div class="title">Вчи німецьку.<br>Грай як у tower defense.</div>
            <div class="subtitle">Кожне вивчене слово — це нова картка для твоєї колоди. Розміщуй, об'єднуй і захищай Heart.</div>
            <div class="player-card">
              <div class="player-top"><span class="level">⭐ Level ${this.state.playerLevel}</span><span class="coins">🪙 ${this.state.coins}</span></div>
              <div class="xpbar"><i style="width:${pct}%"></i></div>
              <div class="subtitle" style="margin-top:7px">${this.state.playerXP} / ${req} XP до наступного рівня</div>
              <div class="stats"><div class="stat"><b>🔥 ${this.state.streak}</b><span>Streak</span></div><div class="stat"><b>🃏 ${Object.keys(this.state.cards).length}</b><span>Cards</span></div><div class="stat"><b>📚 ${this.wordsData.length}</b><span>Words</span></div></div>
            </div>
            <div class="menu-grid">
              <button id="play" class="action primary"><span class="aico">⚔️</span><div><b>PLAY BATTLE</b><span>3 waves • merge your cards</span></div></button>
              <button id="trial" class="action"><span class="aico">🧪</span><div><b>WORD TRIAL</b><span>5 questions • +XP</span></div></button>
              <button id="cards" class="action"><span class="aico">🃏</span><div><b>COLLECTION</b><span>Upgrade learned words</span></div></button>
              <button id="settings" class="action"><span class="aico">⚙️</span><div><b>SETTINGS</b><span>Sound & progress</span></div></button>
            </div>
          </section>
          <aside class="hero-side">
            <div class="section-title">🎯 Daily missions</div>
            <div class="bounties">
              <div class="bounty ${today.trial?'done':''}"><div class="ico">🧪</div><div class="body">Word Trial<br><small>5 questions • +100 XP</small></div><strong>${today.trial?'✓ DONE':'100 XP'}</strong></div>
              <div class="bounty ${today.battles?'done':''}"><div class="ico">⚔️</div><div class="body">Defend Heart<br><small>Win one battle • +50 🪙</small></div><strong>${today.battles?'✓ DONE':'50 🪙'}</strong></div>
              <div class="bounty"><div class="ico">🔊</div><div class="body">Hear a word<br><small>Open any card & listen</small></div><strong>FREE</strong></div>
            </div>
            <div class="section-title" style="margin-top:22px">💡 How it works</div>
            <div class="subtitle">1. Learn a word in Trial.<br>2. Get it as a battle card.<br>3. Place 5 × 3 cards on the board.<br>4. Merge equal cards to level them up.<br>5. Survive every wave.</div>
          </aside>
        </div>
      </div>`;
    el.querySelector('#play').onclick=()=>this.startBattle();el.querySelector('#trial').onclick=()=>this.startTrial();el.querySelector('#cards').onclick=()=>this.renderCollection();el.querySelector('#settings').onclick=()=>this.renderSettings();
  }
  startBattle(){
    this.active();this.show('game-container');TelegramBridge.haptic('medium');
    this.renderBattleHand([]);
    if(!this.game){
      this.game=new Phaser.Game({type:Phaser.AUTO,parent:'game-container',backgroundColor:'#070b15',scene:[GameScene],scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},render:{antialias:true,roundPixels:true},fps:{target:60,forceSetTimeOut:false}});
    }
    this.game.scene.start('GameScene',{wordsData:this.wordsData,onComplete:(v,details)=>this.battleComplete(v,details),onUI:ui=>this.updateBattleUI(ui)});
    setTimeout(()=>{this.battleManager=this.game.scene.getScene('GameScene')?.manager},60);
  }
  updateBattleUI(ui){
    if(!ui)return;
    document.getElementById('heart-hp').textContent=`❤️ ${Math.round(ui.hp??100)}`;
    document.getElementById('wave-info').textContent=`⚔️ ${ui.wave??1}/${ui.maxWaves??3}`;
    document.getElementById('battle-coins').textContent=`🪙 ${Math.round(ui.coins??0)}`;
    if(ui.hand){this.renderBattleHand(ui.hand,ui.selected??0)} else if(Number.isInteger(ui.selected))this.highlightHand(ui.selected);
  }
  renderBattleHand(hand,selected=0){
    const el=document.getElementById('battle-hand');if(!el)return;
    el.innerHTML=hand.map((w,i)=>`<button class="hand-card ${i===selected?'selected':''}" data-i="${i}"><div>${w.emoji||'📚'}</div><div class="hword">${this.escape(w.word)}</div><div class="hmeta">${this.escape(w.translation)}</div></button>`).join('');
    el.querySelectorAll('.hand-card').forEach(b=>b.onclick=()=>{this.battleManager?.selectHand(Number(b.dataset.i));TelegramBridge.haptic('light')});
  }
  highlightHand(selected){document.querySelectorAll('.hand-card').forEach((b,i)=>b.classList.toggle('selected',i===selected))}
  stopGame(){
    if(this.game){this.game.scene.stop('GameScene');this.battleManager=null}
    this.show('screen-home');this.renderHome();
  }
  battleComplete(v,details){
    this.battleManager=null;
    if(v){this.state.coins+=50;this.addPlayerXP(100);this.state.daily.battles=1;this.save()}
    this.renderRewards(v,details);
  }
  addPlayerXP(xp){this.state.playerXP+=xp;let req=this.state.playerLevel*200;while(this.state.playerXP>=req){this.state.playerXP-=req;this.state.playerLevel++;req=this.state.playerLevel*200;TelegramBridge.haptic('success')}}
  renderRewards(v,details){
    this.show('screen-rewards');document.getElementById('screen-rewards').innerHTML=`<div class="reward-wrap"><div class="reward-icon">${v?'🏆':'💔'}</div><div class="eyebrow">BATTLE RESULT</div><h2>${v?'VICTORY':'DEFEAT'}</h2><p>${v?'Heart survived all waves.':'The Heart was destroyed. Learn a few more words and try again.'}</p><div class="panel" style="text-align:left"><div class="setting-row"><span>Battle coins</span><b>${details?.coins??0} 🪙</b></div><div class="setting-row"><span>Reward</span><b>${v?'+50 🪙 +100 XP':'Practice + retry'}</b></div></div><button id="reward" class="action primary" style="width:100%;justify-content:center;margin-top:14px">CONTINUE</button></div>`;
    document.getElementById('reward').onclick=()=>this.renderHome();
  }
  startTrial(){
    this.active();this.show('screen-trial');const el=document.getElementById('screen-trial');
    const trial=new WordTrial(this.wordsData,this.state,xp=>{for(const[id,n]of Object.entries(xp))CardManager.addXP(this.state,id,n);if(Object.keys(xp).length){this.state.coins+=10;this.state.daily.trial=1;this.addPlayerXP(Object.values(xp).reduce((a,b)=>a+b,0));this.save()}this.renderHome()});trial.render(el);
  }
  renderCollection(){
    this.show('screen-collection');const el=document.getElementById('screen-collection');
    el.innerHTML=`<div class="topbar"><button id="back" class="icon-btn">←</button><div><h2>Card Collection</h2><div class="sub">Words become stronger when you practice them.</div></div><span class="sub">${this.wordsData.length} words</span></div><div class="shell"><div class="section-head"><h3>🃏 Your German deck</h3><small>Tap a card to hear it.</small></div><div id="grid" class="grid-cards"></div></div>`;
    el.querySelector('#back').onclick=()=>this.renderHome();const grid=el.querySelector('#grid');
    grid.innerHTML=this.wordsData.map(w=>{const c=this.state.cards[w.id]||{level:1,xp:0,mastery:0};const req=CardManager.getXPForNextLevel(c.level);const p=Math.min(100,c.xp/req*100);return`<div class="card-item tier-${CardManager.getRarityTier(c.level)}" data-word="${this.escape(w.word)}"><div class="card-emoji">${w.emoji||'📚'}</div><div class="card-word">${this.escape(w.word)}</div><div class="card-trans">${this.escape(w.translation)}</div><div class="card-level">LV ${c.level} • ${c.mastery||0}%</div><div class="card-progress"><i style="width:${p}%"></i></div></div>`}).join('');
    grid.querySelectorAll('.card-item').forEach(c=>c.onclick=()=>{this.speak(c.dataset.word);TelegramBridge.haptic('light')});
  }
  renderSettings(){
    this.show('screen-collection');const el=document.getElementById('screen-collection');el.innerHTML=`<div class="topbar"><button id="back" class="icon-btn">←</button><div><h2>Settings</h2><div class="sub">Local save on this device.</div></div></div><div class="shell"><div class="panel"><div class="setting-row"><span>🔊 German pronunciation</span><button id="sound" class="mini-btn">${this.state.settings.sound?'ON':'OFF'}</button></div><div class="setting-row"><span>♻️ Reset progress</span><button id="reset" class="mini-btn">↺</button></div></div></div>`;
    el.querySelector('#back').onclick=()=>this.renderHome();el.querySelector('#sound').onclick=()=>{this.state.settings.sound=!this.state.settings.sound;this.save();this.renderSettings()};el.querySelector('#reset').onclick=()=>{if(confirm('Скинути весь прогрес?')){this.state=StorageManager.reset(this.wordsData);this.renderHome()}};
  }
  speak(text){if(!this.state.settings.sound||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=.88;window.speechSynthesis.speak(u)}
  escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
}
window.addEventListener('DOMContentLoaded',()=>new App());

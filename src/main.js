import Phaser from 'phaser';
import { TelegramBridge } from './telegram/TelegramBridge.js';
import { StorageManager } from './storage/StorageManager.js';
import { CardManager } from './cards/CardManager.js';
import { WordTrial } from './learning/WordTrial.js';
import { GameScene } from './game/GameScene.js';
import wordsData from '../data/words.json';

class App {
  constructor() {
    TelegramBridge.init();
    this.state = StorageManager.load();
    this.wordsData = wordsData;
    this.initDOM(); 
    this.renderHome();
  }

  initDOM() {
    const backBtn = document.getElementById('btn-back-home');
    if (backBtn) {
      backBtn.onclick = () => {
        if (this.gameInstance) {
          this.gameInstance.scene.stop('GameScene');
        }
        this.switchScreen('screen-home');
        this.renderHome();
      };
    }
  }

  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }

  renderHome() {
    const screen = document.getElementById('screen-home');
    screen.className = 'screen active';
    
    let totalXPNeeded = this.state.playerLevel * 200;
    let xpPercent = Math.min(100, (this.state.playerXP / totalXPNeeded) * 100);
    
    screen.innerHTML = `
      <div class="home-container">
        <div class="title">🎲 Random Deutsch</div>
        <div class="player-card">
          <div style="font-weight: 700; font-size: 15px;">⭐ Level ${this.state.playerLevel}</div>
          <div class="xp-bar-bg"><div class="xp-bar-fill" style="width: ${xpPercent}%"></div></div>
          <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">XP: ${this.state.playerXP} / ${totalXPNeeded} | 🪙 Coins: ${this.state.coins}</div>
        </div>
        <div class="menu-buttons">
          <button id="btn-play" class="btn-primary">⚔️ PLAY</button>
          <button id="btn-collection" class="btn-secondary">🃏 CARDS (${Object.keys(this.state.cards).length})</button>
          <button id="btn-trial" class="btn-secondary">🧪 WORD TRIAL</button>
          <button class="btn-locked">🤝 CO-OP (Coming Soon)</button>
          <button class="btn-locked">⚔️ PVP (Coming Soon)</button>
        </div>
      </div>
    `;
    
    document.getElementById('btn-play').onclick = () => this.startBattle();
    document.getElementById('btn-collection').onclick = () => this.renderCollection();
    document.getElementById('btn-trial').onclick = () => this.startTrial();
  }

  startBattle() {
    this.switchScreen('game-container'); 
    TelegramBridge.haptic('medium');
    
    if (!this.gameInstance) {
      const config = {
        type: Phaser.AUTO, 
        width: window.innerWidth, 
        height: window.innerHeight,
        parent: 'game-container', 
        backgroundColor: '#0f111a', 
        scene: [GameScene]
      };
      this.gameInstance = new Phaser.Game(config);
    }
    
    this.gameInstance.scene.start('GameScene', {
      wordsData: this.wordsData,
      onComplete: (victory) => {
        this.switchScreen('screen-rewards'); 
        this.renderRewards(victory);
      }
    });
  }

  renderRewards(victory) {
    const screen = document.getElementById('screen-rewards');
    screen.innerHTML = `
      <div class="home-container">
        <div class="title" style="color: ${victory ? '#10b981' : '#ef4444'}">${victory ? 'VICTORY!' : 'DEFEAT'}</div>
        <p style="color: #9ca3af;">${victory ? 'You successfully defended the heart and earned rewards!' : 'The heart fell. Try reviewing words in Word Trial.'}</p>
        <button id="btn-reward-ok" class="btn-primary" style="width: 100%; max-width: 320px;">Continue</button>
      </div>
    `;
    
    if (victory) {
      this.state.coins += 50; 
      this.state.playerXP += 100; 
      let totalXPNeeded = this.state.playerLevel * 200;
      while (this.state.playerXP >= totalXPNeeded) {
        this.state.playerXP -= totalXPNeeded;
        this.state.playerLevel++;
        totalXPNeeded = this.state.playerLevel * 200;
      }
      StorageManager.save(this.state);
    }
    
    document.getElementById('btn-reward-ok').onclick = () => { 
      this.switchScreen('screen-home'); 
      this.renderHome(); 
    };
  }

  startTrial() {
    this.switchScreen('screen-trial');
    const screen = document.getElementById('screen-trial');
    const trial = new WordTrial(this.wordsData, this.state, (earnedXP) => {
      for (let [cardId, xp] of Object.entries(earnedXP)) { 
        CardManager.addXP(this.state, cardId, xp); 
      }
      StorageManager.save(this.state); 
      this.switchScreen('screen-home');
      this.renderHome();
    });
    trial.render(screen);
  }

  renderCollection() {
    const screen = document.getElementById('screen-collection');
    screen.className = 'screen active';
    screen.innerHTML = `
      <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #374151;">
        <h2 style="font-size: 18px;">Card Collection</h2>
        <button id="col-back" class="btn-secondary" style="padding: 6px 12px;">Back</button>
      </div>
      <div style="padding: 12px; color: #9ca3af; font-size: 13px; text-align: center;">Click a card to hear pronunciation 🔊</div>
      <div class="grid-cards" id="cards-grid"></div>
    `;
    
    document.getElementById('col-back').onclick = () => {
      this.switchScreen('screen-home');
      this.renderHome();
    };
    
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = this.wordsData.map(word => {
      const cardData = this.state.cards[word.id] || { level: 1, xp: 0 };
      const tier = CardManager.getRarityTier(cardData.level);
      return `
        <div class="card-item tier-${tier}" data-word="${word.word}">
          <div class="card-emoji">${word.emoji}</div>
          <div class="card-word">${word.word}</div>
          <div class="card-trans">${word.translation}</div>
          <div class="card-level">Lvl ${cardData.level}</div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.card-item').forEach(card => {
      card.onclick = () => {
        const text = card.getAttribute('data-word');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        window.speechSynthesis.speak(utterance);
        TelegramBridge.haptic('light');
      };
    });
  }
}
window.addEventListener('DOMContentLoaded', () => { new App(); });
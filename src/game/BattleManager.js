import Phaser from 'phaser';
import { Heart } from './Heart.js';
import { Unit } from './Unit.js';
import { Enemy } from './Enemy.js';

export class BattleManager {
  constructor(scene, wordsData, onBattleOver) {
    this.scene = scene; this.wordsData = wordsData; this.onBattleOver = onBattleOver;
    this.wave = 1; this.maxWaves = 3; this.enemies = []; this.units = [];
    
    const hpElement = document.getElementById('heart-hp');
    if(hpElement) hpElement.innerText = `❤️ 100`;
    const waveElement = document.getElementById('wave-info');
    if(waveElement) waveElement.innerText = `Wave: ${this.wave}/${this.maxWaves}`;

    const { width, height } = scene.scale;
    this.heart = new Heart(scene, width / 2, height - 80);
    this.setupBattlefield(); this.startWave();
  }
  
  setupBattlefield() {
    const { width } = this.scene.scale;
    const positions = [ { x: width / 2 - 60, y: 350 }, { x: width / 2, y: 320 }, { x: width / 2 + 60, y: 350 } ];
    positions.forEach((pos, idx) => {
      const word = this.wordsData[idx % this.wordsData.length];
      this.units.push(new Unit(this.scene, pos.x, pos.y, word));
    });
  }
  
  startWave() {
    const { width } = this.scene.scale;
    this.totalEnemiesToSpawn = 3 + this.wave * 2;
    this.spawnedCount = 0;
    
    this.spawnTimer = this.scene.time.addEvent({
      delay: 1000, repeat: this.totalEnemiesToSpawn - 1,
      callback: () => {
        const offsetX = Phaser.Math.Between(-100, 100);
        const enemy = new Enemy(this.scene, width / 2 + offsetX, 50, this.heart);
        this.enemies.push(enemy); this.spawnedCount++;
      }
    });
  }
  
  update(time, delta) {
    this.units.forEach(u => u.update(this.enemies));
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      let enemy = this.enemies[i];
      let status = enemy.update();
      if (status === 'reach_heart') {
        let destroyed = this.heart.takeDamage(10);
        const hpElement = document.getElementById('heart-hp');
        if(hpElement) hpElement.innerText = `❤️ ${this.heart.hp}`;
        enemy.destroy(); this.enemies.splice(i, 1);
        if (destroyed) { this.endBattle(false); return; }
      } else if (status === 'dead') {
        enemy.destroy(); this.enemies.splice(i, 1);
      }
    }
    if (this.spawnedCount >= this.totalEnemiesToSpawn && this.enemies.length === 0) {
      if (this.wave < this.maxWaves) {
        this.wave++;
        const waveElement = document.getElementById('wave-info');
        if(waveElement) waveElement.innerText = `Wave: ${this.wave}/${this.maxWaves}`;
        this.startWave();
      } else { this.endBattle(true); }
    }
  }
  
  endBattle(victory) {
    if (this.spawnTimer) this.spawnTimer.remove();
    this.onBattleOver(victory);
  }
}
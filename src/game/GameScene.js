import Phaser from 'phaser';
import { BattleManager } from './BattleManager.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.wordsData = data.wordsData; this.onComplete = data.onComplete; }
  create() {
    this.battleManager = new BattleManager(this, this.wordsData, (victory) => {
      this.scene.stop(); this.onComplete(victory);
    });
  }
  update(time, delta) {
    if (this.battleManager) this.battleManager.update(time, delta);
  }
}
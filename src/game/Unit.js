import Phaser from 'phaser';

export class Unit {
  constructor(scene, x, y, wordData) {
    this.scene = scene; this.x = x; this.y = y; this.wordData = wordData;
    this.range = 120; this.cooldown = 0; this.attackRate = 60;
    this.container = scene.add.container(x, y);
    const bg = scene.add.circle(0, 0, 20, 0x3b82f6);
    const emoji = scene.add.text(0, 0, wordData.emoji, { fontSize: '18px' }).setOrigin(0.5);
    this.container.add([bg, emoji]);
  }
  update(enemies) {
    if (this.cooldown > 0) this.cooldown--;
    if (this.cooldown === 0 && enemies.length > 0) {
      let target = null; let minDist = this.range;
      for (let enemy of enemies) {
        let dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
        if (dist <= minDist) { minDist = dist; target = enemy; }
      }
      if (target) { this.shoot(target); this.cooldown = this.attackRate; }
    }
  }
  shoot(target) {
    const bullet = this.scene.add.circle(this.x, this.y, 4, 0xfbbf24);
    this.scene.tweens.add({
      targets: bullet, x: target.x, y: target.y, duration: 250,
      onComplete: () => { bullet.destroy(); if (target && target.takeDamage) target.takeDamage(25); }
    });
  }
  destroy() { if (this.container) this.container.destroy(); }
}
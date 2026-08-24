import Phaser from 'phaser';

export class Enemy {
  constructor(scene, x, y, pathTarget) {
    this.scene = scene; this.x = x; this.y = y; this.target = pathTarget;
    this.hp = 50; this.maxHp = 50; this.speed = 0.8;
    this.container = scene.add.container(x, y);
    const bg = scene.add.circle(0, 0, 14, 0x1f2937);
    const text = scene.add.text(0, 0, '👹', { fontSize: '14px' }).setOrigin(0.5);
    this.container.add([bg, text]);
  }
  update() {
    if (this.hp <= 0) return 'dead';
    let angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    this.x += Math.cos(angle) * this.speed; this.y += Math.sin(angle) * this.speed;
    this.container.setPosition(this.x, this.y);
    let dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist < 20) return 'reach_heart';
    return this.hp <= 0 ? 'dead' : 'moving';
  }
  takeDamage(amount) { this.hp -= amount; }
  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}
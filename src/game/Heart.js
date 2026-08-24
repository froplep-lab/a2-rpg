export class Heart {
  constructor(scene, x, y) {
    this.scene = scene; this.maxHp = 100; this.hp = 100;
    this.graphics = scene.add.graphics(); this.x = x; this.y = y; this.draw();
  }
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount); this.draw(); return this.hp === 0;
  }
  draw() {
    this.graphics.clear();
    this.graphics.fillStyle(0xef4444, 1); this.graphics.fillCircle(this.x, this.y, 24);
    this.graphics.lineStyle(2, 0xffffff, 1); this.graphics.strokeCircle(this.x, this.y, 24);
  }
}
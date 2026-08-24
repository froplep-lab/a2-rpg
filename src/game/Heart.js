export class Heart {
  constructor(scene,x,y){
    this.scene=scene;this.x=x;this.y=y;this.maxHp=100;this.hp=100;
    this.container=scene.add.container(x,y);this.body=scene.add.graphics();this.container.add(this.body);this.text=scene.add.text(0,0,'❤',{fontFamily:'Arial',fontSize:'34px',color:'#ff6b7d',fontStyle:'bold'}).setOrigin(.5);this.container.add(this.text);this.draw();
  }
  setPosition(x,y){this.x=x;this.y=y;this.container.setPosition(x,y)}
  takeDamage(n){this.hp=Math.max(0,this.hp-n);this.draw();return this.hp===0}
  draw(){this.body.clear();this.body.fillStyle(0x101a2d,0.98);this.body.fillRoundedRect(-42,-42,84,84,22);this.body.lineStyle(3,0xff6578,0.8);this.body.strokeRoundedRect(-42,-42,84,84,22);this.body.fillStyle(0xff6578,0.18);this.body.fillRoundedRect(-32,28,64,5,3);this.body.fillStyle(0x55ddb0,1);this.body.fillRoundedRect(-32,28,64*Math.max(0,this.hp/this.maxHp),5,3)}
  destroy(){this.container?.destroy(true)}
}

import Phaser from 'phaser';
export class Enemy{
  constructor(scene,x,y,target,hp=72,speed=.45){
    this.scene=scene;this.x=x;this.y=y;this.target=target;this.hp=hp;this.maxHp=hp;this.speed=speed;this.dead=false;
    this.container=scene.add.container(x,y);
    this.shadow=scene.add.ellipse(0,18,34,10,0x000000,.25);
    this.bg=scene.add.circle(0,0,20,0x252f42);this.icon=scene.add.text(0,0,'👾',{fontFamily:'Arial',fontSize:'22px'}).setOrigin(.5);
    this.barBack=scene.add.rectangle(0,-29,42,6,0x0a1020,.95).setOrigin(.5);this.bar=scene.add.rectangle(0,-29,40,4,0xff6b7d,.98).setOrigin(.5);
    this.container.add([this.shadow,this.bg,this.icon,this.barBack,this.bar]);
  }
  update(dt){
    if(this.dead)return 'dead';
    const a=Phaser.Math.Angle.Between(this.x,this.y,this.target.x,this.target.y);
    const step=this.speed*dt;
    this.x+=Math.cos(a)*step;this.y+=Math.sin(a)*step;this.container.setPosition(this.x,this.y);
    this.bar.width=40*Math.max(0,this.hp/this.maxHp);
    if(this.hp<=0){this.dead=true;return'dead'}
    return Phaser.Math.Distance.Between(this.x,this.y,this.target.x,this.target.y)<34?'reach_heart':'moving';
  }
  takeDamage(n){if(!this.dead)this.hp-=n}
  destroy(){this.container?.destroy(true);this.container=null}
}

import Phaser from 'phaser';
export class Enemy{
 constructor(scene,x,y,target,hp=55,speed=.55){this.scene=scene;this.x=x;this.y=y;this.target=target;this.hp=hp;this.maxHp=hp;this.speed=speed;this.dead=false;this.container=scene.add.container(x,y);const bg=scene.add.circle(0,0,17,0x1f2937);const t=scene.add.text(0,0,'👹',{fontSize:'18px'}).setOrigin(.5);this.bar=scene.add.rectangle(0,-24,30,4,0x22c55e).setOrigin(.5);this.container.add([bg,t,this.bar])}
 update(dt){if(this.dead)return'dead';const a=Phaser.Math.Angle.Between(this.x,this.y,this.target.x,this.target.y);this.x+=Math.cos(a)*this.speed*dt/16.67;this.y+=Math.sin(a)*this.speed*dt/16.67;this.container.setPosition(this.x,this.y);this.bar.width=30*Math.max(0,this.hp/this.maxHp);if(this.hp<=0){this.dead=true;return'dead'}return Phaser.Math.Distance.Between(this.x,this.y,this.target.x,this.target.y)<25?'reach_heart':'moving'}
 takeDamage(n){if(this.dead)return;this.hp-=n;if(this.hp<=0)this.dead=true}
 destroy(){this.container?.destroy();this.container=null}
}
import Phaser from 'phaser';
export class Unit{
 constructor(scene,x,y,word){this.scene=scene;this.x=x;this.y=y;this.word=word;this.range=145;this.cooldown=0;this.attackRate=720;this.container=scene.add.container(x,y);this.container.add([scene.add.circle(0,0,22,0x5b4bdb),scene.add.text(0,0,word.emoji,{fontSize:'20px'}).setOrigin(.5),scene.add.text(0,31,word.word.split(' ').pop(),{fontSize:'10px',color:'#d8dcef'}).setOrigin(.5)])}
 update(enemies,dt){this.cooldown=Math.max(0,this.cooldown-dt);if(this.cooldown>0)return;let target=null,dist=this.range;for(const e of enemies){const d=Phaser.Math.Distance.Between(this.x,this.y,e.x,e.y);if(!e.dead&&d<dist){dist=d;target=e}}if(target){this.shoot(target);this.cooldown=this.attackRate}}
 shoot(target){const b=this.scene.add.circle(this.x,this.y,4,0xffc857);this.scene.tweens.add({targets:b,x:target.x,y:target.y,duration:180,onComplete:()=>{b.destroy();if(target&&!target.dead)target.takeDamage(28)}})}
 destroy(){this.container?.destroy()}
}
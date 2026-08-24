import Phaser from 'phaser';
export class Unit{
  constructor(scene,x,y,word,level=1,onShoot){
    this.scene=scene;this.x=x;this.y=y;this.word=word;this.level=level;this.onShoot=onShoot;this.range=150;this.cooldown=0;this.attackRate=Math.max(360,820-level*28);
    this.container=scene.add.container(x,y);
    this.tile=scene.add.graphics();this.face=scene.add.text(0,-4,word.emoji||'📚',{fontFamily:'Arial',fontSize:'22px'}).setOrigin(.5);
    this.name=scene.add.text(0,26,this.shortWord(),{fontFamily:'Arial',fontSize:'10px',fontStyle:'bold',color:'#dbe5f7'}).setOrigin(.5);
    this.lvl=scene.add.text(0,-28,`LV ${level}`,{fontFamily:'Arial',fontSize:'8px',fontStyle:'bold',color:'#182238',backgroundColor:'#dce5f2',padding:{x:4,y:2}}).setOrigin(.5);
    this.container.add([this.tile,this.face,this.name,this.lvl]);this.draw();
  }
  shortWord(){return String(this.word.word||'').replace(/^(der|die|das)\s+/i,'').slice(0,12)}
  setPosition(x,y){this.x=x;this.y=y;this.container.setPosition(x,y)}
  draw(){
    const fills=[0x6175ff,0x56caa6,0xe9ad48,0xd46cf1,0x57a6ea];const fill=fills[(this.level-1)%fills.length];
    this.tile.clear();this.tile.fillStyle(0xf5f7fb,1);this.tile.fillRoundedRect(-29,-25,58,58,14);this.tile.lineStyle(3,fill,.95);this.tile.strokeRoundedRect(-29,-25,58,58,14);this.tile.fillStyle(fill,.12);this.tile.fillRoundedRect(-24,-20,48,48,11);
  }
  update(enemies,dt){
    this.cooldown=Math.max(0,this.cooldown-dt);if(this.cooldown>0)return;
    let target=null,dist=this.range;
    for(const e of enemies){if(e.dead)continue;const d=Phaser.Math.Distance.Between(this.x,this.y,e.x,e.y);if(d<dist){dist=d;target=e}}
    if(target){this.shoot(target);this.cooldown=this.attackRate}
  }
  shoot(target){
    const orb=this.scene.add.circle(this.x,this.y,4,0x9aa6ff,.95);
    this.scene.tweens.add({targets:orb,x:target.x,y:target.y,duration:150,ease:'Quad.easeIn',onComplete:()=>{orb.destroy();if(target&&!target.dead){target.takeDamage(22+this.level*9);this.onShoot?.()}}});
  }
  setLevel(level){this.level=level;this.lvl.setText(`LV ${level}`);this.draw();}
  destroy(){this.container?.destroy(true)}
}

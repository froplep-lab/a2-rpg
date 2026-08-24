import Phaser from 'phaser';
import {BattleManager} from './BattleManager.js';
export class GameScene extends Phaser.Scene{
  constructor(){super('GameScene')}
  init(data){this.wordsData=data.wordsData;this.onComplete=data.onComplete;this.onUI=data.onUI}
  create(){
    this.cameras.main.setBackgroundColor('#070b15');
    this.bg=this.add.graphics();this.drawBackground();
    this.manager=new BattleManager(this,this.wordsData,this.onComplete,this.onUI);
    this.scale.on('resize',()=>this.drawBackground());
  }
  drawBackground(){const w=this.scale.width,h=this.scale.height;this.bg?.clear();this.bg?.fillStyle(0x070b15,1);this.bg?.fillRect(0,0,w,h);this.bg?.fillStyle(0x17243b,.32);this.bg?.fillCircle(w/2,-80,Math.min(w,h)*.7)}
  update(t,d){this.manager?.update(t,d)}
  shutdown(){this.manager?.destroy();this.bg?.destroy()}
}

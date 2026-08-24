import Phaser from 'phaser';
import {Heart} from './Heart.js';
import {Unit} from './Unit.js';
import {Enemy} from './Enemy.js';

export class BattleManager{
  constructor(scene,words,onOver,onUI){
    this.scene=scene;this.words=words;this.onOver=onOver;this.onUI=onUI;
    this.wave=1;this.maxWaves=3;this.enemies=[];this.units=new Map();this.cells=[];this.selectedHand=0;this.coins=100;this.ended=false;this.hand=[];this.spawned=0;this.total=0;
    this.board=scene.add.container(0,0);this.path=scene.add.graphics();this.grid=scene.add.graphics();
    this.layout();this.scene.scale.on('resize',()=>this.layout());
    this.makeHand();this.seedBoard();this.makeInput();this.updateUI();this.startWave();
  }
  layout(){
    const w=this.scene.scale.width,h=this.scene.scale.height;this.w=w;this.h=h;
    const reserveBottom=Math.min(120,h*.23),top=78;const boardW=Math.min(w-28,Math.max(320,w*.62));const boardH=Math.min(h-top-reserveBottom-14,boardW*.72);
    this.boardX=(w-boardW)/2;this.boardY=top+Math.max(0,(h-top-reserveBottom-boardH)/2);this.boardW=boardW;this.boardH=boardH;
    const cols=5,rows=3;this.cellW=boardW/cols;this.cellH=boardH/rows;
    this.cells=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)this.cells.push({r,c,x:this.boardX+(c+.5)*this.cellW,y:this.boardY+(r+.5)*this.cellH,key:r*cols+c});
    this.drawBoard();
    if(this.heart){this.heart.setPosition(w/2,Math.min(h-145,this.boardY+this.boardH+54))}
    for(const {cell,unit} of this.units.values())unit.setPosition(cell.x,cell.y);
    for(const e of this.enemies){/* enemies keep their own positions */}
  }
  drawBoard(){
    this.path.clear();this.path.fillStyle(0x09101d,.35);this.path.fillRoundedRect(this.boardX-12,this.boardY-12,this.boardW+24,this.boardH+24,24);
    this.path.lineStyle(1,0x31415d,.9);this.path.strokeRoundedRect(this.boardX-12,this.boardY-12,this.boardW+24,this.boardH+24,24);
    this.grid.clear();for(const c of this.cells){const active=this.units.has(c.key);this.grid.fillStyle(active?0xf4f6fa:0xe4e9f0,1);this.grid.fillRoundedRect(c.x-this.cellW/2+3,c.y-this.cellH/2+3,this.cellW-6,this.cellH-6,11);this.grid.lineStyle(1,active?0x91a1ff:0xc5ceda,.95);this.grid.strokeRoundedRect(c.x-this.cellW/2+3,c.y-this.cellH/2+3,this.cellW-6,this.cellH-6,11)}
  }
  makeInput(){
    this.scene.input.on('pointerdown',(p)=>{
      if(this.ended)return;const cell=this.cells.find(c=>p.x>=c.x-this.cellW/2&&p.x<=c.x+this.cellW/2&&p.y>=c.y-this.cellH/2&&p.y<=c.y+this.cellH/2);if(!cell)return;
      const existing=this.units.get(cell.key);if(existing){
        const h=this.hand[this.selectedHand];if(h&&existing.unit.word.id===h.id&&existing.unit.level===existing.unit.level){this.merge(cell.key);}
      }else{this.place(cell.key,this.hand[this.selectedHand])}
    });
  }
  makeHand(){this.hand=[];for(let i=0;i<5;i++)this.hand.push(this.randomWord())}
  randomWord(){return this.words[Phaser.Math.Between(0,this.words.length-1)]}
  seedBoard(){for(let i=0;i<3;i++){const card=this.randomWord();this.addUnitAt(this.cells[i*2+1].key,card,1)}this.heart=new Heart(this.scene,this.w/2,Math.min(this.h-145,this.boardY+this.boardH+54));}
  addUnitAt(key,word,level){const cell=this.cells[key];const u=new Unit(this.scene,cell.x,cell.y,word,level,()=>this.onUI?.({coins:this.coins,wave:this.wave,hp:this.heart.hp}));this.units.set(key,{cell,unit:u});this.drawBoard();}
  place(key,card){if(!card)return;this.addUnitAt(key,card,1);this.hand[this.selectedHand]=this.randomWord();this.selectedHand=0;this.updateUI()}
  merge(key){const entry=this.units.get(key);if(!entry)return;const card=this.hand[this.selectedHand];if(!card||entry.unit.word.id!==card.id)return;const nextLevel=Math.min(7,entry.unit.level+1);entry.unit.setLevel(nextLevel);entry.unit.word=card;this.coins+=3;this.hand[this.selectedHand]=this.randomWord();this.selectedHand=0;this.updateUI();this.drawBoard()}
  roll(){if(this.ended||this.coins<10){this.scene.cameras.main.shake(90,0.004);return false}this.coins-=10;this.makeHand();this.selectedHand=0;this.updateUI();return true}
  selectHand(i){if(i<0||i>=this.hand.length)return;this.selectedHand=i;this.updateUI()}
  startWave(){
    const totals=[6,8,10];this.total=totals[this.wave-1];this.spawned=0;this.spawnTimer=this.scene.time.addEvent({delay:720,repeat:this.total-1,callback:()=>this.spawnEnemy()});
  }
  spawnEnemy(){if(this.ended)return;const x=Phaser.Math.Between(this.boardX+12,this.boardX+this.boardW-12);const y=this.boardY-34;const hp=70+this.wave*28+this.spawned*5;this.enemies.push(new Enemy(this.scene,x,y,this.heart,hp,.38+this.wave*.07));this.spawned++}
  update(_,dt){
    if(this.ended)return;
    for(const e of this.enemies){e.update(dt)}
    for(const {unit} of this.units.values())unit.update(this.enemies,dt);
    for(let i=this.enemies.length-1;i>=0;i--){const e=this.enemies[i],s=e.dead?'dead':(Phaser.Math.Distance.Between(e.x,e.y,this.heart.x,this.heart.y)<34?'reach_heart':'moving');if(s==='reach_heart'){e.destroy();this.enemies.splice(i,1);if(this.heart.takeDamage(15)){this.updateUI();this.end(false);return}}
      else if(s==='dead'){e.destroy();this.enemies.splice(i,1);this.coins+=2;}
    }
    if(this.spawned>=this.total&&this.enemies.length===0){if(this.wave<this.maxWaves){this.wave++;this.updateUI();this.startWave()}else this.end(true)}
    this.updateUI(false);
  }
  updateUI(full=true){this.onUI?.({coins:this.coins,wave:this.wave,maxWaves:this.maxWaves,hp:this.heart?.hp??100,hand:full?this.hand:null,selected:this.selectedHand});}
  end(v){if(this.ended)return;this.ended=true;this.spawnTimer?.remove();for(const e of this.enemies)e.destroy();this.enemies=[];this.onOver(v,{merged:[...this.units.values()].map(x=>x.unit.level),coins:this.coins})}
  destroy(){this.ended=true;this.spawnTimer?.remove();this.scene.scale.off('resize');for(const {unit} of this.units.values())unit.destroy();for(const e of this.enemies)e.destroy();this.heart?.destroy();this.board?.destroy(true);this.grid?.destroy();this.path?.destroy()}
}

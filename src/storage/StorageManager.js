const KEY='rdk_save_v2';
function freshCards(words){return Object.fromEntries(words.map((w,i)=>[w.id,{level:1,xp:0,mastery:0,bookmarked:i<2}]));}
export class StorageManager{
 static defaultState(words=[]){return {version:2,playerLevel:1,playerXP:0,coins:150,streak:0,lastActiveDate:null,cards:freshCards(words),daily:{date:null,trial:0,battles:0},settings:{sound:true}}}
 static migrate(data,words=[]){const base=this.defaultState(words);const s={...base,...(data||{}),cards:{...base.cards,...(data?.cards||{})},daily:{...base.daily,...(data?.daily||{}),},settings:{...base.settings,...(data?.settings||{})}};if(s.daily.date!==this.today()){s.daily={date:this.today(),trial:0,battles:0};}return s}
 static today(){return new Date().toISOString().slice(0,10)}
 static load(words=[]){try{const raw=localStorage.getItem(KEY);return this.migrate(raw?JSON.parse(raw):null,words)}catch{return this.defaultState(words)}}
 static save(state){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('Save failed',e)}return state}
 static reset(words=[]){const s=this.defaultState(words);this.save(s);return s}
}
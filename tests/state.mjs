import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const src=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const start=src.indexOf('function defaults()');
const end=src.indexOf('\nfunction loadSave()',start);
assert.ok(start>=0&&end>start,'save normalization block missing');
const chunk=src.slice(start,end);
const ctx={
  Date, Math,
  BALANCE:{dailyGoal:24},
  SAVE_VERSION:12,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
  isObj:x=>x&&typeof x==='object'&&!Array.isArray(x),
  dateKey:(d=new Date())=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`},
};
const today=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
ctx.todayKey=()=>today;
const fn=new Function(...Object.keys(ctx),`${chunk}; return {defaults,normalizeSave};`)(...Object.values(ctx));
const malformed={
  xp:'120',streak:-4,answers:'10',correct:'6',errors:'4',learnedToday:'7',dayKey:today,
  mastery:{a:200,b:'nope'},
  review:{a:{box:99,reps:-2,lapses:'3',interval:-8,status:'wat',dueAt:'10',lastSeen:'20',lastQuality:9},bad:null},
  history:{[today]:'7',bad:'nope'},favorites:['a','a','',2],customWords:[{german:'Haus',ukrainian:'дім'},{}],settings:{theme:'purple',voiceRate:9},updatedAt:'55'
};
const out=fn.normalizeSave(malformed);
assert.equal(out.version,12);
assert.equal(out.streak,0);
assert.deepEqual(out.mastery,{a:100});
assert.equal(out.review.a.box,6);
assert.equal(out.review.a.reps,0);
assert.equal(out.review.a.lapses,3);
assert.equal(out.review.a.interval,0);
assert.equal(out.review.a.status,'new');
assert.equal(out.review.a.lastQuality,5);
assert.deepEqual(out.history,{[today]:7});
assert.deepEqual(out.favorites,['a','2']);
assert.equal(out.customWords.length,1);
assert.equal(out.settings.theme,'dark');
assert.equal(out.settings.voiceRate,1.12);
console.log('STATE NORMALIZATION OK');

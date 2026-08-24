import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html');
const js=read('js/app.js');
const server=read('server/index.mjs');
const words=JSON.parse(read('data/words.json'));
assert.ok(Array.isArray(words)&&words.length>=250,'dictionary missing');
assert.doesNotMatch(html,/Random Dice|Battle Board|WAVE|ROLL|START WAVE|enemy|boss/i,'old game UI still present');
assert.doesNotMatch(js,/diceTypes|startWave|spawnDie|autoMerge|battleQuestion|enemies|Random Dice/i,'old game logic still present');
assert.ok(html.includes('id="ankiCard"'),'anki card missing');
assert.ok(html.includes('id="speakWord"')&&html.includes('id="speakSentence"'),'audio controls missing');
assert.ok(js.includes('speechSynthesis'),'speech synthesis missing');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);const dup=ids.filter((id,i)=>ids.indexOf(id)!==i);assert.equal(new Set(dup).size,0,`duplicate ids: ${[...new Set(dup)].join(', ')}`);
const refIds=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);for(const id of new Set(refIds))assert.ok(ids.includes(id),`missing DOM id: ${id}`);
const sw=read('sw.js');for(const asset of [...sw.matchAll(/'([^']+)'/g)].map(m=>m[1]).filter(x=>x.startsWith('./'))){assert.ok(fs.existsSync(path.join(root,asset))||asset==='./','missing SW asset '+asset)}
let p=spawn(process.execPath,['--check','js/app.js']);let code=await new Promise(r=>p.on('close',r));assert.equal(code,0,'js syntax failed');
p=spawn(process.execPath,['--check','server/index.mjs']);code=await new Promise(r=>p.on('close',r));assert.equal(code,0,'server syntax failed');
console.log('SMOKE OK');

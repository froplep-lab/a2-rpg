const VERSION='0.010';
const WORDS_URL='./data/words.json';
const SAVE_BASE='gestalt_v010';
const INTERVALS=[1,2,4,7,14,30];
const navItems=[['dashboard','⌂','Головна'],['words','▣','Слова'],['anki','▤','Anki'],['dice','◉','Dice'],['profile','⚙','Профіль']];
const titles={
  dashboard:['Головне меню','Центр керування: вчи, повторюй, грай та прокачуйся'],
  words:['Вивчення слів','Додавай слова та вчи їх'],
  anki:['Картки Anki','Інтелектуальна система повторення SRS'],
  dice:['Random Dice','Кинь кубик і отримай випадкову карту'],
  profile:['Профіль та налаштування','Твій прогрес, резервні копії та налаштування']
};
const $=id=>document.getElementById(id);
let words=[];
let save={};
let state={screen:'dashboard',ankiIndex:0,ankiRevealed:false,selected:-1,battleQuestion:null,battleTimer:null};
let tg=null;
let telegramReady=false;
let syncTimer=null;
let cloudSyncInFlight=false;
let lastCloudSaveAt=0;

const defaultSave=()=>({
  saveVersion:10,savedAt:0,xp:0,level:1,streak:0,lastOpen:null,lastActivity:null,
  gold:0,gems:0,energy:5,mastery:{},reviews:{},errors:0,answers:0,correct:0,
  customWords:[],bestWave:0,
  dice:{wave:1,base:100,mana:30,power:0,combo:0,board:Array(15).fill(null),enemies:[],running:false},
  settings:{theme:'dark',reducedMotion:false}
});

function getTg(){return window.Telegram?.WebApp||null}
function userKey(){const u=tg?.initDataUnsafe?.user;return u?.id?`${SAVE_BASE}_${u.id}`:SAVE_BASE}
function safeGet(key){try{return localStorage.getItem(key)}catch{return null}}
function safeSet(key,value){try{localStorage.setItem(key,value);return true}catch{return false}}
function safeRemove(key){try{localStorage.removeItem(key)}catch{}}
function isPlainObject(v){return v&&typeof v==='object'&&!Array.isArray(v)}
function uid(){return 'u-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function dateKey(d=new Date()){return new Intl.DateTimeFormat('en-CA').format(d)}
function todayStart(){const d=new Date();d.setHours(0,0,0,0);return d}
function yesterdayKey(){const d=new Date();d.setDate(d.getDate()-1);return dateKey(d)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function haptic(type='light'){try{tg?.HapticFeedback?.impactOccurred(type)}catch{}}
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1800)}

function normalizeSave(raw){
  const d=defaultSave();
  const x=isPlainObject(raw)?raw:{};
  const out={...d,...x};
  out.saveVersion=10;
  out.xp=Math.max(0,Number(out.xp)||0);
  out.level=Math.max(1,Number(out.level)||1);
  out.streak=Math.max(0,Number(out.streak)||0);
  out.gold=Math.max(0,Number(out.gold)||0);
  out.gems=Math.max(0,Number(out.gems)||0);
  out.energy=Math.max(0,Number(out.energy)||0);
  out.answers=Math.max(0,Number(out.answers)||0);
  out.correct=Math.max(0,Number(out.correct)||0);
  out.errors=Math.max(0,Number(out.errors)||0);
  out.bestWave=Math.max(0,Number(out.bestWave)||0);
  out.mastery=isPlainObject(x.mastery)?x.mastery:{};
  out.reviews=isPlainObject(x.reviews)?x.reviews:{};
  out.customWords=Array.isArray(x.customWords)?x.customWords.filter(Boolean):[];
  out.dice={...d.dice,...(isPlainObject(x.dice)?x.dice:{})};
  out.dice.wave=Math.max(1,Math.min(10,Number(out.dice.wave)||1));
  out.dice.base=Math.max(0,Math.min(100,Number(out.dice.base)||0));
  out.dice.mana=Math.max(0,Math.min(40,Number(out.dice.mana)||0));
  out.dice.power=Math.max(0,Number(out.dice.power)||0);
  out.dice.combo=Math.max(0,Math.min(9,Number(out.dice.combo)||0));
  out.dice.board=Array.isArray(out.dice.board)?out.dice.board.slice(0,15):[];
  while(out.dice.board.length<15)out.dice.board.push(null);
  out.dice.running=Boolean(out.dice.running);
  out.dice.enemies=Array.isArray(out.dice.enemies)?out.dice.enemies:[];
  out.settings={...d.settings,...(isPlainObject(x.settings)?x.settings:{})};
  if(!['dark','light'].includes(out.settings.theme))out.settings.theme='dark';
  out.settings.reducedMotion=Boolean(out.settings.reducedMotion);
  out.savedAt=Math.max(0,Number(out.savedAt)||0);
  return out;
}

function loadLocal(){
  let raw=null;
  try{raw=JSON.parse(safeGet(userKey())||'null')}catch{}
  if(!raw){
    try{raw=JSON.parse(safeGet('de_b1_rpg_progress_v3')||'null')}catch{}
    if(raw){raw={...defaultSave(),xp:raw.xp,level:raw.level,streak:raw.streak,gold:raw.gold}}
  }
  if(!raw){
    try{const old=JSON.parse(safeGet('deutsch_quest_v002')||'null');if(old)raw={...defaultSave(),...old}}catch{}
  }
  save=normalizeSave(raw||defaultSave());
  if(save.dice.running){
    save.dice.running=false;
    save.dice.enemies=[];
    state.battleQuestion=null;
  }
  save.lastOpen=Date.now();
  safeSet(userKey(),JSON.stringify(save));
}
function persistLocal(){
  save.savedAt=Date.now();
  safeSet(userKey(),JSON.stringify(save));
}

function tgCloudCall(method,...args){
  return new Promise(resolve=>{
    try{
      const api=tg?.CloudStorage;
      if(!api||typeof api[method]!=='function')return resolve(null);
      api[method](...args,(err,value)=>resolve(err?null:value));
    }catch{resolve(null)}
  });
}
function tgDeviceCall(method,key,value){
  return new Promise(resolve=>{
    try{
      const api=tg?.DeviceStorage;
      if(!api||typeof api[method]!=='function')return resolve(false);
      if(method==='setItem')api.setItem(key,value,err=>resolve(!err));
      else if(method==='getItem')api.getItem(key,(err,v)=>resolve(err?null:v));
      else if(method==='removeItem')api.removeItem(key,err=>resolve(!err));
      else resolve(false);
    }catch{resolve(false)}
  });
}
const CLOUD_PREFIX='gst9_';
const CLOUD_META=CLOUD_PREFIX+'meta';
const CLOUD_CHUNK_PREFIX=CLOUD_PREFIX+'c_';
function chunkString(s,size=3400){const out=[];for(let i=0;i<s.length;i+=size)out.push(s.slice(i,i+size));return out}
async function cloudLoad(){
  if(!tg)return null;
  const metaRaw=await tgCloudCall('getItem',CLOUD_META);
  if(metaRaw){
    try{
      const meta=JSON.parse(metaRaw);const count=Math.max(0,Math.min(32,Number(meta.count)||0));
      const keys=Array.from({length:count},(_,i)=>CLOUD_CHUNK_PREFIX+i);
      const vals=await new Promise(resolve=>{try{tg.CloudStorage.getItems(keys,(err,v)=>resolve(err?null:v))}catch{resolve(null)}});
      if(vals&&typeof vals==='object'&&!Array.isArray(vals)){
        const joined=keys.map(k=>String(vals[k]??'')).join('');
        if(joined&&keys.every(k=>Object.prototype.hasOwnProperty.call(vals,k)))return JSON.parse(joined);
      }
    }catch{}
  }
  const device=await tgDeviceCall('getItem',`${CLOUD_PREFIX}state`);
  if(device){try{return JSON.parse(device)}catch{}}
  return null;
}
async function cloudSave(){
  if(!tg)return false;
  const json=JSON.stringify(save);const chunks=chunkString(json);
  if(chunks.length<=32){
    let ok=true;
    for(let i=0;i<chunks.length;i++){const r=await tgCloudCall('setItem',CLOUD_CHUNK_PREFIX+i,chunks[i]);if(r===null)ok=false}
    await tgCloudCall('setItem',CLOUD_META,JSON.stringify({count:chunks.length,savedAt:save.savedAt,version:VERSION}));
    if(ok)return true;
  }
  const deviceOk=await tgDeviceCall('setItem',`${CLOUD_PREFIX}state`,json);
  return Boolean(deviceOk);
}
async function hydrateTelegram(){
  if(!tg)return;
  const remote=await cloudLoad();
  if(remote&&typeof remote==='object'){
    const remoteSave=normalizeSave(remote);
    if((remoteSave.savedAt||0)>=(save.savedAt||0))save=remoteSave;
  }
  persistLocal();
  queueCloudSave();
}
function queueCloudSave(){
  if(!tg)return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(async()=>{
    if(cloudSyncInFlight)return;
    cloudSyncInFlight=true;
    try{const ok=await cloudSave();lastCloudSaveAt=Date.now();setSyncStatus(ok?'Синхронізовано з Telegram':'Локально · Telegram sync недоступний')}finally{cloudSyncInFlight=false}
  },450);
}
function setSyncStatus(text){const el=$('tgSyncStatus');if(el)el.textContent=text}
function persist(){persistLocal();queueCloudSave()}

function touchActivity(){
  const now=dateKey();
  if(save.lastActivity===now)return;
  if(save.lastActivity===yesterdayKey())save.streak=Math.max(1,save.streak+1);else save.streak=1;
  save.lastActivity=now;
  persist();
}
function levelFromXp(xp){let lvl=1,need=100,x=Math.max(0,xp);while(x>=need){x-=need;lvl++;need=100+lvl*25}return{lvl,xpInLevel:x,need}}
function award(xp,coins=0){save.xp=Math.max(0,save.xp+Number(xp||0));save.gold=Math.max(0,save.gold+Number(coins||0));const l=levelFromXp(save.xp);if(l.lvl!==save.level){save.level=l.lvl;toast(`Новий рівень: ${l.lvl} 🎉`);haptic('medium')}persist();renderAll()}
function mergedWords(){return [...words,...save.customWords]}
function wordKey(w){return String(w?.id||w?.german||'').trim()}
function mastery(w){return Math.max(0,Math.min(5,Number(save.mastery[wordKey(w)]||0)))}
function reviewBox(w){const r=save.reviews[wordKey(w)];if(!r)return 0;return Math.max(0,Math.min(INTERVALS.length-1,Number.isFinite(Number(r.box))?Number(r.box):Math.min(INTERVALS.length-1,Math.max(0,mastery(w)-1))))}
function due(w){const r=save.reviews[wordKey(w)];return !r||!r.next||new Date(r.next)<=new Date()}
function setReview(w,q,m){
  const key=wordKey(w);
  const previous=reviewBox(w);
  let box=previous;
  if(q>=5) box=Math.min(INTERVALS.length-1,previous+2);
  else if(q>=4) box=Math.min(INTERVALS.length-1,previous+1);
  else if(q<=0) box=Math.max(0,previous-1);
  const days=INTERVALS[box];
  const next=new Date();next.setDate(next.getDate()+days);
  save.reviews[key]={next:next.toISOString(),q,m,box,lastReviewedAt:Date.now()};
}
function dueWords(){return mergedWords().filter(due)}
function pickLearningWord(){
  const all=mergedWords();if(!all.length)return null;
  const dueList=all.filter(due);
  const pool=(dueList.length?dueList:all).slice();
  pool.sort((a,b)=>{
    const am=mastery(a),bm=mastery(b),ar=save.reviews[wordKey(a)],br=save.reviews[wordKey(b)];
    const ad=ar?.next?new Date(ar.next).getTime():0,bd=br?.next?new Date(br.next).getTime():0;
    return (am-bm)*1000000000+(ad-bd);
  });
  return pool[Math.floor(Math.random()*Math.min(6,pool.length))]||pool[0];
}

function buildNav(){
  const side=$('sideNav'),bottom=$('bottomNav');
  side.innerHTML=navItems.map(([id,ico,label])=>`<button data-nav="${id}"><span class="ico">${ico}</span>${label}</button>`).join('');
  bottom.innerHTML=navItems.map(([id,ico,label])=>`<button data-nav="${id}"><div style="font-size:18px">${ico}</div>${label}</button>`).join('');
  document.addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(!b)return;nav(b.dataset.nav)},{passive:true});
}
function nav(screen){
  if(!titles[screen])screen='dashboard';
  state.screen=screen;state.ankiRevealed=false;state.selected=-1;
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='screen-'+screen));
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===screen));
  $('pageTitle').textContent=titles[screen][0];$('pageSubtitle').textContent=titles[screen][1];
  if(screen==='anki')renderAnki();
  if(screen==='dice'){renderDice();setDiceSwipeLock(true)}else setDiceSwipeLock(false);
  if(tg){syncTelegramBackButton();syncTelegramMainButton();}
  renderAll();
  haptic('light');
}
function renderHeader(){
  const l=levelFromXp(save.xp);$('level').textContent=l.lvl;$('resources').innerHTML=`<div class="res">🪙 <b>${save.gold}</b></div><div class="res">◈ <b>${save.gems}</b></div><div class="res">⚡ <b>${save.energy}</b></div>`;
  const u=tg?.initDataUnsafe?.user;const name=u?.first_name?`${u.first_name}${u.last_name?' '+u.last_name:''}`:'Wanderer';
  $('heroName').textContent=name;$('homeLevel').textContent=l.lvl;$('homeXp').textContent=save.xp;$('homeStreak').textContent=save.streak;$('todayLabel').textContent=new Date().toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric'});
  const avatar=u?.photo_url?`<img src="${esc(u.photo_url)}" alt="">`:'🧭';$('avatar').innerHTML=avatar;$('profileAvatar').innerHTML=avatar;
  const foot=document.querySelector('.foot');if(foot)foot.innerHTML=`Offline-ready · PC + phone · Telegram Mini App<br>v${VERSION}`;
}
function renderDashboard(){
  const all=mergedWords(), mastered=all.filter(w=>mastery(w)>=5).length, du=all.filter(due).length, acc=save.answers?Math.round(save.correct/save.answers*100):0;
  $('dTotal').textContent=all.length;$('dMastered').textContent=mastered;$('dDue').textContent=du;$('dAccuracy').textContent=acc+'%';
  const rec=all.filter(due).sort((a,b)=>mastery(a)-mastery(b))[0]||all[0];
  $('recommendation').textContent=rec?.german||'Немає слів';$('recommendationMeaning').textContent=rec?.ukrainian||'Додай перше слово';
}
function renderWords(){
  const all=mergedWords(),q=($('search').value||'').trim().toLowerCase();
  $('wTotal').textContent=all.length;$('wMastered').textContent=all.filter(w=>mastery(w)>=5).length;$('wLearning').textContent=all.filter(w=>mastery(w)>0&&mastery(w)<5).length;$('wNew').textContent=all.filter(w=>mastery(w)===0).length;$('wordCountText').textContent=all.length+' слів';
  const list=all.filter(w=>`${w.german} ${w.ukrainian} ${w.sentence||''}`.toLowerCase().includes(q)).slice(0,250);
  $('wordList').innerHTML=list.map(w=>{const m=mastery(w),r=save.reviews[wordKey(w)];return `<div class="word-item"><div><div class="de">${esc(w.german)}</div><div class="ua">${esc(w.ukrainian)}${w.sentence?' · '+esc(w.sentence):''}</div></div><div style="display:flex;gap:6px;align-items:center"><span class="badge">${m}/5</span><span class="badge">${r?.next?new Date(r.next).toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit'}):'нове'}</span></div></div>`}).join('')||'<div class="muted">Нічого не знайдено.</div>';
}
function renderAnki(){
  const list=dueWords().length?dueWords():mergedWords();
  if(!list.length){$('ankiWord').textContent='Додай слова';$('ankiMeaning').textContent='Колекція порожня';$('aDue').textContent='0';return}
  state.ankiIndex=Math.max(0,Math.min(state.ankiIndex,list.length-1));const w=list[state.ankiIndex];
  $('ankiPosition').textContent=`${state.ankiIndex+1} / ${list.length}`;$('ankiWord').textContent=w.german;$('ankiGrammar').textContent=w.grammar||'';$('ankiMeaning').textContent=state.ankiRevealed?w.ukrainian:'Натисни «Показати відповідь»';$('ankiSentence').textContent=state.ankiRevealed?(w.sentence||''):'—';
  $('rateWrap').classList.toggle('hide',!state.ankiRevealed);$('showAnswer').classList.toggle('hide',state.ankiRevealed);$('aDue').textContent=dueWords().length;$('aLearned').textContent=mergedWords().filter(w=>mastery(w)>=5).length;$('aStreak').textContent=save.streak;$('aErrors').textContent=save.errors;$('ankiNext').textContent=state.ankiRevealed?'Оціни картку, щоб продовжити.':'Почни з показу відповіді.';
}
function speakGerman(text){
  const value=String(text||'').trim();if(!value)return;
  try{
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){toast('Озвучка недоступна у цьому браузері');return}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(value);u.lang='de-DE';u.rate=.88;u.pitch=1;
    window.speechSynthesis.speak(u);haptic('light');
  }catch{toast('Озвучку не вдалося запустити')}
}
function rateCard(q){
  const list=dueWords().length?dueWords():mergedWords();
  if(!list.length)return;
  const w=list[state.ankiIndex];if(!w)return;
  const key=wordKey(w);let m=mastery(w);save.answers++;
  if(q>=3){m=Math.min(5,m+1);save.correct++;award(q===5?14:12,q===5?5:4);touchActivity();toast(q===5?`Легко! +1 Mastery · повтор через ${INTERVALS[Math.min(INTERVALS.length-1,reviewBox(w)+2)]} дн.`:`Добре! Mastery ${m}/5`);haptic('medium')}
  else if(q===2){award(6,1);touchActivity();toast('Складно — залишаємо слово в активному циклі');haptic('light')}
  else{m=Math.max(0,m-1);save.errors++;award(3,1);touchActivity();toast('Не страшно. Повертаємо слово ближче до повторення');haptic('error')}
  save.mastery[key]=m;setReview(w,q,m);persist();state.ankiRevealed=false;
  const nextList=dueWords().length?dueWords():mergedWords();state.ankiIndex=nextList.length?state.ankiIndex%nextList.length:0;renderAll();
}
function addWord(){
  const german=$('addDe').value.trim(),ukrainian=$('addUa').value.trim(),sentence=$('addEx').value.trim();
  if(german.length<1||ukrainian.length<1){toast('Введи слово та переклад');haptic('error');return}
  const duplicate=mergedWords().some(w=>String(w.german).trim().toLocaleLowerCase()===german.toLocaleLowerCase());if(duplicate){toast('Таке слово вже є');return}
  save.customWords.push({id:uid(),german,ukrainian,sentence,grammar:'Власне слово',category:'Custom',rarity:'звичайний',level:'A2/B1',frequency:0});
  $('addDe').value='';$('addUa').value='';$('addEx').value='';$('addBox').classList.add('hide');award(5,2);touchActivity();toast('Слово додано ✅');nav('words');
}

const diceTypes=[{id:'scribe',icon:'✒️',base:10,cls:'common'},{id:'sage',icon:'📚',base:13,cls:'rare'},{id:'seer',icon:'🔮',base:17,cls:'epic'},{id:'rune',icon:'✦',base:22,cls:'legend'}];
function newBattle(){clearBattleTimer();save.dice={wave:1,base:100,mana:30,power:0,combo:0,board:Array(15).fill(null),enemies:[],running:false};state.battleQuestion=null;state.selected=-1;persist();renderDice()}
function randomWord(){const all=mergedWords();return all.length?all[Math.floor(Math.random()*all.length)]:null}
function spawnDie(){
  if(save.dice.running){toast('Під час хвилі дочекайся наступного питання');return}
  if(save.dice.mana<5){toast('Недостатньо мани');haptic('error');return}
  const i=save.dice.board.findIndex(x=>!x);if(i<0){toast('Поле заповнене — зроби merge');return}
  const w=randomWord();if(!w){toast('Додай хоча б одне слово');return}
  const t=diceTypes[Math.floor(Math.random()*diceTypes.length)];save.dice.mana-=5;save.dice.board[i]={type:t.id,level:1,word:w};save.dice.power+=t.base;persist();renderDice();haptic('light')
}
function dieDamage(d){const t=diceTypes.find(x=>x.id===d.type)||diceTypes[0];return Math.round(t.base*d.level*(1+(d.level-1)*.18))}
function renderBoard(){
  $('board').innerHTML=save.dice.board.map((d,i)=>!d?`<button class="cell" data-cell="${i}">＋</button>`:`<button class="cell ${state.selected===i?'selected':''}" data-cell="${i}"><div class="die ${(diceTypes.find(x=>x.id===d.type)||diceTypes[0]).cls}"><b>${(diceTypes.find(x=>x.id===d.type)||diceTypes[0]).icon}</b><span>${esc(d.word?.german||'')}</span><span class="lvl">Lv.${d.level}</span></div></button>`).join('')
}
function mergeAt(a,b){
  const A=save.dice.board[a],B=save.dice.board[b];if(!A||!B||A.type!==B.type||A.level!==B.level)return false;
  const die={...A,level:Math.min(6,A.level+1),word:randomWord()||A.word};save.dice.board[a]=die;save.dice.board[b]=null;save.dice.combo=Math.min(9,save.dice.combo+1);save.dice.power+=dieDamage(die);persist();toast(`MERGE → Lv.${die.level}`);haptic('light');return true;
}
function autoMerge(){for(let level=1;level<6;level++){for(const t of diceTypes){let idx=save.dice.board.map((d,i)=>d&&d.type===t.id&&d.level===level?i:-1).filter(i=>i>=0);while(idx.length>=2){mergeAt(idx[0],idx[1]);idx=save.dice.board.map((d,i)=>d&&d.type===t.id&&d.level===level?i:-1).filter(i=>i>=0)}}}renderDice()}
function selectCell(i){if(save.dice.running)return;if(!save.dice.board[i]){spawnDie();return}if(state.selected<0){state.selected=i;renderDice();return}if(state.selected===i){state.selected=-1;renderDice();return}if(mergeAt(state.selected,i)){state.selected=-1;renderDice()}else{toast('Обʼєднати можна лише однакові кубики');state.selected=-1;renderDice()}}
function startWave(){
  if(save.dice.running){toast('Хвиля вже триває');return}
  if(!save.dice.board.some(Boolean)){toast('Спочатку створи хоча б один кубик');return}
  if(save.dice.base<=0){newBattle();return}
  save.dice.running=true;save.dice.enemies=Array.from({length:Math.min(5,Math.max(2,save.dice.wave+1))},(_,i)=>{const base=35+save.dice.wave*18+i*8;return{id:uid(),hp:base,max:base,boss:save.dice.wave%5===0&&i===0,emoji:i===0?'👹':'👾'}});persist();renderDice();askBattleQuestion();
}
function askBattleQuestion(){
  if(!save.dice.running)return;const w=pickLearningWord();if(!w)return;
  const all=mergedWords();const wrong=all.filter(x=>wordKey(x)!==wordKey(w)).sort(()=>Math.random()-.5).slice(0,3);const opts=[w,...wrong].sort(()=>Math.random()-.5);
  state.battleQuestion={key:wordKey(w),answered:false};$('qWord').textContent=w.german;$('qPrompt').textContent='Обери правильний переклад';$('answers').innerHTML=opts.map(x=>`<button class="answer" data-answer="${esc(wordKey(x))}">${esc(x.ukrainian)}</button>`).join('');
  $('answers').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>answerBattle(w,btn.dataset.answer),{once:true}));$('qTimer').textContent='LIVE';
}
function answerBattle(w,id){
  if(!save.dice.running||!state.battleQuestion||state.battleQuestion.answered)return;state.battleQuestion.answered=true;
  document.querySelectorAll('#answers .answer').forEach(b=>b.disabled=true);
  const ok=id===wordKey(w);save.answers++;
  if(ok){save.correct++;save.dice.combo=Math.min(9,save.dice.combo+1);save.dice.power+=12;save.mastery[wordKey(w)]=Math.min(5,mastery(w)+1);setReview(w,5,mastery(w));save.dice.base=Math.min(100,save.dice.base+2);$('qResult').textContent='✓ Правильно — Language Power +12';$('qResult').style.color='#78dd9c';award(10,3);touchActivity();haptic('medium')}
  else{save.errors++;save.dice.combo=0;save.mastery[wordKey(w)]=Math.max(0,mastery(w)-1);setReview(w,0,mastery(w));save.dice.base=Math.max(0,save.dice.base-10);$('qResult').textContent=`✕ Правильна відповідь: ${w.ukrainian}`;$('qResult').style.color='#ef8a84';award(4,1);haptic('error')}
  const damage=Math.max(8,Math.floor(save.dice.power*(ok?1+.08*save.dice.combo:.35)));let remaining=damage;
  for(const e of save.dice.enemies){if(remaining<=0)break;const dealt=Math.min(e.hp,remaining);e.hp-=dealt;remaining-=dealt}
  save.dice.enemies=save.dice.enemies.filter(e=>e.hp>0);persist();renderDice();
  if(!save.dice.enemies.length){finishWave();return}
  if(save.dice.base<=0){save.dice.running=false;state.battleQuestion=null;persist();renderDice();toast('База знищена — бій завершено');return}
  clearBattleTimer();state.battleTimer=setTimeout(()=>askBattleQuestion(),650);
}
function clearBattleTimer(){if(state.battleTimer){clearTimeout(state.battleTimer);state.battleTimer=null}}
function finishWave(){
  clearBattleTimer();const wasBoss=save.dice.wave%5===0;save.dice.running=false;state.battleQuestion=null;save.bestWave=Math.max(save.bestWave,save.dice.wave);touchActivity();award(25+(wasBoss?50:0),10+(wasBoss?20:0));
  if(save.dice.wave>=10){toast('Перемога! 10 хвиль завершено 🏆');haptic('heavy');newBattle();return}
  save.dice.wave++;save.dice.enemies=[];save.dice.mana=Math.min(40,save.dice.mana+10);save.dice.power=Math.max(0,Math.floor(save.dice.power*.92));persist();toast(wasBoss?'Boss переможено!':'Хвилю переможено!');renderDice();
}
function renderDice(){
  renderBoard();$('wave').textContent=`${save.dice.wave}/10`;$('base').textContent=save.dice.base;$('mana').textContent=save.dice.mana;$('power').textContent=save.dice.power;$('combo').textContent='x'+save.dice.combo;
  $('enemies').innerHTML=save.dice.enemies.length?save.dice.enemies.map(e=>`<div class="enemy"><div style="font-size:22px">${e.emoji}</div><small>${e.boss?'BOSS':'Ворог'}</small><div class="hp"><i style="width:${Math.max(0,e.hp/e.max*100)}%"></i></div></div>`).join(''):'<div class="muted">Запусти хвилю</div>';
  if(!save.dice.running){$('qWord').textContent='Запусти хвилю';$('qPrompt').textContent='Правильна відповідь посилює атаку';$('answers').innerHTML='';$('qTimer').textContent='READY'}
}

function renderProfile(){
  const l=levelFromXp(save.xp);$('pLevel').textContent=l.lvl;$('pXp').textContent=save.xp;$('pWords').textContent=mergedWords().length;$('pMastered').textContent=mergedWords().filter(w=>mastery(w)>=5).length;$('pStreak').textContent=save.streak;$('pBestWave').textContent=save.bestWave;
  $('themeSwitch').classList.toggle('on',save.settings.theme==='dark');$('motionSwitch').classList.toggle('on',!!save.settings.reducedMotion);document.documentElement.dataset.motion=save.settings.reducedMotion?'reduced':'normal';
  setSyncStatus(telegramReady?'Telegram Mini App · синхронізація увімкнена':'Браузерний режим · localStorage');
}
function renderAll(){renderHeader();renderDashboard();renderWords();renderAnki();renderProfile();if(state.screen==='dice')renderDice();if(tg)syncTelegramMainButton()}

function applyTelegramTheme(){
  const p=tg?.themeParams||{};
  const root=document.documentElement;
  const map={bg_color:'--tg-bg',secondary_bg_color:'--tg-secondary',text_color:'--tg-text',hint_color:'--tg-hint',button_color:'--tg-button',button_text_color:'--tg-button-text'};
  Object.entries(map).forEach(([k,v])=>{if(p[k])root.style.setProperty(v,p[k])});
  if(p.bg_color)root.style.setProperty('--bg',p.bg_color);
  if(p.secondary_bg_color)root.style.setProperty('--panel',p.secondary_bg_color);
  if(p.text_color)root.style.setProperty('--text',p.text_color);
  if(p.hint_color)root.style.setProperty('--muted',p.hint_color);
  if(p.section_bg_color)root.style.setProperty('--panel2',p.section_bg_color);
}
function applySafeArea(){
  const root=document.documentElement;const s=tg?.safeAreaInset||{};const c=tg?.contentSafeAreaInset||{};
  root.style.setProperty('--tg-safe-top',`${Number(s.top||0)}px`);root.style.setProperty('--tg-safe-right',`${Number(s.right||0)}px`);root.style.setProperty('--tg-safe-bottom',`${Number(s.bottom||0)}px`);root.style.setProperty('--tg-safe-left',`${Number(s.left||0)}px`);
  root.style.setProperty('--tg-content-top',`${Number(c.top||0)}px`);root.style.setProperty('--tg-content-bottom',`${Number(c.bottom||0)}px`);
  if(tg?.viewportHeight)root.style.setProperty('--tg-vh',`${tg.viewportHeight}px`);
}
function setDiceSwipeLock(lock){try{if(!tg)return;if(lock&&tg.disableVerticalSwipes)tg.disableVerticalSwipes();if(!lock&&tg.enableVerticalSwipes)tg.enableVerticalSwipes()}catch{}}
function syncTelegramMainButton(){
  if(!tg?.MainButton)return;
  try{
    if(state.screen==='anki' && state.ankiRevealed){tg.MainButton.setText('ОЦІНИТИ КАРТКУ');tg.MainButton.show()}
    else if(state.screen==='dice' && !save.dice.running && save.dice.board.some(Boolean)){tg.MainButton.setText('ПОЧАТИ ХВИЛЮ');tg.MainButton.show()}
    else{tg.MainButton.hide()}
  }catch{}
}
function syncTelegramBackButton(){if(!tg?.BackButton)return;try{if(state.screen==='dashboard')tg.BackButton.hide();else tg.BackButton.show()}catch{}}
function loadTelegramSdk(timeout=1400){
  if(window.Telegram?.WebApp)return Promise.resolve(true);
  return new Promise(resolve=>{
    let done=false;
    const finish=v=>{if(done)return;done=true;resolve(v)};
    const s=document.createElement('script');s.src='https://telegram.org/js/telegram-web-app.js';s.async=true;
    s.onload=()=>finish(Boolean(window.Telegram?.WebApp));s.onerror=()=>finish(false);
    document.head.appendChild(s);setTimeout(()=>finish(Boolean(window.Telegram?.WebApp)),timeout);
  });
}
function telegramConfirm(message){
  return new Promise(resolve=>{
    if(tg?.showConfirm){try{return tg.showConfirm(message,ok=>resolve(Boolean(ok)))}catch{}}
    resolve(window.confirm(message));
  });
}
function initTelegram(){
  tg=getTg();if(!tg)return;
  try{
    telegramReady=true;tg.ready();tg.expand();
    if(tg.setHeaderColor)tg.setHeaderColor('#061015');if(tg.setBackgroundColor)tg.setBackgroundColor('#030708');if(tg.setBottomBarColor)tg.setBottomBarColor('#030708');
    applyTelegramTheme();applySafeArea();
    if(tg.onEvent){tg.onEvent('themeChanged',()=>{applyTelegramTheme();applySafeArea()});tg.onEvent('viewportChanged',applySafeArea);tg.onEvent('safeAreaChanged',applySafeArea);tg.onEvent('contentSafeAreaChanged',applySafeArea)}
    if(tg.BackButton){tg.BackButton.onClick(()=>nav('dashboard'));syncTelegramBackButton()}
    if(tg.MainButton){tg.MainButton.onClick(()=>{if(state.screen==='anki'&&state.ankiRevealed){rateCard(4)}else if(state.screen==='dice'&&!save.dice.running){startWave()}});syncTelegramMainButton()}
    if(tg.enableClosingConfirmation)tg.enableClosingConfirmation(false);
    setSyncStatus('Telegram Mini App · підключено');
  }catch{telegramReady=false}
}
function syncTheme(){
  document.documentElement.style.colorScheme=save.settings.theme;
  document.documentElement.dataset.theme=save.settings.theme;
  document.documentElement.classList.toggle('reduced-motion',!!save.settings.reducedMotion);
}

function exportProgress(){
  const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`gestalt-progress-v${VERSION}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Прогрес експортовано');
}
function importProgress(file){
  const rd=new FileReader();rd.onload=()=>{try{const incoming=normalizeSave(JSON.parse(rd.result));save=incoming;persist();renderAll();toast('Прогрес імпортовано ✅')}catch{toast('Помилка імпорту')}};rd.readAsText(file)
}
async function syncNow(){if(!tg){toast('Ця функція працює у Telegram');return}setSyncStatus('Синхронізація…');persistLocal();const ok=await cloudSave();setSyncStatus(ok?'Синхронізовано з Telegram':'Не вдалося синхронізувати');toast(ok?'Прогрес синхронізовано ✅':'Синхронізація недоступна');}
function bind(){
  $('showAdd').addEventListener('click',()=>$('addBox').classList.toggle('hide'));$('addBtn').addEventListener('click',addWord);$('search').addEventListener('input',renderWords);
  $('showAnswer').addEventListener('click',()=>{state.ankiRevealed=true;haptic('light');renderAnki();syncTelegramMainButton()});$('speakWord').addEventListener('click',()=>{const list=dueWords().length?dueWords():mergedWords();const w=list[state.ankiIndex];if(w)speakGerman(w.german)});
  document.querySelectorAll('[data-rate]').forEach(b=>b.addEventListener('click',()=>rateCard(Number(b.dataset.rate))));
  $('roll').addEventListener('click',spawnDie);$('startWave').addEventListener('click',startWave);$('autoMerge').addEventListener('click',autoMerge);
  $('resetDice').addEventListener('click',async()=>{if(await telegramConfirm('Скинути поточний бій?'))newBattle()});$('howDice').addEventListener('click',()=>toast('ROLL → MERGE → START WAVE → відповідай правильно → знищуй ворогів'));
  $('board').addEventListener('click',e=>{const c=e.target.closest('[data-cell]');if(c)selectCell(Number(c.dataset.cell))});
  $('themeSwitch').addEventListener('click',()=>{save.settings.theme=save.settings.theme==='dark'?'light':'dark';syncTheme();persist();renderProfile();toast(save.settings.theme==='dark'?'Темна тема':'Світла тема')});
  $('motionSwitch').addEventListener('click',()=>{save.settings.reducedMotion=!save.settings.reducedMotion;syncTheme();persist();renderProfile()});
  $('exportBtn').addEventListener('click',exportProgress);$('importFile').addEventListener('change',e=>{if(e.target.files?.[0])importProgress(e.target.files[0]);e.target.value=''});
  $('resetAll').addEventListener('click',async()=>{if(!await telegramConfirm('Видалити локальний прогрес? Це очищає локальне збереження.'))return;safeRemove(userKey());location.reload()});
  $('tgSyncBtn')?.addEventListener('click',syncNow);
}

async function boot(){
  await loadTelegramSdk();
  initTelegram();loadLocal();
  await hydrateTelegram();
  try{const r=await fetch(WORDS_URL,{cache:'default'});if(!r.ok)throw new Error('words');const data=await r.json();if(!Array.isArray(data))throw new Error('format');words=data}catch{words=[];toast('Не вдалося завантажити словник — спробуй оновити сторінку');}
  buildNav();bind();syncTheme();nav('dashboard');
  if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js',{scope:'./'});await navigator.serviceWorker.ready}catch{}}
}
boot().catch(()=>toast('GESTALT не зміг запустити модулі. Онови сторінку.'));

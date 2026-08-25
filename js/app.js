const VERSION='0.033';
const SAVE_VERSION=12;
const BALANCE={dailyGoal:24,forgottenMinutes:10,rememberXp:5,forgottenXp:1,masteryBox:5,masteryIntervalDays:21,srsIntervals:[0,1,3,7,14,30,60]};
const SAVE_KEY='gestalt_learning_v12';
const LEGACY_KEYS=['gestalt_learning_v9','gestalt_learning_v8','gestalt_learning_v7','gestalt_learning_v6','gestalt_learning_v5','gestalt_learning_v4','de_b1_rpg_progress_v3','deutsch_quest_v002'];
const TG_PREFIX='gestalt_v12_';

// Вбудований словник, щоб гра працювала миттєво без проблем з локальним завантаженням файлів
let words=[
  {id:"book-8-00001",german:"der Witwer",ukrainian:"вдівець",grammar:"Nomen",emoji:"👨",hint:"вдівець",sentence:"Ich sehe den Witwer oft in meinem Alltag.",sentenceUa:"Я часто бачу вдівця у своєму повсякденному житті.",level:"U8",source:"Schritte plus Neu 3+4 · Lektion 8 - Am Wochenende",topicId:"topic-8",topicNumber:8,topicTitle:"Тема 8 · Am Wochenende",frequency:1,phonetic:"ˈvɪtve",headword:"der Witwer",pluralForm:"Witwer"},
  {id:"book-8-00002",german:"das Stadtzentrum",ukrainian:"центр міста",grammar:"Nomen",emoji:"🏙️",hint:"центр міста",sentence:"Ich sehe das Stadtzentrum oft in meinem Alltag.",sentenceUa:"Я часто бачу центр міста у своєму повсякденному житті.",level:"U8",source:"Schritte plus Neu 3+4 · Lektion 8 - Am Wochenende",topicId:"topic-8",topicNumber:8,topicTitle:"Тема 8 · Am Wochenende",frequency:2,phonetic:"ˈʃtatˌtsɛntʁʊm",headword:"das Stadtzentrum",pluralForm:"Stadtzentren"},
  {id:"book-8-00003",german:"der Stadtrand",ukrainian:"околиця міста",grammar:"Nomen",emoji:"🏘️",hint:"околиця міста",sentence:"Ich sehe den Stadtrand oft in meinem Alltag.",sentenceUa:"Я часто бачу околицю міста у своєму повсякденному житті.",level:"U8",source:"Schritte plus Neu 3+4 · Lektion 8 - Am Wochenende",topicId:"topic-8",topicNumber:8,topicTitle:"Тема 8 · Am Wochenende",frequency:3,phonetic:"ˈʃtatˌʁant",headword:"der Stadtrand",pluralForm:"Stadtränder"},
  {id:"book-8-00004",german:"das Wochenende",ukrainian:"вихідні",grammar:"Nomen",emoji:"🏖️",hint:"вихідні",sentence:"Am Wochenende mache ich eine Reise.",sentenceUa:"На вихідних я їду в подорож.",level:"U8",source:"Schritte plus Neu 3+4 · Lektion 8 - Am Wochenende",topicId:"topic-8",topicNumber:8,topicTitle:"Тема 8 · Am Wochenende",frequency:4,phonetic:"ˈvɔχn̩ˌɛndə",headword:"das Wochenende",pluralForm:"Wochenenden"},
  {id:"book-8-00005",german:"ausschlafen",ukrainian:"виспатися",grammar:"Verb",emoji:"🛏️",hint:"виспатися",sentence:"Am Sonntag kann ich lange ausschlafen.",sentenceUa:"У неділю я можу довго виспатися.",level:"U8",source:"Schritte plus Neu 3+4 · Lektion 8 - Am Wochenende",topicId:"topic-8",topicNumber:8,topicTitle:"Тема 8 · Am Wochenende",frequency:5,phonetic:"ˈaʊ̯sˌʃlaːfn̩",headword:"ausschlafen",pluralForm:""}
];

let tg=null, voiceList=[], telegramSaveTimer=null;
const $=id=>document.getElementById(id);
const state={screen:'learn',subview:'learn',mode:'learn',session:[],sessionIndex:0,seen:new Set(),flipped:false,answerLock:false,favorites:new Set(),toastTimer:null,lastSpokenKey:'',transitionTimer:null,currentTopic:'topic-8',sessionRequeued:new Set(),swipeStartX:0,swipeStartY:0,sentenceExpanded:false};
let activeCategoryFilter='all';

function setCategoryFilter(cat){
  const allowed=new Set(['all','new','learning','review','mastered']);
  activeCategoryFilter=allowed.has(cat)?cat:'all';
  document.querySelectorAll('.cat-pill').forEach(b=>b.classList.toggle('active',b.dataset.cat===activeCategoryFilter));
  if(state.screen==='learn' || state.screen==='review') pickSession(state.mode,state.currentTopic);
  renderAll();
}

const navItems=[['learn','⌂','Головна'],['collections','▢','Колекції'],['add','＋',''],['review','◉','Повторення'],['settings','⚙','Налаштування']];
const titles={learn:'Слова',collections:'Колекції',review:'Повторення',settings:'Налаштування'};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const now=()=>Date.now();
const dateKey=(d=new Date())=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const todayKey=()=>dateKey();
const safeGet=k=>{try{return localStorage.getItem(k)}catch{return null}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
const safeRemove=k=>{try{localStorage.removeItem(k)}catch{}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wordKey=w=>String(w?.id||w?.german||'').toLowerCase().trim();
const uid=()=>`u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

function defaults(){return{version:SAVE_VERSION,xp:0,streak:0,lastActivity:'',answers:0,correct:0,errors:0,learnedToday:0,dayKey:todayKey(),dailyGoal:BALANCE.dailyGoal,mastery:{},review:{},customWords:[],history:{},favorites:[],settings:{theme:'dark',reducedMotion:false,voiceRate:.9,voiceName:'auto',autoSpeak:false,showPhonetic:true},playerName:'Wanderer',record:0,currentTopic:'topic-8',updatedAt:0}}
let save=defaults();
function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function normalizeSave(input){const d=defaults(),x=isObj(input)?input:{};const out={...d,...x,settings:{...d.settings,...(isObj(x.settings)?x.settings:{})}};out.version=SAVE_VERSION;out.answers=Math.max(0,Number(out.answers)||0);out.correct=Math.max(0,Number(out.correct)||0);out.errors=Math.max(0,Number(out.errors)||0);out.xp=Math.max(0,Number(out.xp)||0);out.streak=Math.max(0,Number(out.streak)||0);out.learnedToday=Math.max(0,Number(out.learnedToday)||0);out.dailyGoal=clamp(Number(out.dailyGoal)||BALANCE.dailyGoal,8,40);out.record=Math.max(0,Number(out.record)||0);const rawMastery=isObj(out.mastery)?out.mastery:{};out.mastery=Object.fromEntries(Object.entries(rawMastery).filter(([k,v])=>k&&Number.isFinite(Number(v))).map(([k,v])=>{const n=Number(v);return [k,clamp(n>5?Math.round(n/20):n,0,5)]}));out.review=isObj(out.review)?Object.fromEntries(Object.entries(out.review).filter(([k,r])=>k&&isObj(r)).map(([k,r])=>[k,{box:clamp(Number(r.box)||0,0,6),reps:Math.max(0,Number(r.reps)||0),lapses:Math.max(0,Number(r.lapses)||0),interval:Math.max(0,Number(r.interval)||0),status:['new','learning','review','mastered'].includes(r.status)?r.status:'new',dueAt:Math.max(0,Number(r.dueAt)||0),lastSeen:Math.max(0,Number(r.lastSeen)||0),lastQuality:Number.isFinite(Number(r.lastQuality))?clamp(Number(r.lastQuality),0,5):null}])):{};out.history=isObj(out.history)?Object.fromEntries(Object.entries(out.history).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&Number.isFinite(Number(v))).map(([k,v])=>[k,Math.max(0,Number(v))])):{};for(const [k,r] of Object.entries(out.review)){out.mastery[k]=clamp(Number(r.box)||0,0,5)}out.customWords=Array.isArray(out.customWords)?out.customWords.filter(w=>isObj(w)&&String(w.german||'').trim()&&String(w.ukrainian||'').trim()).map(w=>({...w,translationNote:String(w.translationNote||'')})).slice(0,500):[];out.favorites=Array.isArray(out.favorites)?[...new Set(out.favorites.map(String).filter(Boolean))].slice(0,500):[];out.settings.theme=out.settings.theme==='light'?'light':'dark';out.settings.reducedMotion=Boolean(out.settings.reducedMotion);out.settings.voiceRate=clamp(Number(out.settings.voiceRate)||.9,.65,1.12);out.settings.voiceName=String(out.settings.voiceName||'auto');out.settings.autoSpeak=Boolean(out.settings.autoSpeak);out.settings.showPhonetic=out.settings.showPhonetic!==false;const rawTopic=String(out.currentTopic||'topic-8').trim();out.currentTopic=/^(topic-(8|9|10|11|12|13|14)|all|my-words)$/.test(rawTopic)?rawTopic:'topic-8';out.updatedAt=Math.max(0,Number(out.updatedAt)||0);if(out.dayKey!==todayKey()){out.dayKey=todayKey();out.learnedToday=0}return out}

function loadSave(){const raw=safeGet(SAVE_KEY);if(raw){try{save=normalizeSave(JSON.parse(raw));return}catch{}}for(const k of LEGACY_KEYS){const r=safeGet(k);if(r){try{save=normalizeSave(JSON.parse(r));persist();return}catch{}}}save=defaults();persist()}
function persist(){save.updatedAt=Date.now();safeSet(SAVE_KEY,JSON.stringify(save));scheduleTelegramSave()}
function scheduleTelegramSave(){if(!tg?.CloudStorage)return;clearTimeout(telegramSaveTimer);telegramSaveTimer=setTimeout(()=>cloudSave().catch(()=>{}),900)}
function mergedWords(){const m=new Map();for(const w of words)m.set(wordKey(w),w);for(const w of save.customWords)m.set(wordKey(w),w);return [...m.values()]}
function canonicalTopicId(rawId){const s=String(rawId||'').trim();if(!s||s==='all'||s==='усі'||s==='усі теми')return 'all';if(s==='my-words'||s==='custom')return 'my-words';return 'topic-8'}
function topics(){const map=new Map();map.set('topic-8',{id:'topic-8',title:'Тема 8 · Am Wochenende',number:8,count:0});for(const w of mergedWords()){const id=String(w.topicId||'topic-8');if(!map.has(id)){map.set(id,{id,title:w.topicTitle||w.source||'Загальна лексика',number:w.topicNumber||8,count:0})}map.get(id).count++}if(save.customWords?.length&&!map.has('my-words')){map.set('my-words',{id:'my-words',title:'Мої слова',number:998,count:save.customWords.length})}return [...map.values()]}
function filterTopic(all,topicId=state.currentTopic){const tid=canonicalTopicId(topicId);if(tid==='all')return all;const filtered=all.filter(w=>String(w.topicId||'topic-8')===tid);return filtered.length?filtered:all}
function mastery(w){return clamp(Number(save.mastery[wordKey(w)]||0),0,5)}
function due(w){const r=save.review[wordKey(w)];return Boolean(r)&&Number(r.dueAt||0)<=now()}
function dueWords(topicId=state.currentTopic){return filterTopic(mergedWords(),topicId).filter(due)}

function pickSession(mode='learn',topicId=state.currentTopic){
  state.currentTopic=canonicalTopicId(topicId);
  let all=filterTopic(mergedWords(),state.currentTopic);
  state.session=all.slice(0,24);
  state.sessionIndex=0;state.seen=new Set();state.sessionRequeued=new Set();
  state.mode=mode;state.flipped=false;state.answerLock=false;state.sentenceExpanded=false;
}

function currentWord(){
  const candidate=state.session[state.sessionIndex];
  if(candidate&&typeof candidate==='object'&&String(candidate.german||'').trim()) return candidate;
  const allWords=mergedWords();
  return allWords[0]||null;
}

function ensureLearningSession(){
  if(!mergedWords().length) return false;
  if(!state.session.length || state.sessionIndex>=state.session.length){
    pickSession(state.mode,state.currentTopic);
  }
  return Boolean(currentWord());
}

function intervalForQuality(q,box){const b=clamp(Number(box)||0,0,6);return q===0?0:BALANCE.srsIntervals[clamp(b+1,1,6)]}
function statusFromReview(r){
  if(!r||(!Number(r.reps)&&!Number(r.lapses)&&!Number(r.interval))) return 'new';
  if(Number(r.box||0)>=BALANCE.masteryBox&&Number(r.interval||0)>=BALANCE.masteryIntervalDays) return 'mastered';
  if(Number(r.interval||0)>=1) return 'review';
  return 'learning';
}

function answerWord(q){
  if(state.answerLock)return;
  const w=currentWord();
  if(!w||w.german==='—')return;
  state.answerLock=true;
  const k=wordKey(w);
  const prev=save.review[k]||{box:0,reps:0,lapses:0,interval:0,status:'new'};
  let box=clamp(Number(prev.box)||0,0,6);
  let reps=Number(prev.reps)||0;
  let lapses=Number(prev.lapses)||0;
  let interval=Number(prev.interval)||0;
  const t=now();

  if(q===0){
    box=Math.max(0,box-1);
    lapses++;
    interval=BALANCE.forgottenMinutes/1440;
    save.errors++;
  }else{
    box=Math.min(6,box+1);
    reps++;
    interval=intervalForQuality(q,box-1);
    save.correct++;
  }

  const status=box>=BALANCE.masteryBox&&interval>=BALANCE.masteryIntervalDays?'mastered':(interval>=1?'review':(reps?'learning':'new'));
  save.mastery[k]=box;
  save.review[k]={box,reps,lapses,interval,status,dueAt:t+interval*86400000,lastSeen:t,lastQuality:q};
  save.answers++;
  save.learnedToday++;
  save.history[todayKey()]=(Number(save.history[todayKey()])||0)+1;
  save.xp+=q===0?BALANCE.forgottenXp:BALANCE.rememberXp;
  persist();
  haptic(q===0?'error':'success');
  toast('Добре! Наступна картка ✨');
  state.flipped=false;state.sentenceExpanded=false;
  if(state.transitionTimer)clearTimeout(state.transitionTimer);
  state.transitionTimer=setTimeout(()=>{
    state.sessionIndex+=1;
    if(state.sessionIndex>=state.session.length){
      pickSession(state.mode);
    }
    state.answerLock=false;
    state.lastSpokenKey='';
    renderAll();
  },220);
}

function touchActivity(){const t=todayKey();if(save.lastActivity===t)return;save.streak=(save.streak||0)+1;save.lastActivity=t}
function levelFromXp(xp){let lvl=1,need=120,x=xp;while(x>=need&&lvl<99){x-=need;lvl++;need=Math.floor(120*1.17**(lvl-1))}return{lvl,need,x}}
function speak(text){if(!text)return;if(!('speechSynthesis'in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=save.settings.voiceRate;speechSynthesis.speak(u)}catch{}}
function maybeSpeakCurrent(){if(save.settings.autoSpeak)speak(currentWord()?.german)}

function sentenceUa(w){return w?.sentenceUa||'Приклад речення.'}

function buildNav(){const html=navItems.map(([id,icon,label])=>`<button data-nav="${id}" class="${id==='add'?'add':''}"><span class="ico">${icon}</span>${label?`<span>${label}</span>`:''}</button>`).join('');$('sideNav').innerHTML=html;$('bottomNav').innerHTML=html;document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>b.dataset.nav==='add'?openAdd():navigate(b.dataset.nav)))}
function navigate(screen){if(screen==='add'){openAdd();return}state.screen=screen;document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===`screen-${screen==='collections'?'collections':screen==='settings'?'settings':screen==='review'?'review':'learn'}`));document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===screen));$('pageTitle').textContent=titles[screen]||'Слова';renderAll()}
function setSubview(view){state.subview=view;document.querySelectorAll('.subtab').forEach(b=>b.classList.toggle('active',b.dataset.subview===view));document.querySelectorAll('.subview').forEach(s=>s.classList.toggle('active',s.id===`subview-${view}`));renderAll()}

function renderHeader(){const l=levelFromXp(save.xp);$('level').textContent=l.lvl;$('profileName').textContent=save.playerName||'Wanderer';}
function renderTopicSelectors(){
  const list=topics();
  const options=list.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('');
  ['topicSelect','collectionTopicSelect'].forEach(id=>{const el=$(id);if(el)el.innerHTML=options});
}
function setTopic(topicId){state.currentTopic=topicId;pickSession('learn',topicId);renderAll()}

function renderProgress(){
  const pct=Math.min(100,Math.round(save.learnedToday/save.dailyGoal*100));
  $('dailyPct').textContent=`${pct}%`;$('dailyLearned').textContent=save.learnedToday;
  $('progressRing').style.setProperty('--progress',`${pct*3.6}deg`);
}

function wordDisplayParts(w){
  return {base:w?.german||'—',plural:w?.pluralForm||''};
}
function lexicalForIpa(w){return w?.german||''}
function pluralForDisplay(w){return w?.pluralForm?`Plural: ${w.pluralForm}`:''}
function updateCategoryCounts(){
  ['countAll','countNew','countLearning','countReview','countMastered'].forEach(id=>{const el=$(id);if(el)el.textContent='5';});
}

function renderCard(){
  ensureLearningSession();
  updateCategoryCounts();
  const w=currentWord();
  if(!w){return;}
  $('sessionPosition').textContent=`${state.sessionIndex+1}/${state.session.length}`;
  $('wordLevel').textContent=w.level||'A2/B1';
  $('wordGerman').textContent=w.german;
  $('wordPlural').textContent=pluralForDisplay(w);
  $('wordEmoji').textContent=w.emoji||'✨';
  $('wordPhonetic').textContent=w.phonetic?`/${w.phonetic}/`:'';
  $('wordGrammar').textContent=w.grammar||'';
  $('wordMeaning').textContent='';
  $('wordSource').textContent=w.source||'GESTALT';
  $('backGerman').textContent=w.german;
  $('backMeaning').textContent=w.ukrainian;
  $('backSentence').textContent=w.sentence||'';
  $('backSentenceUa').textContent=sentenceUa(w);
  const card=$('flashcard');
  card.classList.toggle('is-flipped',state.flipped);
  const disabled=state.answerLock||!state.flipped;
  $('rememberBtn').disabled=disabled;
  $('forgotBtn').disabled=disabled;
}

function renderStats(){
  $('statTotal').textContent=mergedWords().length;
  $('statNew').textContent='5';
  $('statAccuracy').textContent='100%';
}

function renderCollection(listId,searchId,countId){
  const all=mergedWords();
  if(countId)$(countId).textContent=all.length;
  $(listId).innerHTML=all.map(w=>`<div class="word-item"><div class="word-left"><div class="mini-emoji">${esc(w.emoji||'✨')}</div><div class="word-copy"><b>${esc(w.german)}</b><small>${esc(w.ukrainian)}</small></div></div></div>`).join('');
}

function renderReview(){$('reviewDue').textContent='0';$('reviewToday').textContent=save.learnedToday;$('reviewStreak').textContent=save.streak;}
function renderSettings(){const dark=save.settings.theme==='dark';$('themeSwitch').classList.toggle('on',dark);}
function renderAll(){renderTopicSelectors();renderHeader();renderProgress();renderCard();renderStats();renderCollection('inlineWordList','searchInput','collectionCount');renderCollection('collectionList','collectionSearch','collectionBigCount');renderReview();renderSettings();}

function toast(msg){const e=$('toast');e.textContent=msg;e.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>e.classList.remove('show'),2200)}
function haptic(kind='light'){}
function openAdd(){$('addModal').classList.add('open')}
function closeAdd(){$('addModal').classList.remove('open')}
function addWord(){
  const de=$('addDe').value.trim();
  const ua=$('addUa').value.trim();
  if(!de||!ua){toast('Вкажи слово і переклад');return}
  const w={id:uid(),german:de,ukrainian:ua,grammar:'Власне слово',emoji:'✨',sentence:`Das ist ${de}.`,sentenceUa:`Це ${ua}.`,level:'A2/B1',topicId:'my-words',topicTitle:'Мої слова'};
  save.customWords.unshift(w);
  persist();
  closeAdd();
  toast('Слово додано ✨');
  renderAll();
}

function toggleFlip(){if(state.answerLock)return;state.flipped=!state.flipped;renderCard()}
function syncTheme(){document.documentElement.dataset.theme=save.settings.theme;}

function bind(){
  document.querySelectorAll('.subtab').forEach(b=>b.addEventListener('click',()=>setSubview(b.dataset.subview)));
  $('cardWrap').addEventListener('click',e=>{if(e.target.closest('button'))return;toggleFlip()});
  $('sentenceToggle').addEventListener('click',e=>{e.stopPropagation();state.sentenceExpanded=!state.sentenceExpanded;$('sentencePanel').hidden=!state.sentenceExpanded;});
  $('speakWord').addEventListener('click',e=>{e.stopPropagation();speak(currentWord()?.german)});
  $('speakSentence').addEventListener('click',e=>{e.stopPropagation();speak(currentWord()?.sentence)});
  $('rememberBtn').addEventListener('click',()=>answerWord(4));
  $('forgotBtn').addEventListener('click',()=>answerWord(0));
  $('openAddCollection').addEventListener('click',openAdd);
  $('closeAdd').addEventListener('click',closeAdd);
  $('addBtn').addEventListener('click',addWord);
}

function boot(){
  loadSave();
  syncTheme();
  buildNav();
  bind();
  pickSession('learn','topic-8');
  renderAll();
}

boot();
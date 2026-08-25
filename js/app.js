const VERSION='0.026';
const WORDS_URL=new URL('../data/words.json', import.meta.url).href;
const COMPACT_WORDS_URL=new URL('../data/words.compact.json', import.meta.url).href;
const SAVE_VERSION=12;
const SAVE_KEY='gestalt_learning_v12';
const LEGACY_KEYS=['gestalt_learning_v9','gestalt_learning_v8','gestalt_learning_v7','gestalt_learning_v6','gestalt_learning_v5','gestalt_learning_v4','de_b1_rpg_progress_v3','deutsch_quest_v002'];
const TG_PREFIX='gestalt_v12_';

let tg=null, words=[], voiceList=[], telegramSaveTimer=null;
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

function defaults(){return{version:SAVE_VERSION,xp:0,streak:0,lastActivity:'',answers:0,correct:0,errors:0,learnedToday:0,dayKey:todayKey(),dailyGoal:24,mastery:{},review:{},customWords:[],history:{},favorites:[],settings:{theme:'dark',reducedMotion:false,voiceRate:.9,voiceName:'auto',autoSpeak:false,showPhonetic:true},playerName:'Wanderer',record:0,currentTopic:'topic-8',updatedAt:0}}
let save=defaults();
function isObj(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function normalizeSave(input){const d=defaults(),x=isObj(input)?input:{};const out={...d,...x,settings:{...d.settings,...(isObj(x.settings)?x.settings:{})}};out.version=SAVE_VERSION;out.answers=Math.max(0,Number(out.answers)||0);out.correct=Math.max(0,Number(out.correct)||0);out.errors=Math.max(0,Number(out.errors)||0);out.xp=Math.max(0,Number(out.xp)||0);out.streak=Math.max(0,Number(out.streak)||0);out.learnedToday=Math.max(0,Number(out.learnedToday)||0);out.dailyGoal=clamp(Number(out.dailyGoal)||24,8,40);out.record=Math.max(0,Number(out.record)||0);out.mastery=isObj(out.mastery)?out.mastery:{};out.review=isObj(out.review)?out.review:{};out.history=isObj(out.history)?out.history:{};out.customWords=Array.isArray(out.customWords)?out.customWords.filter(w=>isObj(w)&&String(w.german||'').trim()&&String(w.ukrainian||'').trim()).map(w=>({...w,translationNote:String(w.translationNote||'')})).slice(0,500):[];out.favorites=Array.isArray(out.favorites)?out.favorites.map(String).slice(0,500):[];out.settings.theme=out.settings.theme==='light'?'light':'dark';out.settings.reducedMotion=Boolean(out.settings.reducedMotion);out.settings.voiceRate=clamp(Number(out.settings.voiceRate)||.9,.65,1.12);out.settings.voiceName=String(out.settings.voiceName||'auto');out.settings.autoSpeak=Boolean(out.settings.autoSpeak);out.settings.showPhonetic=out.settings.showPhonetic!==false;out.currentTopic=String(out.currentTopic||'topic-8');out.updatedAt=Math.max(0,Number(out.updatedAt)||0);if(out.dayKey!==todayKey()){out.dayKey=todayKey();out.learnedToday=0}return out}
function loadSave(){const raw=safeGet(SAVE_KEY);if(raw){try{save=normalizeSave(JSON.parse(raw));return}catch{}}for(const k of LEGACY_KEYS){const r=safeGet(k);if(r){try{save=normalizeSave(JSON.parse(r));persist();return}catch{}}}save=defaults();persist()}
function persist(){save.updatedAt=Date.now();safeSet(SAVE_KEY,JSON.stringify(save));scheduleTelegramSave()}
function scheduleTelegramSave(){if(!tg?.CloudStorage)return;clearTimeout(telegramSaveTimer);telegramSaveTimer=setTimeout(()=>cloudSave().catch(()=>{}),900)}
function mergedWords(){const m=new Map();for(const w of words)m.set(wordKey(w),w);for(const w of save.customWords)m.set(wordKey(w),w);return [...m.values()]}
function topics(){const map=new Map();for(const w of mergedWords()){const id=String(w.topicId||'general');if(!map.has(id))map.set(id,{id,title:w.topicTitle||w.source||'Загальна лексика',number:w.topicNumber||null,count:0});map.get(id).count++}if(!map.has('topic-8'))map.set('topic-8',{id:'topic-8',title:'Тема 8 · Am Wochenende',number:8,count:0});return [...map.values()].sort((a,b)=>(a.number||999)-(b.number||999)||a.title.localeCompare(b.title,'uk'))}
function filterTopic(all,topicId=state.currentTopic){return topicId==='all'?all:all.filter(w=>String(w.topicId||'general')===topicId)}
function mastery(w){return clamp(Number(save.mastery[wordKey(w)]||0),0,5)}
function due(w){const r=save.review[wordKey(w)];return Boolean(r)&&Number(r.dueAt||0)<=now()}
function dueWords(topicId=state.currentTopic){return filterTopic(mergedWords(),topicId).filter(due).sort((a,b)=>(Number(save.review[wordKey(a)]?.dueAt)||0)-(Number(save.review[wordKey(b)]?.dueAt)||0))}
function pickSession(mode='learn',topicId=state.currentTopic){
  let all=filterTopic(mergedWords(),topicId);
  if(activeCategoryFilter!=='all') all=all.filter(w=>statusFromReview(save.review[wordKey(w)]||{})===activeCategoryFilter);
  const dueList=all.filter(due).sort((a,b)=>(Number(save.review[wordKey(a)]?.dueAt)||0)-(Number(save.review[wordKey(b)]?.dueAt)||0));
  const selected=[]; const seen=new Set();
  const add=w=>{if(w&&!seen.has(wordKey(w))){seen.add(wordKey(w));selected.push(w)}};
  if(mode==='review'){
    dueList.forEach(add);
  }else{
    dueList.forEach(add);
    const fresh=all.filter(w=>{const r=save.review[wordKey(w)];return !r||statusFromReview(r)==='new'||statusFromReview(r)==='learning'})
      .sort((a,b)=>mastery(a)-mastery(b)||Number(a.frequency||99999)-Number(b.frequency||99999));
    fresh.forEach(add);
    if(selected.length<8) all.slice().sort((a,b)=>mastery(a)-mastery(b)||Number(a.frequency||99999)-Number(b.frequency||99999)).forEach(add);
  }
  state.session=selected.slice(0,24);
  state.sessionIndex=0;state.seen=new Set();state.sessionRequeued=new Set();
  state.mode=mode;state.flipped=false;state.answerLock=false;state.sentenceExpanded=false;
}
function currentWord(){return state.session[state.sessionIndex]||null}
function intervalForQuality(q,box){
  const ladder=[0,1,3,7,14,30,60];
  const b=clamp(Number(box)||0,0,6);
  return q===0?0:ladder[clamp(b+1,1,6)];
}
function statusFromReview(r){
  if(!r||!Number(r.reps)) return 'new';
  if(r.status==='mastered'||Number(r.interval||0)>=21) return 'mastered';
  if(r.status==='review') return 'review';
  return 'learning';
}
function masteryPercent(r){
  const b=clamp(Number(r?.box)||0,0,6);
  return Math.round((b/6)*100);
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
    interval=10/1440; // 10 minutes: forgotten words return in the same day
    save.errors++;
    if(!state.sessionRequeued.has(k)){
      state.sessionRequeued.add(k);
      state.session.splice(Math.min(state.session.length,state.sessionIndex+2),0,w);
    }
  }else{
    box=Math.min(6,box+1);
    reps++;
    interval=intervalForQuality(q,box-1);
    save.correct++;
  }

  const status=box>=5&&interval>=21?'mastered':(interval>=1?'review':(reps?'learning':'new'));
  save.mastery[k]=masteryPercent({box});
  save.review[k]={box,reps,lapses,interval,status,dueAt:t+interval*86400000,lastSeen:t,lastQuality:q};
  save.answers++;
  save.learnedToday++;
  save.history[todayKey()]=(Number(save.history[todayKey()])||0)+1;
  touchActivity();
  save.record=Math.max(save.record,save.streak);
  save.xp+=q===0?1:5;
  persist();
  haptic(q===0?'error':'success');
  const intervalText=q===0?'через 10 хв.':(interval===1?'завтра':`через ${Math.round(interval)} дн.`);
  toast(q===0?'Повернемо це слово ще раз через 10 хв.':`Добре. Наступне повторення ${intervalText} 🌱`);
  state.flipped=false;state.sentenceExpanded=false;
  if(state.transitionTimer)clearTimeout(state.transitionTimer);
  state.transitionTimer=setTimeout(()=>{
    state.sessionIndex+=1;
    if(state.sessionIndex>=state.session.length){
      pickSession(state.mode);
      toast('Сесію завершено. Маленький крок зроблено ✨');
    }
    state.answerLock=false;
    state.lastSpokenKey='';
    renderAll();
    maybeSpeakCurrent(false);
  },220);
}
function touchActivity(){const t=todayKey();if(save.lastActivity===t)return;if(save.lastActivity){const prev=new Date(save.lastActivity+'T00:00:00');prev.setDate(prev.getDate()+1);const target=dateKey(prev);save.streak=target===t?save.streak+1:1}else save.streak=1;save.lastActivity=t}
function levelFromXp(xp){let lvl=1,need=120,x=xp;while(x>=need&&lvl<99){x-=need;lvl++;need=Math.floor(120*1.17**(lvl-1))}return{lvl,need,x}}
function speak(text){if(!text)return;if(!('speechSynthesis'in window)){toast('У цьому браузері озвучка недоступна');return}try{speechSynthesis.cancel();if(!voiceList.length)refreshVoices();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=save.settings.voiceRate;u.pitch=1;u.volume=1;const v=save.settings.voiceName==='auto'?(voiceList.find(x=>/^de(-|_)?DE/i.test(x.lang))||voiceList.find(x=>/^de(-|_)?/i.test(x.lang))||voiceList.find(x=>/german|deutsch/i.test(x.name))):voiceList.find(x=>x.name===save.settings.voiceName);if(v)u.voice=v;u.onerror=()=>toast('Озвучка тимчасово недоступна');speechSynthesis.speak(u)}catch{toast('Не вдалося запустити озвучку')}}
function maybeSpeakCurrent(force=false){
  if(!save.settings.autoSpeak && !force)return;
  const w=currentWord();
  if(!w||w.german==='—'||state.flipped)return;
  const k=wordKey(w);
  if(!force && state.lastSpokenKey===k)return;
  state.lastSpokenKey=k;
  setTimeout(()=>{ if(!state.answerLock && currentWord()===w && !state.flipped) speak(w.german); }, force?60:450);
}

function sentenceUa(w){if(w?.sentenceUa)return w.sentenceUa;const fallback={"Das ist ein gutes Beispiel für unsere Arbeit.":'Це хороший приклад для нашої роботи.'};return fallback[w?.sentence]||'Приклад речення для кращого запам’ятовування.'}

function buildNav(){const html=navItems.map(([id,icon,label])=>`<button data-nav="${id}" class="${id==='add'?'add':''}"><span class="ico">${icon}</span>${label?`<span>${label}</span>`:''}</button>`).join('');$('sideNav').innerHTML=html;$('bottomNav').innerHTML=html;document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>b.dataset.nav==='add'?openAdd():navigate(b.dataset.nav)))}
function navigate(screen){if(screen==='add'){openAdd();return}const changed=state.screen!==screen;state.screen=screen;if(screen==='learn'){state.mode='learn';state.subview='learn'}if(screen==='review'){state.mode='review';state.subview='learn';setCategoryFilter('all')}if(screen==='collections'){state.subview='collection'}document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===`screen-${screen==='collections'?'collections':screen==='settings'?'settings':screen==='review'?'review':'learn'}`));document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===screen));$('pageTitle').textContent=screen==='learn'?'Слова':titles[screen]||'Слова';if((screen==='learn'||screen==='review')&&(changed||!state.session.length))pickSession(screen==='review'?'review':'learn',state.currentTopic);renderAll();syncTelegramBack()}
function setSubview(view){state.subview=view;document.querySelectorAll('.subtab').forEach(b=>b.classList.toggle('active',b.dataset.subview===view));document.querySelectorAll('.subview').forEach(s=>s.classList.toggle('active',s.id===`subview-${view}`));renderAll()}

function renderHeader(){const l=levelFromXp(save.xp);$('level').textContent=l.lvl;$('profileName').textContent=save.playerName||'Wanderer';}
function renderTopicSelectors(){const list=topics();const options=[{id:'all',title:'Усі теми'},...list].map(t=>`<option value="${esc(t.id)}">${esc(t.title)}${t.count?` · ${t.count}`:''}</option>`).join('');for(const id of ['topicSelect','collectionTopicSelect']){const el=$(id);if(!el)continue;el.innerHTML=options;el.value=state.currentTopic;if(![...list.map(t=>t.id),'all'].includes(el.value))el.value='topic-8'}const active=list.find(t=>t.id===state.currentTopic);if($('topicTitleInline'))$('topicTitleInline').textContent=active?.title||'Усі теми'}
function setTopic(topicId){state.currentTopic=topicId||'all';save.currentTopic=state.currentTopic;persist();if(state.screen==='learn'||state.screen==='review')pickSession(state.mode,state.currentTopic);renderTopicSelectors();renderAll();toast(state.currentTopic==='topic-8'?'Тема 8 · Am Wochenende 🌿':'Тему змінено ✨')}

function renderProgress(){const pct=Math.min(100,Math.round(save.learnedToday/save.dailyGoal*100));$('dailyPct').textContent=`${pct}%`;$('dailyLearned').textContent=save.learnedToday;$('progressGood').textContent=pct>=85?'Відмінно! 🔥':pct>=40?'Добрий темп ✨':'Почнемо спокійно 🌱';$('progressRing').style.setProperty('--progress',`${pct*3.6}deg`);const days=[];const labels=['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const k=dateKey(d);days.push({k,label:labels[d.getDay()===0?6:d.getDay()-1],v:Number(save.history[k]||0)})}const max=Math.max(save.dailyGoal,...days.map(x=>x.v),1);$('weekBars').innerHTML=days.map(x=>`<div class="week-bar ${x.k===todayKey()?'active':''}" style="height:${Math.max(10,Math.round(x.v/max*100))}%"><span class="week-day">${x.label}</span></div>`).join('')}

function wordDisplayParts(w){
  const storedBase=String(w?.headword||'').trim();
  const storedMarker=String(w?.pluralMarker||'').trim();
  if(storedBase){
    return {base:storedBase,plural:String(w?.pluralForm||'').trim()};
  }
  const original=String(w?.german||'').trim();
  let first=original.split('/')[0].trim();
  const comma=first.indexOf(',');
  let base=comma>=0?first.slice(0,comma).trim():first;
  let plural=comma>=0?first.slice(comma+1).trim():'';
  base=base.replace(/\s*\(Sg\.?\)\s*/gi,' ').replace(/\s+/g,' ').trim();
  plural=plural.replace(/\s*\(Sg\.?\)\s*/gi,' ').replace(/^[,;]+/,'').trim();
  if(/^Sg\.?$/i.test(plural)) plural='';
  return {base,plural};
}
function lexicalForIpa(w){
  const {base}=wordDisplayParts(w);
  return base.replace(/^(der|die|das|den|dem|des|ein|eine|einer|einem|einen|eines)\s+/i,'')
    .replace(/\s*\(sich\)\s*/gi,' ')
    .replace(/·/g,'').replace(/\s+/g,' ').trim();
}
function pluralForDisplay(w){
  const {plural}=wordDisplayParts(w);
  return plural && !/^Sg\.?$/i.test(plural) ? `Plural: ${plural}` : '';
}
function renderCard(){const w=currentWord();if(!w){$('sessionPosition').textContent='0/0';$('wordEmoji').textContent='✨';$('wordLevel').textContent='—';$('wordGerman').textContent='Немає слів';$('wordPhonetic').textContent='';$('wordGrammar').textContent='';$('wordMeaning').textContent='Обери іншу тему або додай слово';$('wordHint').textContent='Твоя поточна тема не має слів для навчання.';$('wordSource').textContent='GESTALT';$('backGerman').textContent='Готово';$('backMeaning').textContent='';$('backMeaningNote').textContent='';$('backMeaningNote').hidden=true;$('backSentence').textContent='Обери тему, щоб почати навчання.';$('backSentenceUa').textContent='';$('sentencePanel').hidden=true;$('sentenceToggle').setAttribute('aria-expanded','false');$('sentenceToggle').textContent='Приклад речення ▾';$('flashcard').classList.remove('is-flipped');$('favoriteBtn').textContent='☆';$('favoriteBtn').classList.remove('active');$('rememberBtn').disabled=true;$('forgotBtn').disabled=true;return;}$('sessionPosition').textContent=`${Math.min(state.sessionIndex+1,state.session.length)}/${state.session.length}`;$('wordLevel').textContent=w.level||'A2/B1';
  const parts=wordDisplayParts(w); const rawG=parts.base||'—';
  $('wordGerman').textContent=rawG;
  if($('wordPlural')) $('wordPlural').textContent=pluralForDisplay(w);
  let emj=w.emoji; if(!emj||emj==='✨') emj=emojiForWord(rawG,w.ukrainian); $('wordEmoji').textContent=emj;
  $('wordPhonetic').textContent=save.settings.showPhonetic&&w.phonetic?`/${phonetic(w.phonetic)}/`:'';
  $('wordGrammar').textContent=w.grammar||'';$('wordMeaning').textContent='';$('wordHint').textContent='Переверни картку, щоб перевірити переклад.';$('wordSource').textContent=w.source||'GESTALT · Картка';
  $('backGerman').textContent=rawG||'—';$('backMeaning').textContent=w.ukrainian||'—';$('backMeaningNote').textContent=w.translationNote||'';$('backMeaningNote').hidden=!w.translationNote;
  $('backSentence').textContent=w.sentence||'—';$('backSentenceUa').textContent=sentenceUa(w);$('sentencePanel').hidden=!state.sentenceExpanded;$('sentenceToggle').setAttribute('aria-expanded',state.sentenceExpanded?'true':'false');$('sentenceToggle').textContent=state.sentenceExpanded?'Приклад речення ▴':'Приклад речення ▾';
  const k=wordKey(w), r=save.review[k]||{interval:0,reps:0,status:'new'};
  let stIcon='🆕 Нове',pct=0; if(r.status==='learning'||(r.status==='new'&&r.reps>0)){stIcon='🔄 У процесі';pct=30}else if(r.status==='review'){stIcon='📖 На повторенні';pct=Math.min(95,Math.round((r.interval/30)*100))}else if(r.status==='mastered'||r.interval>=21){stIcon='✅ Вивчене';pct=100}else if(r.interval>0){stIcon='🔄 У процесі';pct=Math.min(100,Math.round((r.interval/21)*100))} if(pct===0&&r.reps>0)pct=10;
  $('wordStatus').textContent=stIcon;$('wordProgressFill').style.width=pct+'%';$('wordProgressText').textContent=pct+'%';
  updateCategoryCounts();$('flashcard').classList.toggle('is-flipped',state.flipped);
  const disabled=state.answerLock||!state.flipped;$('rememberBtn').disabled=disabled;$('forgotBtn').disabled=disabled;
  const fav=save.favorites.includes(k);$('favoriteBtn').classList.toggle('active',fav);$('favoriteBtn').textContent=fav?'★':'☆';maybeSpeakCurrent(false)}
function phonetic(g=''){return String(g||'').replace(/\u200d/g,'').replace(/\s+/g,' ').trim().slice(0,80)}
function emojiForWord(g='',ua=''){const s=(g+' '+ua).toLowerCase();const map=[['hund','🐕'],['haus','🏠'],['sonne','☀️'],['regen','🌧️'],['wasser','💧'],['essen','🍽️'],['brot','🍞'],['milch','🥛'],['kaffee','☕'],['tee','🍵'],['arbeit','💼'],['schule','🏫'],['auto','🚗'],['zug','🚆'],['fahrrad','🚲'],['arzt','🩺'],['buch','📖'],['musik','🎵'],['sport','⚽'],['urlaub','🏖️'],['famil','👨‍👩‍👧‍👦'],['freund','🤝'],['liebe','❤️'],['geld','💶'],['kaufen','🛒'],['telefon','📱']];const hit=map.find(([k])=>s.includes(k));return hit?hit[1]:'✨'}
function renderStats(){const all=mergedWords();const mastered=all.filter(w=>mastery(w)>=5).length;const learning=all.filter(w=>mastery(w)>0&&mastery(w)<5).length;const acc=save.answers?Math.round(save.correct/save.answers*100):0;$('statTotal').textContent=all.length;$('statMastered').textContent=mastered;$('statLearning').textContent=learning;$('statAccuracy').textContent=`${acc}%`;$('statDue').textContent=`${dueWords(state.currentTopic).length} до повторення`;const counts=[0,0,0,0,0,0];all.forEach(w=>counts[mastery(w)]++);$('masteryBars').innerHTML=counts.map((n,i)=>`<div class="mastery-row"><span>Рівень ${i}</span><div class="mastery-track"><div class="mastery-fill" style="width:${all.length?Math.round(n/all.length*100):0}%"></div></div><b>${n}</b></div>`).join('');const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dateKey(d);days.push({v:Number(save.history[k]||0),l:['Нд','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()]})}const mx=Math.max(1,...days.map(x=>x.v));$('activityChart').innerHTML=days.map(x=>`<div class="chart-col"><div class="chart-bar" style="height:${Math.max(8,Math.round(x.v/mx*100))}%"></div><span class="chart-label">${x.l}</span></div>`).join('')}
function renderCollection(listId,searchId,countId){const all=filterTopic(mergedWords(),state.currentTopic);const q=String($(searchId)?.value||'').toLowerCase().trim();const filtered=all.filter(w=>`${w.german} ${w.ukrainian}`.toLowerCase().includes(q));if(countId)$(countId).textContent=all.length;$(listId).innerHTML=filtered.map(w=>`<div class="word-item"><div class="word-left"><div class="mini-emoji">${esc(w.emoji||'✨')}</div><div class="word-copy"><b>${esc(w.german)}</b><small>${esc(w.ukrainian)} · ${mastery(w)}/5</small></div></div><div class="word-meta"><span class="badge">${due(w)?'Повторити':'Пізніше'}</span><button class="mini-speak" data-word="${esc(w.german)}">🔊</button></div></div>`).join('')||'<div class="setting"><div><b>Нічого не знайдено</b><small>Зміни пошуковий запит або додай слово.</small></div></div>';$(listId).querySelectorAll('.mini-speak').forEach(b=>b.addEventListener('click',()=>speak(b.dataset.word)))}
function renderReview(){const dueList=dueWords(state.currentTopic);$('reviewDue').textContent=dueList.length;$('reviewToday').textContent=save.learnedToday;$('reviewStreak').textContent=save.streak;$('reviewList').innerHTML=dueList.slice(0,40).map(w=>`<div class="word-item"><div class="word-left"><div class="mini-emoji">${esc(w.emoji||'✨')}</div><div class="word-copy"><b>${esc(w.german)}</b><small>${esc(w.ukrainian)}</small></div></div><span class="badge">${mastery(w)}/5</span></div>`).join('')||'<div class="setting"><div><b>Все чисто ✨</b><small>Зараз немає слів, які потрібно повторити.</small></div></div>'}
function renderSettings(){const dark=save.settings.theme==='dark';$('themeSwitch').classList.toggle('on',dark);$('motionSwitch').classList.toggle('on',save.settings.reducedMotion);$('autoSpeakSwitch').classList.toggle('on',save.settings.autoSpeak);$('phoneticSwitch').classList.toggle('on',save.settings.showPhonetic);$('voiceRate').value=String(save.settings.voiceRate);$('voiceSelect').value=voiceList.some(v=>v.name===save.settings.voiceName)?save.settings.voiceName:'auto'}
function renderAll(){renderTopicSelectors();renderHeader();renderCard();renderStats();renderCollection('inlineWordList','searchInput','collectionCount');renderCollection('collectionList','collectionSearch','collectionBigCount');renderReview();renderSettings();}
function toast(msg){const e=$('toast');e.textContent=msg;e.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>e.classList.remove('show'),2200)}
function haptic(kind='light'){try{if(tg?.HapticFeedback){if(kind==='success'||kind==='error')tg.HapticFeedback.notificationOccurred(kind);else tg.HapticFeedback.impactOccurred('light')}}catch{}}
function openAdd(){const m=$('addModal');m.classList.add('open');m.setAttribute('aria-hidden','false');$('addDe').focus()}
function closeAdd(){const m=$('addModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function addWord(){
  const de=$('addDe').value.trim();
  const ua=$('addUa').value.trim();
  const ex=$('addEx').value.trim()||`${de.charAt(0).toUpperCase()+de.slice(1)} ist wichtig.`;
  const emoji=$('addEmoji').value.trim()||'✨';
  if(!de||!ua){toast('Вкажи слово і переклад');return}
  const normalized=de.toLocaleLowerCase('de-DE').trim();
  if(mergedWords().some(w=>String(w.german||'').toLocaleLowerCase('de-DE').trim()===normalized)){toast('Це слово вже є в колекції');return}
  const w={id:uid(),german:de,ukrainian:ua,translationNote:'',hint:ua,grammar:'Власне слово',emoji,sentence:ex,sentenceUa:'Ваш власний приклад.',level:'A2/B1',category:'Мої слова',source:'GESTALT · Моя колекція',frequency:1,topicId:'my-words',topicNumber:null,topicTitle:'Мої слова',sentenceUa:'Ваш власний приклад.'};
  save.customWords.unshift(w);
  persist();
  pickSession('learn');
  closeAdd();
  ['addDe','addUa','addEx'].forEach(id=>$(id).value='');
  $('addEmoji').value='✨';
  toast('Слово додано ✨');
  navigate('collections');
}
function toggleFlip(){if(state.answerLock)return;state.flipped=!state.flipped;haptic('light');renderCard()}
function toggleFavorite(){const k=wordKey(currentWord());if(!k)return;const set=new Set(save.favorites);if(set.has(k)){set.delete(k);toast('Прибрано з улюблених')}else{set.add(k);toast('Додано в улюблені ✨')}save.favorites=[...set];persist();renderCard()}
function refreshVoices(){if(!('speechSynthesis' in window))return;voiceList=speechSynthesis.getVoices().filter(v=>/^(de)(-|_)/i.test(v.lang)||/german|deutsch/i.test(v.name));const s=$('voiceSelect');if(!s)return;s.innerHTML='<option value="auto">Автоматично</option>'+voiceList.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} · ${esc(v.lang)}</option>`).join('');s.value=voiceList.some(v=>v.name===save.settings.voiceName)?save.settings.voiceName:'auto'}
function syncTheme(){document.documentElement.dataset.theme=save.settings.theme;document.documentElement.classList.toggle('reduced-motion',save.settings.reducedMotion);document.documentElement.style.colorScheme=save.settings.theme;if(tg){try{tg.setHeaderColor?.(save.settings.theme==='dark'?'#050711':'#eff3fa');tg.setBackgroundColor?.(save.settings.theme==='dark'?'#050711':'#eff3fa')}catch{}}}
function exportProgress(){const b=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`gestalt-progress-v${VERSION}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Прогрес експортовано')}
function importProgress(file){const r=new FileReader();r.onload=()=>{try{save=normalizeSave(JSON.parse(r.result));state.currentTopic=save.currentTopic||'topic-8';persist();if(state.screen==='learn'||state.screen==='review')pickSession(state.mode,state.currentTopic);renderAll();toast('Прогрес відновлено ✅')}catch{toast('Не вдалося імпортувати файл')}};r.readAsText(file)}
function inTelegramContext(){return Boolean(window.Telegram?.WebApp)||/[?&]tgWebApp(?:Data|Platform|Version|StartParam|ThemeParams)=/i.test(location.search)}
async function tgLoadSdk(){if(window.Telegram?.WebApp)return true;if(!inTelegramContext())return false;return new Promise(resolve=>{const s=document.createElement('script');s.src='https://telegram.org/js/telegram-web-app.js';s.async=true;s.onload=()=>resolve(Boolean(window.Telegram?.WebApp));s.onerror=()=>resolve(false);document.head.appendChild(s);setTimeout(()=>resolve(Boolean(window.Telegram?.WebApp)),1800)})}
function applyTelegram(){if(!tg)return;try{tg.ready();tg.expand();tg.disableVerticalSwipes?.();tg.setHeaderColor?.(save.settings.theme==='dark'?'#050711':'#eff3fa');tg.setBackgroundColor?.(save.settings.theme==='dark'?'#050711':'#eff3fa');const applyInsets=()=>{const s=tg.safeAreaInset||{},c=tg.contentSafeAreaInset||{};document.documentElement.style.setProperty('--tg-safe-bottom',`${Number(s.bottom||0)}px`);document.documentElement.style.setProperty('--tg-content-bottom',`${Number(c.bottom||0)}px`)};applyInsets();tg.onEvent?.('viewportChanged',applyInsets);tg.onEvent?.('themeChanged',()=>{syncTheme();applyInsets()});tg.BackButton?.onClick(()=>navigate('learn'));}catch{}}
function syncTelegramBack(){try{if(!tg?.BackButton)return;state.screen==='learn'?tg.BackButton.hide():tg.BackButton.show()}catch{}}
async function cloudSave(){if(!tg?.CloudStorage)return false;try{const raw=JSON.stringify(save);const chunk=2400;const count=Math.ceil(raw.length/chunk);await new Promise((res,rej)=>tg.CloudStorage.setItem(`${TG_PREFIX}count`,String(count),e=>e?rej(e):res()));for(let i=0;i<count;i++){const part=raw.slice(i*chunk,(i+1)*chunk);await new Promise((res,rej)=>tg.CloudStorage.setItem(`${TG_PREFIX}${i}`,part,e=>e?rej(e):res()))}return true}catch{return false}}
async function cloudLoad(){if(!tg?.CloudStorage)return null;for(const prefix of [TG_PREFIX,'gestalt_v10_','gestalt_v9_','gestalt_v8_','gestalt_v7_']){try{const count=await new Promise((res,rej)=>tg.CloudStorage.getItem(`${prefix}count`,(e,v)=>e?rej(e):res(Number(v)||0)));if(!count)continue;const keys=Array.from({length:count},(_,i)=>`${prefix}${i}`);const vals=await new Promise((res,rej)=>tg.CloudStorage.getItems(keys,(e,v)=>e?rej(e):res(v||{})));let raw='';for(const k of keys)raw+=vals[k]||'';if(raw)return normalizeSave(JSON.parse(raw))}catch{}}return null}
async function initTelegram(){const ok=await tgLoadSdk();tg=ok?window.Telegram.WebApp:null;if(!tg)return;applyTelegram();const remote=await cloudLoad();if(remote&&Number(remote.updatedAt||0)>Number(save.updatedAt||0))save=remote;persist();renderAll();$('tgStatus').textContent='Telegram Mini App · синхронізація готова'}
async function syncTelegram(){if(!tg){toast('Синхронізація буде доступна в Telegram');return}const ok=await cloudSave();if(ok)$('tgStatus').textContent='Telegram Mini App · синхронізовано';toast(ok?'Збережено в Telegram ✅':'Синхронізація тимчасово недоступна')}
function startReviewSession(){
  activeCategoryFilter='all';
  document.querySelectorAll('.cat-pill').forEach(b=>b.classList.toggle('active',b.dataset.cat==='all'));
  const due=dueWords(state.currentTopic);
  state.session=due.slice(0,24);
  state.sessionIndex=0;
  state.mode='review';
  state.screen='learn';
  state.subview='learn';
  state.flipped=false;
  state.answerLock=false;
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='screen-learn'));
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav==='review'));
  $('pageTitle').textContent='Повторення';
  if(!due.length) toast('На зараз немає запланованих повторень ✨');
  renderAll();
  syncTelegramBack();
}
function bind(){
 document.querySelectorAll('.subtab').forEach(b=>b.addEventListener('click',()=>setSubview(b.dataset.subview)));$('topicSelect').addEventListener('change',e=>setTopic(e.target.value));$('collectionTopicSelect').addEventListener('change',e=>setTopic(e.target.value));
 $('cardWrap').addEventListener('click',e=>{if(e.target.closest('button'))return;toggleFlip()});$('sentenceToggle').addEventListener('click',e=>{e.stopPropagation();if(!state.flipped||state.answerLock)return;state.sentenceExpanded=!state.sentenceExpanded;$('sentencePanel').hidden=!state.sentenceExpanded;$('sentenceToggle').setAttribute('aria-expanded',state.sentenceExpanded?'true':'false');$('sentenceToggle').textContent=state.sentenceExpanded?'Приклад речення ▴':'Приклад речення ▾'});$('cardWrap').addEventListener('pointerdown',e=>{state.swipeStartX=e.clientX;state.swipeStartY=e.clientY});$('cardWrap').addEventListener('pointerup',e=>{const dx=e.clientX-state.swipeStartX,dy=e.clientY-state.swipeStartY;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)&&state.flipped&&!state.answerLock){dx>0?answerWord(4):answerWord(0)}state.swipeStartX=0;state.swipeStartY=0});$('cardWrap').addEventListener('pointercancel',()=>{state.swipeStartX=0;state.swipeStartY=0});$('cardWrap').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleFlip()}});$('speakWord').addEventListener('click',e=>{e.stopPropagation();speak(lexicalForIpa(currentWord()||{}))});$('speakSentence').addEventListener('click',e=>{e.stopPropagation();speak(currentWord()?.sentence)});$('favoriteBtn').addEventListener('click',toggleFavorite);$('rememberBtn').addEventListener('click',()=>answerWord(4));$('forgotBtn').addEventListener('click',()=>answerWord(0));
 $('searchInput').addEventListener('input',()=>renderCollection('inlineWordList','searchInput','collectionCount'));$('collectionSearch').addEventListener('input',()=>renderCollection('collectionList','collectionSearch','collectionBigCount'));$('collectionSpeak').addEventListener('click',()=>{const q=String($('collectionSearch').value||'').trim();const w=filterTopic(mergedWords(),state.currentTopic).find(x=>!q||`${x.german} ${x.ukrainian}`.toLowerCase().includes(q.toLowerCase()));if(w)speak(w.german);else toast('Немає слова для озвучення')});
 $('reviewStart').addEventListener('click',startReviewSession);
 $('openAddCollection').addEventListener('click',openAdd);$('closeAdd').addEventListener('click',closeAdd);$('addModal').addEventListener('click',e=>{if(e.target.id==='addModal')closeAdd()});$('addBtn').addEventListener('click',addWord);
 $('topSearch').addEventListener('click',()=>{navigate('collections');setTimeout(()=>$('collectionSearch')?.focus(),50)});$('mobileMenu').addEventListener('click',()=>navigate('settings'));
 $('themeSwitch').addEventListener('click',()=>{save.settings.theme=save.settings.theme==='dark'?'light':'dark';persist();syncTheme();renderSettings()});$('motionSwitch').addEventListener('click',()=>{save.settings.reducedMotion=!save.settings.reducedMotion;persist();syncTheme();renderSettings()});$('autoSpeakSwitch').addEventListener('click',()=>{save.settings.autoSpeak=!save.settings.autoSpeak;persist();renderSettings()});$('phoneticSwitch').addEventListener('click',()=>{save.settings.showPhonetic=!save.settings.showPhonetic;persist();renderSettings();renderCard()});$('voiceRate').addEventListener('change',e=>{save.settings.voiceRate=Number(e.target.value)||.9;persist()});$('voiceSelect').addEventListener('change',e=>{save.settings.voiceName=e.target.value;persist()});$('tgSyncBtn').addEventListener('click',syncTelegram);$('exportBtn').addEventListener('click',exportProgress);$('importFile').addEventListener('change',e=>{if(e.target.files?.[0])importProgress(e.target.files[0]);e.target.value=''});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('addModal').classList.contains('open'))closeAdd();if(state.screen==='learn'&&state.subview==='learn'&&!state.answerLock){if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&state.flipped){answerWord(e.key==='ArrowRight'?4:0);return}if(e.key===' '||e.key==='Enter'){e.preventDefault();toggleFlip()}}});
 $('resetBtn').addEventListener('click',async()=>{const ok=tg?.showConfirm?await new Promise(r=>tg.showConfirm('Скинути локальний прогрес?',r)):window.confirm('Скинути локальний прогрес?');if(ok){safeRemove(SAVE_KEY);location.reload()}})
}
const WORD_FIELDS=['id','german','ukrainian','grammar','emoji','sentence','sentenceUa','level','source','topicId','topicNumber','topicTitle','sourcePage','frequency','phonetic','headword','pluralMarker','pluralForm','translationNote'];
function expandCompactDictionary(payload){
  if(!payload||!Array.isArray(payload.words)||!Array.isArray(payload.fields))throw new Error('Некоректний компактний словник');
  const fields=payload.fields.length?payload.fields:WORD_FIELDS;
  return payload.words.map(row=>{const w={};fields.forEach((k,i)=>w[k]=row[i]);return w});
}
function validateDictionary(d){
  if(!Array.isArray(d)||d.length===0)throw new Error('Словник порожній');
  const valid=d.filter(w=>w&&typeof w==='object'&&String(w.id||'').trim()&&String(w.german||'').trim()&&String(w.ukrainian||'').trim());
  if(valid.length<Math.min(50,d.length))throw new Error('Некоректна структура словника');
  return valid;
}
async function fetchJsonFast(url,timeoutMs=10000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const r=await fetch(url,{cache:'no-store',signal:controller.signal});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return await r.json();
  }finally{clearTimeout(timer)}
}
async function loadWordData(){
  const sources=[
    {url:`${COMPACT_WORDS_URL}?v=${encodeURIComponent(VERSION)}`,compact:true},
    {url:`${WORDS_URL}?v=${encodeURIComponent(VERSION)}`,compact:false},
    {url:COMPACT_WORDS_URL,compact:true},
    {url:WORDS_URL,compact:false}
  ];
  let lastError=null;
  for(const source of sources){
    try{
      const payload=await fetchJsonFast(source.url,10000);
      const data=source.compact?expandCompactDictionary(payload):payload;
      words=validateDictionary(data);
      return true;
    }catch(e){lastError=e}
  }
  words=[];
  toast(`Не вдалося завантажити словник${lastError?.message?`: ${lastError.message}`:''}`);
  return false;
}
async function boot(){
  loadSave();state.currentTopic=save.currentTopic||'topic-8';syncTheme();buildNav();bind();
  document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();speechSynthesis?.cancel?.()}});
  refreshVoices();if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=refreshVoices;
  pickSession('learn');renderAll();
  await loadWordData();
  const list=topics();
  const current=list.find(t=>t.id===state.currentTopic);
  if(state.currentTopic!=='all'&&(!current||current.count===0))state.currentTopic=list.find(t=>t.count>0)?.id||'all';
  save.currentTopic=state.currentTopic;
  pickSession(state.mode,state.currentTopic);renderAll();maybeSpeakCurrent(false);
  initTelegram().then(syncTelegramBack);
  if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{})}
  if(navigator.storage?.persist){navigator.storage.persist().catch(()=>{})}
}

document.addEventListener('click',e=>{const pill=e.target.closest?.('.cat-pill');if(pill?.dataset.cat)setCategoryFilter(pill.dataset.cat)});
boot();


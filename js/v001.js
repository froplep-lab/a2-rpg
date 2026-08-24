
import { getProgress, setProgress } from './storage.js';
import { cards } from './state.js';
import { AudioEngine } from './audio.js';

const KEY='dq_v001_daily';
const VERSION='0.001';

function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDaily(){
  try{
    const raw=localStorage.getItem(KEY);
    const parsed=raw?JSON.parse(raw):null;
    if(!parsed || parsed.date!==todayKey()) return {date:todayKey(), reviewed:0, audio:0, quizzes:0, battles:0, xp:0};
    return parsed;
  }catch{return {date:todayKey(), reviewed:0, audio:0, quizzes:0, battles:0, xp:0};}
}
function saveDaily(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}}

export function recordDaily(type, amount=1){
  const d=getDaily();
  d[type]=(d[type]||0)+amount;
  saveDaily(d);
  render();
}
export function addDailyXp(amount){
  const d=getDaily(); d.xp=(d.xp||0)+amount; saveDaily(d); render();
}

function render(){
  const p=getProgress();
  const d=getDaily();
  const el=(id)=>document.getElementById(id);
  if(el('v001-word-count')) el('v001-word-count').textContent=cards.length;
  if(el('v001-streak')) el('v001-streak').textContent=p.streak||0;
  if(el('v001-level')) el('v001-level').textContent=p.level||1;
  if(el('v001-today')) el('v001-today').textContent=(d.reviewed||0)+(d.audio||0)+(d.quizzes||0);
  const title=el('v001-live-region');
  if(title) title.textContent=`${cards.length} слів доступно. Сьогодні виконано ${d.reviewed||0} повторень.`;
}

function installClickSound(){
  document.addEventListener('click',(e)=>{
    const btn=e.target.closest('button');
    if(!btn) return;
    if(btn.dataset.noSfx==='true') return;
    AudioEngine.play('click');
  },{passive:true});
}

function registerServiceWorker(){
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
}

function smokeRows(){
  const rows=[
    ['Vocabulary database', Array.isArray(cards)&&cards.length>100, `${cards.length} cards`],
    ['Local storage', (()=>{try{localStorage.setItem('dq_test','1'); localStorage.removeItem('dq_test'); return true;}catch{return false;}})(), 'save/load'],
    ['Speech synthesis', 'speechSynthesis' in window, 'de-DE TTS'],
    ['Audio context', !!(window.AudioContext||window.webkitAudioContext), 'Web Audio'],
    ['Responsive viewport', window.innerWidth>=280 && window.innerHeight>=400, `${window.innerWidth}×${window.innerHeight}`],
    ['Touch support', ('ontouchstart' in window)||navigator.maxTouchPoints>0, 'touch/pointer'],
    ['Telegram WebApp', !!window.Telegram?.WebApp, 'optional integration']
  ];
  return rows;
}

export function openPlaytestModal(){
  const id='v001-playtest-modal';
  document.getElementById(id)?.remove();
  const rows=smokeRows();
  const passed=rows.filter(r=>r[1]).length;
  const modal=document.createElement('div');
  modal.id=id;
  modal.className='fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm';
  modal.innerHTML=`
    <div class="v001-test-panel">
      <div class="v001-test-head">
        <div><span class="eyebrow">DEUTSCH QUEST</span><h2>Playtest Center <span>v${VERSION}</span></h2></div>
        <button class="v001-test-close" data-close>×</button>
      </div>
      <p class="v001-test-note">Швидкий smoke-test перед публікацією нового апдейту. ${passed}/${rows.length} базових перевірок пройдено.</p>
      <div class="v001-test-list">${rows.map(([name,ok,info])=>`
        <div class="v001-test-row"><span>${ok?'✓':'!'}</span><div><b>${name}</b><small>${info}</small></div><strong>${ok?'PASS':'CHECK'}</strong></div>`).join('')}</div>
      <div class="v001-test-actions">
        <button class="v001-test-primary" data-sound>🔊 Test Sound</button>
        <button class="v001-test-secondary" data-tts>🎙️ Test German</button>
        <button class="v001-test-secondary" data-close>Закрити</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove());
  modal.querySelector('[data-sound]').onclick=()=>AudioEngine.play('success');
  modal.querySelector('[data-tts]').onclick=()=>import('./speech.js').then(m=>m.SpeechEngine.speak('Hallo! Wir lernen heute Deutsch.',0.85)).catch(()=>{});
}

export function initV001(){
  render();
  installClickSound();
  registerServiceWorker();
  window.addEventListener('resize',render,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  window.DQDaily={record:recordDaily,addXp:addDailyXp};
  window.openPlaytestModal=openPlaytestModal;
}

window.initV001=initV001;

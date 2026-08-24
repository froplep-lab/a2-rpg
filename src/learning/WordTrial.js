import {TelegramBridge} from '../telegram/TelegramBridge.js';
export class WordTrial{
  constructor(words,state,onComplete){this.words=words;this.state=state;this.onComplete=onComplete;this.i=0;this.earnedXP={};this.questions=this.makeQuestions()}
  makeQuestions(){const pool=[...this.words].sort(()=>Math.random()-.5);return pool.slice(0,Math.min(5,pool.length)).map(correct=>{const others=this.words.filter(w=>w.id!==correct.id).sort(()=>Math.random()-.5).slice(0,3);return{wordObj:correct,options:[correct,...others].sort(()=>Math.random()-.5).map(w=>w.translation),correct:correct.translation}})}
  speak(text){if(!this.state.settings.sound||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=.88;window.speechSynthesis.speak(u)}
  render(el){
    if(this.i>=this.questions.length)return this.finish(el);const q=this.questions[this.i];this.speak(q.wordObj.word);
    const pct=(this.i/this.questions.length)*100;
    el.innerHTML=`<div class="trial-wrap"><div class="topbar" style="margin:-1px -18px 0"><button id="trial-back" class="icon-btn">←</button><div><h2>Word Trial</h2><div class="sub">Question ${this.i+1} of ${this.questions.length}</div></div><button id="speak" class="mini-btn">🔊</button></div><div class="trial-card"><div class="progress-track"><i style="width:${pct}%"></i></div><div class="trial-word">${q.wordObj.emoji||'📚'} ${this.escape(q.wordObj.word)}</div><div class="trial-translation">Що означає це слово?</div><div class="options">${q.options.map((x,n)=>`<button class="option-btn" data-i="${n}">${this.escape(x)}</button>`).join('')}</div><div id="feedback" class="feedback"></div><div class="subtitle" style="text-align:center">Правильна відповідь: +120 XP до картки.</div></div></div>`;
    el.querySelector('#speak').onclick=()=>this.speak(q.wordObj.word);el.querySelector('#trial-back').onclick=()=>this.finish(el);
    el.querySelectorAll('.option-btn').forEach(b=>b.onclick=()=>{if(b.disabled)return;el.querySelectorAll('.option-btn').forEach(x=>x.disabled=true);const ok=b.textContent===q.correct;b.classList.add(ok?'correct':'wrong');el.querySelector('#feedback').textContent=ok?'✓ Правильно! +120 XP':'✕ Правильна відповідь: '+q.correct;TelegramBridge.haptic(ok?'success':'error');if(ok)this.earnedXP[q.wordObj.id]=(this.earnedXP[q.wordObj.id]||0)+120;setTimeout(()=>{this.i++;this.render(el)},650)})
  }
  finish(el){el.innerHTML='';this.onComplete(this.earnedXP)}
  escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
}

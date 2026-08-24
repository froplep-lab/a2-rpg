import { TelegramBridge } from '../telegram/TelegramBridge.js';

export class WordTrial {
  constructor(wordsData, state, onComplete) {
    this.words = wordsData; 
    this.state = state; 
    this.onComplete = onComplete;
    this.currentIndex = 0; 
    this.earnedXP = {}; 
    this.questions = this.generateQuestions();
  }

  generateQuestions() {
    const qList = [];
    const shuffled = [...this.words].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      const correct = shuffled[i];
      const distractors = this.words.filter(w => w.id !== correct.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [...distractors, correct].sort(() => 0.5 - Math.random());
      qList.push({
        wordObj: correct, 
        questionText: `What does "${correct.word}" mean?`,
        options: options.map(o => o.translation), 
        correctAnswer: correct.translation
      });
    }
    return qList;
  }

  speakWord(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      window.speechSynthesis.speak(utterance);
    }
  }

  render(container) {
    if (this.currentIndex >= this.questions.length) { 
      this.finish(container); 
      return; 
    }
    
    const q = this.questions[this.currentIndex];
    this.speakWord(q.wordObj.word);

    container.innerHTML = `
      <div style="padding: 20px; display: flex; flex-direction: column; height: 100%; justify-content: space-between; max-width: 400px; margin: 0 auto;">
        <div>
          <div style="font-size: 14px; color: #9ca3af; margin-bottom: 8px;">Word Trial (${this.currentIndex + 1}/${this.questions.length})</div>
          <div style="font-size: 22px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            ${q.wordObj.emoji} ${q.questionText}
            <button id="btn-repeat-audio" style="background:none; border:none; cursor:pointer; font-size: 20px;">🔊</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;" id="options-list">
            ${q.options.map(opt => `<button class="btn-secondary option-btn" data-val="${opt}" style="text-align: left; padding: 14px;">${opt}</button>`).join('')}
          </div>
        </div>
        <button id="trial-exit" class="btn-secondary" style="background: transparent; border: none; color: #9ca3af;">Exit Trial</button>
      </div>
    `;

    container.querySelector('#btn-repeat-audio').onclick = () => {
      this.speakWord(q.wordObj.word);
    };

    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.onclick = (e) => {
        if (btn.disabled) return;
        container.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

        const val = e.target.getAttribute('data-val');
        const isCorrect = val === q.correctAnswer;
        TelegramBridge.haptic(isCorrect ? 'success' : 'error');
        
        btn.style.backgroundColor = isCorrect ? '#10b981' : '#ef4444';
        btn.style.color = '#fff';

        if (isCorrect) {
          const reward = 120;
          this.earnedXP[q.wordObj.id] = (this.earnedXP[q.wordObj.id] || 0) + reward;
        }
        
        setTimeout(() => {
          this.currentIndex++;
          this.render(container);
        }, 600);
      };
    });
    
    container.querySelector('#trial-exit').onclick = () => { 
      this.finish(container); 
    };
  }

  finish(container) { 
    container.innerHTML = ''; 
    this.onComplete(this.earnedXP); 
  }
}
import { EMBEDDED_WORD_DATA } from './words.js';

let words = EMBEDDED_WORD_DATA.words.map(row => {
  const obj = {};
  EMBEDDED_WORD_DATA.fields.forEach((f, idx) => { obj[f] = row[idx]; });
  return obj;
});

let state = {
  currentTopic: 'topic-8',
  currentCategory: 'all',
  currentIndex: 0,
  isFlipped: false,
  progress: JSON.parse(localStorage.getItem('gestalt_progress') || '{}'),
  settings: JSON.parse(localStorage.getItem('gestalt_settings') || '{"autoSpeak":false,"phonetic":true,"voiceRate":"1.0","motion":false,"theme":"dark"}'),
  favorites: JSON.parse(localStorage.getItem('gestalt_favorites') || '[]')
};

const screens = ['screen-learn', 'screen-collections', 'screen-review', 'screen-settings'];

function initApp() {
  setupNavigation();
  setupEventListeners();
  populateTopics();
  renderCurrentCard();
  updateStats();
}

function setupNavigation() {
  const bottomNav = document.getElementById('bottomNav');
  const sideNav = document.getElementById('sideNav');
  
  const navItems = [
    { id: 'learn', icon: '📚', label: 'Слова', screen: 'screen-learn' },
    { id: 'collections', icon: '🧳', label: 'Колекції', screen: 'screen-collections' },
    { id: 'add', icon: '＋', label: 'Додати', action: () => openModal(true), isAdd: true },
    { id: 'review', icon: '📖', label: 'Повторення', screen: 'screen-review' },
    { id: 'settings', icon: '⚙️', label: 'Налаштування', screen: 'screen-settings' }
  ];

  bottomNav.innerHTML = navItems.map(item => `
    <button class="${item.isAdd ? 'add' : ''} ${item.screen === 'screen-learn' ? 'active' : ''}" data-id="${item.id}">
      <span class="ico">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join('');

  sideNav.innerHTML = navItems.filter(i => !i.isAdd).map(item => `
    <button class="${item.screen === 'screen-learn' ? 'active' : ''}" data-id="${item.id}">
      <span class="ico">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join('');

  document.querySelectorAll('.bottom-nav button, .rail-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = navItems.find(i => i.id === id);
      if (item && item.action) { item.action(); return; }
      if (item && item.screen) {
        switchScreen(item.screen);
        document.querySelectorAll('.bottom-nav button, .rail-nav button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`[data-id="${id}"]`).forEach(b => b.classList.add('active'));
      }
    });
  });
}

function switchScreen(screenId) {
  screens.forEach(s => {
    document.getElementById(s).classList.toggle('active', s === screenId);
  });
}

function setupEventListeners() {
  // Subtabs inside Learn screen
  document.querySelectorAll('.subtab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.subview').forEach(v => v.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`subview-${tab.dataset.subview}`).classList.add('active');
    });
  });

  // Category filters
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentCategory = pill.dataset.cat;
      state.currentIndex = 0;
      renderCurrentCard();
    });
  });

  // Flashcard flip interaction
  const flashcard = document.getElementById('flashcard');
  flashcard.addEventListener('click', (e) => {
    if (e.target.closest('button')) return; // ignore buttons inside card
    state.isFlipped = !state.isFlipped;
    flashcard.classList.toggle('is-flipped', state.isFlipped);
  });

  // Remember / Forgot buttons
  document.getElementById('rememberBtn').addEventListener('click', () => handleAnswer(true));
  document.getElementById('forgotBtn').addEventListener('click', () => handleAnswer(false));

  // Speech buttons
  document.getElementById('speakWord').addEventListener('click', (e) => {
    e.stopPropagation();
    speakCurrentWord();
  });

  // Sentence toggle
  const sentenceToggle = document.getElementById('sentenceToggle');
  const sentencePanel = document.getElementById('sentencePanel');
  sentenceToggle.addEventListener('click', () => {
    const isHidden = sentencePanel.hasAttribute('hidden');
    if (isHidden) {
      sentencePanel.removeAttribute('hidden');
      sentenceToggle.setAttribute('aria-expanded', 'true');
      sentenceToggle.textContent = 'Приклад речення ▴';
    } else {
      sentencePanel.setAttribute('hidden', '');
      sentenceToggle.setAttribute('aria-expanded', 'false');
      sentenceToggle.textContent = 'Приклад речення ▾';
    }
  });

  document.getElementById('speakSentence').addEventListener('click', () => {
    const text = document.getElementById('backSentence').textContent;
    speakText(text);
  });

  // Modal close
  document.getElementById('closeAdd').addEventListener('click', () => openModal(false));
  document.getElementById('addModal').addEventListener('click', (e) => {
    if (e.target.id === 'addModal') openModal(false);
  });

  // Topic select change
  document.getElementById('topicSelect').addEventListener('change', (e) => {
    state.currentTopic = e.target.value;
    state.currentIndex = 0;
    renderCurrentCard();
  });
}

function getFilteredWords() {
  return words.filter(w => {
    if (state.currentTopic && w.topicId !== state.currentTopic) return false;
    const p = state.progress[w.id] || { status: 'new' };
    if (state.currentCategory === 'new') return p.status === 'new';
    if (state.currentCategory === 'learning') return p.status === 'learning';
    if (state.currentCategory === 'review') return p.status === 'review';
    if (state.currentCategory === 'mastered') return p.status === 'mastered';
    return true;
  });
}

function populateTopics() {
  const topicsMap = {};
  words.forEach(w => {
    if (!topicsMap[w.topicId]) {
      topicsMap[w.topicId] = { title: w.topicTitle, count: 0 };
    }
    topicsMap[w.topicId].count++;
  });

  const select = document.getElementById('topicSelect');
  select.innerHTML = Object.entries(topicsMap).map(([id, t]) => `
    <option value="${id}">${t.title} (${t.count})</option>
  `).join('');
  select.value = state.currentTopic;
}

function renderCurrentCard() {
  const filtered = getFilteredWords();
  const countAll = words.filter(w => w.topicId === state.currentTopic).length;
  const countNew = words.filter(w => w.topicId === state.currentTopic && (!state.progress[w.id] || state.progress[w.id].status === 'new')).length;
  
  document.getElementById('countAll').textContent = countAll;
  document.getElementById('countNew').textContent = countNew;

  if (filtered.length === 0) {
    document.getElementById('wordGerman').textContent = 'Слів немає 🎉';
    document.getElementById('backGerman').textContent = 'Слів немає';
    document.getElementById('backMeaning').textContent = 'Вивчено всі слова в цій категорії!';
    document.getElementById('sessionPosition').textContent = '0/0';
    return;
  }

  if (state.currentIndex >= filtered.length) state.currentIndex = 0;
  const word = filtered[state.currentIndex];

  // Reset flip
  state.isFlipped = false;
  document.getElementById('flashcard').classList.remove('is-flipped');
  document.getElementById('sentencePanel').setAttribute('hidden', '');
  document.getElementById('sentenceToggle').textContent = 'Приклад речення ▾';

  // Front face
  document.getElementById('wordGerman').textContent = word.german;
  document.getElementById('wordPlural').textContent = word.pluralForm ? `Pl: ${word.pluralForm}` : '';
  document.getElementById('wordEmoji').textContent = word.emoji || '✨';
  document.getElementById('wordPhonetic').textContent = `[${word.phonetic || '—'}]`;
  document.getElementById('wordGrammar').textContent = word.grammar || 'Nomen';
  document.getElementById('wordSource').textContent = word.source || '';
  document.getElementById('sessionPosition').textContent = `${state.currentIndex + 1}/${filtered.length}`;

  // Back face
  document.getElementById('backGerman').textContent = word.german;
  document.getElementById('backMeaning').textContent = word.ukrainian;
  document.getElementById('backSentence').textContent = word.sentence || '';
  document.getElementById('backSentenceUa').textContent = word.sentenceUa || '';
}

function handleAnswer(known) {
  const filtered = getFilteredWords();
  if (filtered.length === 0) return;
  const word = filtered[state.currentIndex];

  if (!state.progress[word.id]) state.progress[word.id] = { status: 'new', repetitions: 0 };
  const p = state.progress[word.id];

  if (known) {
    p.repetitions = (p.repetitions || 0) + 1;
    p.status = p.repetitions >= 3 ? 'mastered' : 'learning';
  } else {
    p.status = 'review';
  }

  localStorage.setItem('gestalt_progress', JSON.stringify(state.progress));
  
  state.currentIndex++;
  if (state.currentIndex >= filtered.length) state.currentIndex = 0;
  renderCurrentCard();
  updateStats();
}

function speakCurrentWord() {
  const filtered = getFilteredWords();
  if (filtered.length === 0) return;
  const word = filtered[state.currentIndex];
  speakText(word.german);
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = parseFloat(state.settings.voiceRate || '1.0');
  window.speechSynthesis.speak(utterance);
}

function openModel(open) {
  document.getElementById('addModal').classList.toggle('open', open);
}

function updateStats() {
  let mastered = 0, learning = 0, review = 0, newWords = 0;
  words.forEach(w => {
    const p = state.progress[w.id];
    if (!p || p.status === 'new') newWords++;
    else if (p.status === 'mastered') mastered++;
    else if (p.status === 'learning') learning++;
    else if (p.status === 'review') review++;
  });

  document.getElementById('statTotal').textContent = words.length;
  document.getElementById('statNew').textContent = newWords;
  document.getElementById('statLearning').textContent = learning;
  document.getElementById('statReview').textContent = review;
  document.getElementById('statMastered').textContent = mastered;
}

document.addEventListener('DOMContentLoaded', initApp);
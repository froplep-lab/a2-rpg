# ARCHITECTURE MAP — GESTALT v0.029

## Files
```text
index.html
├── css/main.css              UI, responsive layout, 3D card
├── js/app.js                 controller, state, SRS, persistence, speech, Telegram client
├── data/words.json           canonical 954-word dataset
├── data/words.compact.json   compact dataset
├── data/book-vocabulary-manifest.json
├── sw.js                     offline cache
├── server/index.mjs          Node server + Telegram Bot API
├── tests/smoke.mjs           regression/content checks
├── tests/platform.mjs        platform checks
└── assets/                   icons
```

## Data flow
data → validateDictionary → words[] + customWords → mergedWords/filterTopic/category → pickSession → state.session → renderCard → answerWord → review/mastery/history/xp → persist → localStorage/Telegram CloudStorage.

## Where to change X
- Card flip: `css/main.css` + `renderCard()` (CRITICAL).
- Card layout/copy: `index.html` + `css/main.css` (SAFE).
- SRS/XP: `BALANCE` + `answerWord()` (CAUTION).
- Counters: `updateCategoryCounts()` + category pill ids (CAUTION).
- Topics: `topics()`, `filterTopic()`, `setTopic()` (CAUTION).
- Save: `normalizeSave()`, `SAVE_VERSION`, `persist()` (CRITICAL).
- Telegram: `cloudSave()`, `cloudLoad()`, `server/index.mjs` (CRITICAL).
- Offline: `sw.js` (CAUTION).
- Vocabulary: `data/words.json` + compact form (CRITICAL).

## Interactions
Tap/Enter/Space → `toggleFlip()`; buttons/keyboard/swipe → `answerWord()`; topic selector → `setTopic()`; sentence toggle expands only the example.

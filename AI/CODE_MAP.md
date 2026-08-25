# CODE MAP

| Path | Responsibility | Critical symbols / notes |
|---|---|---|
| `index.html` | Static DOM shell and UI labels | All DOM ids consumed by `app.js`; flashcard, navigation, panels, modal |
| `css/main.css` | Visual system, responsive layout, card 3D | `.flashcard`, `.flash-face`, `.flash-front`, `.flash-back`, mobile/desktop media queries |
| `js/app.js` | Main application controller and all learner logic | save/state normalization, SRS, render, events, Telegram, speech, data loading |
| `data/words.json` | Full canonical vocabulary | 954 records, lessons 8–14 |
| `data/words.compact.json` | Compact transport representation | object with `fields` + row arrays; expanded by `expandCompactDictionary()` |
| `data/book-vocabulary-manifest.json` | Dataset counts/lesson bounds | historical manifest version 0.016 |
| `sw.js` | Offline cache | shell cache `gestalt-v0.029`, network-first dictionary |
| `server/index.mjs` | Node server + Telegram bot | static serving, health/status, webhook, polling |
| `tests/smoke.mjs` | Content/UI regression checks | vocabulary integrity, DOM refs, card transform, SRS presence, cache/version checks |
| `tests/platform.mjs` | Platform/static checks | responsive CSS, safe areas, dictionary loading and SW invariants |
| `manifest.webmanifest` | PWA metadata | standalone display, icons |
| `VERSION` | human-readable version | `0.029` |
| `package.json` | scripts/engine | version 0.0.29, Node >=18 |

## Where to modify X
- Card visuals/rotation: `css/main.css` + `renderCard()`; high risk because the parent owns the flip and face transforms are deliberately constrained.
- Topic totals: `topics()` + `renderTopicSelectors()` → `#topicWordCount`; derived, never persisted.
- Persistence repair: `normalizeSave()`; use it as the only nested-save sanitization boundary.
- Answer/SRS: `answerWord()`, `pickSession()`, `intervalForQuality()`, `statusFromReview()`; high risk.
- Save/migration: `defaults()`, `normalizeSave()`, `loadSave()`, `persist()`; critical.
- Topic/category counts: `topics()`, `filterTopic()`, `setTopic()`, `updateCategoryCounts()`; medium/high risk.
- Vocabulary: both full and compact files; critical.
- Telegram sync: `cloudSave()`, `cloudLoad()`, `initTelegram()`, `server/index.mjs`; critical.

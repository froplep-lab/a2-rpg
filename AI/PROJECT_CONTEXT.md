# PROJECT CONTEXT — GESTALT v0.030

## Product
Premium/lightweight German vocabulary trainer for browser and Telegram Mini App. UI language is Ukrainian; target learning content is German with Ukrainian translations.

## Runtime stack
- Frontend: `index.html`, `css/main.css`, `js/app.js` (vanilla ES module).
- Backend: `server/index.mjs` using Node's built-in `http`, `fs`, `path`, `url` plus `fetch` for Telegram API.
- Offline: `sw.js` Service Worker + CacheStorage.
- Data: JSON vocabulary files.
- External dependency: Telegram Web App SDK loaded from `telegram.org`.
- Browser API: Web Speech API.

## Entry points
Browser: `/` → `index.html` → Telegram SDK script + `./js/app.js`.
Node server: `npm start` → `server/index.mjs` → HTTP server on `PORT` (default 8080).

## Boot sequence in actual code
`boot()` loads/normalizes local save → applies theme → builds navigation → binds DOM events → installs visibility persistence → initializes voices → creates an initial session/render → asynchronously loads compact dictionary with full-dictionary fallbacks → validates data → repairs missing topic selection → rebuilds session/render → initializes Telegram integration → registers Service Worker → requests persistent browser storage where supported.

## Primary screens
- Learn (`screen-learn`): topic selector, category status pills, flashcard, answer buttons, stats/collection subviews.
- Collections (`screen-collections`): search, topic filter, word list.
- Review (`screen-review`): due queue summary and explicit review start.
- Settings (`screen-settings`): audio, motion, theme, Telegram sync, export/import, reset.
- Add modal: user-created words stored in `save.customWords`.

## Content
Bundled dictionary: 954 words from lessons/topics 8–14. Existing manifest says lessons 8–14 totals are 119, 161, 156, 147, 135, 127, 109 respectively.

## Persistence
Primary browser key: `localStorage['gestalt_learning_v12']`. Legacy keys are migrated through `normalizeSave()`/`loadSave()`.
Telegram CloudStorage uses `gestalt_v12_` chunk keys and can read several older prefixes.

## Progression values
See `GAME_RULES.md` and `BALANCE.md` (root). Runtime constants are centralized in `BALANCE` in `js/app.js`.

## Release identity
Package/server/cache/root VERSION and `js/app.js` now all report `0.030`. This keeps dictionary query cache-busting and exported progress filenames aligned with the release identity.

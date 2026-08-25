# AI DEVELOPER OPERATING MANUAL — GESTALT v0.029

## 1. Read order
1. Read `00_READ_ME_FIRST.md`.
2. Read this file.
3. Read `PROJECT_CONTEXT.md` and the context map that matches the requested change.
4. Inspect the actual source files before editing.
5. Run the smallest relevant regression checks after editing.

## 2. Project identity
GESTALT is a lightweight, mobile-first German vocabulary trainer implemented as vanilla HTML/CSS/ES modules with a small Node HTTP server. The learner loop is flashcard recall → reveal → `Знаю` / `Не знаю` → SRS/XP/history/streak → persistence → next card.

## 3. Source-of-truth hierarchy
When knowledge conflicts, use:
1. Source code.
2. Observed runtime behavior / automated test evidence.
3. AI documentation.
4. Explicit assumptions.

Never treat this documentation as authority over code.

## 4. High-risk systems
- `js/app.js`: save normalization, SRS queue, answer transitions, Telegram CloudStorage, card rendering.
- `index.html` + relevant `css/main.css`: flashcard DOM/3D transforms and DOM ids consumed by JS.
- `data/words.json` / `data/words.compact.json`: canonical bundled vocabulary schema/content.
- `server/index.mjs`: Telegram Bot API, webhook/polling, static file serving.
- `sw.js`: offline/cache strategy.

## 5. Safe workflow
Understand request → locate feature → read context docs → inspect actual code → identify source of truth → impact analysis → minimal change → test → regression → update AI docs when behavior/architecture changes.

## 6. Never
- Rewrite architecture unnecessarily.
- Refactor unrelated code.
- Delete code because it looks unused.
- Create duplicate state or duplicate features.
- Change save/SRS schema casually.
- Assume docs are newer than code.
- Change the vocabulary structure without checking compact expansion and smoke tests.
- Change card transforms without checking reveal, front/back readability, swipe, keyboard and answer locking.

## 7. Existing commands
```bash
npm test
npm run check
npm run platform-check
npm run start
```
The project declares Node `>=18`; validation in this analysis used Node 22.16.0.

## 8. Change verification
For UI/card changes: run all three static suites and manually verify reveal/reverse/reveal, answer lock, sentence expansion, swipe and responsive layout.
For save/SRS changes: also exercise import/export, reload persistence and review queue behavior.
For Telegram changes: verify CloudStorage schema compatibility and both browser fallback and Telegram context.
For server changes: verify `/health`, `/api/telegram/status`, root static serving and intended webhook/polling path.

## 9. Known boundary
No browser automation dependency is included in the project. In the supplied environment, static tests and direct Node server HTTP checks were possible; full Chromium interaction was not independently executed.

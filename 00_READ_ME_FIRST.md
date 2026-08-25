# STOP — READ THIS FIRST BEFORE MODIFYING GESTALT

1. Read `AI/MASTER_INSTRUCTIONS.md`.
2. Read `AI/PROJECT_CONTEXT.md`.
3. Read the AI context files relevant to the requested feature.
4. Inspect the actual source code for that area.
5. Identify the source of truth and perform impact analysis.
6. Implement the minimum necessary change.
7. Test the changed behavior and run regressions.
8. Update AI documentation if behavior/architecture changed.

## Source-code priority
**Source code > runtime evidence > AI documentation > assumptions.**

## First places to look
- `js/app.js` — behavior, state, SRS, persistence, rendering, Telegram.
- `index.html` / `css/main.css` — UI and card transform contract.
- `data/words.json` / `data/words.compact.json` — vocabulary.
- `server/index.mjs` — server/Telegram bot.
- `sw.js` — offline/cache.
- `tests/` — regression contracts.

## Critical warning
Do not change save schema, SRS logic, Telegram CloudStorage format, vocabulary format, DOM ids or card transform semantics casually.

## Release identity note
The repository identifies itself as v0.029 in package/server/root VERSION/SW, but `js/app.js` currently declares v0.028. Treat this as a confirmed inconsistency until intentionally reconciled.

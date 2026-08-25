# TEST MAP / QA EVIDENCE

## Existing automated suites
### `npm test`
Current observed result: `SMOKE OK`.
Checks vocabulary integrity/count/order, DOM ids, old RPG removal, SRS presence, category counters, card flip CSS invariants, answer gating, dictionary loader, service worker assets/version and manifest consistency.

### `npm run check`
Current observed result: success.
Runs Node syntax checks on `js/app.js` and `server/index.mjs`.

### `npm run platform-check`
Current observed result: `PLATFORM STATIC CHECK OK`.
Checks viewport/safe-area CSS, mobile/desktop breakpoints, AbortController timeout, compact/full dictionary loading and Service Worker cache rules.

### `npm run state-check`
Current observed result: `STATE NORMALIZATION OK`. It exercises the actual `defaults()` / `normalizeSave()` source block against malformed nested persisted data.

## Direct runtime evidence
With a temporary free port and no Telegram credentials, the Node server successfully returned:
- `GET /health` → 200 with version 0.029, Telegram false, Mini App false.
- `GET /` → 200 with `index.html`.
- `GET /api/telegram/status` → 200 with version 0.029 and polling mode.

Port 8080 was already occupied by the execution environment, so the server was validated on an isolated port instead.

## Manual scenarios still recommended
1. Startup in normal browser.
2. Flip front → back; back → front repeatedly.
3. Ensure translation only appears on revealed face.
4. Expand/collapse sentence after reveal.
5. `Знаю` / `Не знаю` disabled before reveal.
6. Swipe left/right only after reveal.
7. Forgotten card reappears once in session.
8. Review screen contains only due cards.
9. Topic and category counters update together.
10. Export → reset → import.
11. Reload preserves progress.
12. Telegram Mini App safe-area/back button/cloud sync when actual Telegram context is available.
13. Speech synthesis on devices with/without German voices.
14. Offline reopen after Service Worker has cached shell.

## Stabilization evidence
- All three repository suites pass after the fixes.
- Chromium is installed, but browser navigation to the application is blocked by the execution environment, so full interactive app verification could not be completed here. This is tracked as `PARTIAL` in `AI/STABILITY_CHECKLIST.md`.
- A real server runtime check remains valid: `/health`, `/`, and `/api/telegram/status` respond on an isolated port without Telegram credentials.

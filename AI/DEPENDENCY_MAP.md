# DEPENDENCY MAP

## Runtime dependencies
The frontend has no npm runtime packages. The browser supplies DOM, localStorage, fetch, AbortController, SpeechSynthesis, FileReader, Blob, URL, Service Worker and CacheStorage APIs. Telegram supplies `window.Telegram.WebApp` when running as Mini App.

| Dependency | Version/source | Used by | Failure impact |
|---|---|---|---|
| Node.js | >=18 declared | server + scripts | server/tests cannot run |
| Telegram Web App SDK | external `https://telegram.org/js/telegram-web-app.js` | client Telegram integration | browser fallback still works; Mini App features unavailable |
| Web Speech API | browser API | `speak()` | audio unavailable only |
| CacheStorage/Service Worker | browser API | `sw.js` | offline behavior degraded |
| Telegram Bot API | external HTTPS API | `server/index.mjs` when `BOT_TOKEN` set | bot/webhook features unavailable |

## Internal dependency edges
- `index.html` → DOM ids → `js/app.js`.
- `js/app.js` → both dictionary files, localStorage, Telegram SDK, Speech API.
- `sw.js` → shell assets and both dictionary URLs.
- `server/index.mjs` → all static files + Telegram Bot API.
- Tests → source/html/css/data/server and detect missing/changed contracts.

## Hidden coupling
- DOM ids are hard-coded in `$()` calls.
- CSS selectors encode card transform semantics that JS expects to remain stable.
- `VERSION` in `app.js` is independently maintained from package/server/`VERSION`/SW.
- CloudStorage key prefix and chunking are part of remote persistence compatibility.
- Compact dictionary `fields` order is data/loader contract.

# STABILITY CHECKLIST — GESTALT

Evidence labels:
- **PASS** — directly verified by source/tests/runtime evidence.
- **FAIL** — verified broken.
- **PARTIAL** — some evidence exists, but a required verification layer could not be completed.
- **NOT TESTED** — no meaningful verification performed.
- **NOT APPLICABLE** — does not apply to this build.

| System | Status | Evidence |
|---|---|---|
| Startup / boot sequence | PASS | `npm test`, syntax checks, source flow audit |
| Navigation | PASS | DOM id/reference checks, source audit |
| Topic selection | PASS | source audit + smoke coverage |
| Topic total word count | PASS | derived from `topics()`/`mergedWords()`, DOM contract test |
| Category counters | PASS | smoke suite + source audit |
| Card rendering | PASS | smoke suite + DOM contract |
| Card flip transform | PARTIAL | transform invariants pass; Chromium interaction blocked by environment |
| Back translation orientation | PARTIAL | architecture fix verified statically; cross-browser visual result not independently captured |
| Answer gating | PASS | smoke suite + source audit |
| Answer / SRS mutation | PASS | source logic + smoke suite |
| Forgotten-card requeue | PASS | source logic audit |
| XP / streak / history | PASS | source logic audit + smoke suite |
| Progress / mastery | PASS | source logic audit + smoke suite |
| Review queue | PASS | source logic + smoke suite |
| Collections/search | PASS | DOM/event/reference audit |
| Add custom word | PASS | source flow + save schema audit |
| Export progress | PASS | source flow audit |
| Import progress | PARTIAL | normalization hardened; browser file round-trip not independently exercised |
| LocalStorage reload persistence | PARTIAL | persistence code audited; browser reload round-trip not independently exercised |
| Reset | PASS | source flow audit |
| Telegram CloudStorage | PARTIAL | compatibility/schema audit; real Telegram context unavailable |
| Speech synthesis | PARTIAL | source/error paths audited; platform voice behavior unavailable |
| Service Worker | PASS | `npm run platform-check` + source audit |
| Responsive CSS | PASS | `npm run platform-check` + breakpoint/safe-area checks |
| Long-word rendering | PASS | source fix + static CSS/JS checks |
| Audio/media | PARTIAL | error handling/source audited; platform media policy not independently exercised |
| Console errors in app browser | PARTIAL | no independent full app Chromium run possible |
| Server `/health` | PASS | direct HTTP runtime check on isolated port |
| Server `/api/telegram/status` | PASS | direct HTTP runtime check on isolated port |
| Static server serving | PASS | direct HTTP runtime check |
| Major regression suites | PASS | `npm test`, `npm run check`, `npm run platform-check` |

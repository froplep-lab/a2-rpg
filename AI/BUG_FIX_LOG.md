# BUG / FIX LOG — GESTALT STABILITY BASELINE

## Fix 2026-08-25 — Card flip readability / 3D stability
- **Bug:** Back face could render as visually reversed/mirrored during the flashcard flip in affected browser/compositor combinations.
- **Root Cause:** The face elements themselves created nested 3D transform contexts and had their own transform transition while the parent card also owned the flip.
- **Affected Files:** `css/main.css`, `index.html` (DOM contract unchanged; no new card layer introduced).
- **Fix:** The `.flashcard` remains the sole flipped element. Faces use `transform-style: flat`, keep `rotateY(0/180deg)`, retain `backface-visibility:hidden`, and no longer animate their own transform. Back-face pointer interaction is enabled only after reveal.
- **Why This Fix Is Correct:** It preserves the established single-parent flip contract while removing the unnecessary nested 3D context and competing transform animation.
- **Regression Risk:** Medium — card transform semantics are critical. No DOM ids or answer-state logic were changed.
- **Tests Performed:** `npm test`; `npm run check`; `npm run platform-check`; static transform invariant checks.
- **Result:** PASS for source/test invariants; Chromium interactive verification was blocked by the execution environment's browser navigation restriction, so cross-browser visual verification remains PARTIAL.

## Fix 2026-08-25 — Release version drift
- **Bug:** `js/app.js` declared `0.028` while package/server/root VERSION/Service Worker identified `0.029`.
- **Root Cause:** Documentation-only baseline preserved the source inconsistency instead of reconciling release identity.
- **Affected Files:** `js/app.js`.
- **Fix:** Set frontend `VERSION` to `0.029` so cache-busting/export naming matches the rest of the release.
- **Why This Fix Is Correct:** This is a consistency correction inside an already-established release identity; it does not alter save/SRS behavior.
- **Regression Risk:** Low/Medium — dictionary request query and exported filename change from `0.028` to the already-declared release `0.029`.
- **Tests Performed:** all three automated suites.
- **Result:** PASS.

## Fix 2026-08-25 — Long German words / translation overflow
- **Bug:** The card title used `white-space: nowrap` and could clip unusually long words; pre-existing `word-long`/`word-xlong` CSS classes were not assigned by rendering code.
- **Root Cause:** Presentation rules existed without the corresponding runtime class selection, leaving long content dependent on clipping.
- **Affected Files:** `js/app.js`, `css/main.css`.
- **Fix:** Rendering now assigns `word-long`/`word-xlong` by content length and the card title/translation allow safe wrapping with `overflow-wrap:anywhere`.
- **Why This Fix Is Correct:** It targets the actual content-fit failure and preserves normal short-word typography.
- **Regression Risk:** Low.
- **Tests Performed:** static DOM/CSS checks and all three automated suites.
- **Result:** PASS.

## Fix 2026-08-25 — Explicit topic word count
- **Bug:** Topic context could visually expose the category counters but did not show a dedicated total for the selected topic.
- **Root Cause:** Topic selector carried the count, but the inline topic header had no dedicated count field.
- **Affected Files:** `index.html`, `js/app.js`, `css/main.css`.
- **Fix:** Added `#topicWordCount`; `renderTopicSelectors()` derives its value directly from the active topic (or aggregate for `all`).
- **Why This Fix Is Correct:** The count is derived from the canonical merged dictionary and cannot drift into a second persisted state.
- **Regression Risk:** Low.
- **Tests Performed:** DOM/reference smoke checks plus all three automated suites.
- **Result:** PASS.

## Fix 2026-08-25 — Imported/corrupted save hardening
- **Bug:** `normalizeSave()` accepted object-shaped `mastery`, `review`, `history` values with weak structural validation, allowing malformed records to persist in memory.
- **Root Cause:** Numeric clamping existed at read sites, but malformed nested entries were not normalized centrally.
- **Affected Files:** `js/app.js`.
- **Fix:** Normalize nested persistence records into the established schema, clamp numeric ranges, validate status values, remove malformed entries, and de-duplicate favorites.
- **Why This Fix Is Correct:** `normalizeSave()` is the existing persistence normalization boundary and therefore the safest single source for import/legacy/reload repair.
- **Regression Risk:** Medium — existing learner data is normalized more strictly, but no persisted field names or SRS meaning were changed.
- **Tests Performed:** source syntax + automated suites; nested normalization logic reviewed against current save schema.
- **Result:** PASS for static regression; full browser storage round-trip remains PARTIAL because browser interaction could not be completed in this environment.

## 2026-08-25 — Autonomous browser/debug infrastructure

**Bug / improvement:** the project had no persistent browser-driven development loop.

**Root Cause:** only static Node tests existed; no permanent browser/CDP runner, runtime state bridge, deterministic browser fixture, screenshot capture, or console/network collection.

**Affected Files:** `tests/e2e/autonomous.mjs`, `tests/fixtures/long-card.json`, `tests/visual/README.md`, `js/app.js`, `package.json`, `AI/AUTONOMOUS_WORKFLOW.md`, `AI/TEST_MAP.md`, `AI/STABILITY_CHECKLIST.md`.

**Fix:** added a local-only development bridge and a zero-dependency Node/CDP browser harness that starts the app, interacts through real DOM paths, inspects runtime state, captures screenshots, checks console/network, and verifies persistence after reload.

**Regression Risk:** low; bridge is gated to loopback + `?debug=1` and is inactive in normal production browsing.

**Verification:** static regression suite PASS. Browser automation infrastructure is present, but this sandbox currently blocks Chromium local navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; the harness records this instead of masking it.

## 2026-08-25 — Card flip 3D architecture correction

**Bug:** flipped card back could remain visually mirrored.

**Root Cause:** the 3D transform was owned by the visual card shell itself, coupling layout/overflow with the flip transform and making the face transform context harder to reason about.

**Affected Files:** `index.html`, `css/main.css`, `js/app.js`.

**Fix:** introduced `#flashcardInner` as the sole 3D transform layer. The card shell is static; the inner track rotates 180 degrees; the back face retains its own 180-degree local orientation. The runtime debug inspector mathematically checks that the inner rotation multiplied by the back-face rotation resolves to an identity-facing orientation.

**Regression Risk:** medium on visual interaction, low on state/persistence.

**Verification:** static suite PASS; browser visual verification remains PARTIAL in the current sandbox because local Chromium navigation is blocked.

## 2026-08-25 — Card back text could remain mirrored in browser 3D compositing
- **Status:** SUPERSEDED by the canonical two-face implementation described in this entry.
- **Severity:** CRITICAL / core learning UI
- **Reproduction:** Open Learn → tap the flashcard → inspect the Ukrainian translation on the back face. In affected compositor/browser paths the transformed back text could appear mirrored/reversed or otherwise render incorrectly.
- **Root Cause:** The application rendered real text inside a transformed 3D back face. Even with the canonical 180° back-face transform, transformed text depended on browser 3D compositing behavior. The face also previously used scrolling overflow, which can flatten 3D descendants.
- **Affected Files:** `index.html`, `css/main.css`, `js/app.js`, `tests/smoke.mjs`, `tests/e2e/autonomous.mjs`.
- **Fix:** Replaced the previous overlay workaround with a canonical two-face 3D card. The real back content (`backGerman`, `backMeaning`, sentence and controls) is now inside `.flash-back`, which has `rotateY(180deg)` while the single `.flashcard-inner` track also rotates `180deg`. The effective back orientation is therefore readable rather than mirrored.
- **Why This Fix Is Correct:** It removes transformed text from the browser compositor path entirely while preserving the intended card flip animation. The runtime inspector now verifies `inner × back = identity`, meaning the 180° inner rotation plus the 180° local back-face rotation produces a readable final orientation.
- **Regression Risk:** Medium; DOM hierarchy for the back content changed, but all existing IDs remain unchanged and event handlers continue to target the same elements.
- **Tests:** `npm test`, `npm run state-check`, `npm run platform-check`, `node --check js/app.js`; browser harness updated to assert the back overlay is readable and matches the fixture translation.
- **Regression Status:** Static regression PASS. Full browser visual verification remains environment-limited when Chromium navigation is blocked by the sandbox policy; this is recorded by the E2E harness rather than hidden.

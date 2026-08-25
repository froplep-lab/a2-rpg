# RISK MAP

## CRITICAL
1. **Save schema / migration** — edits can invalidate existing learner progress or imports.
2. **SRS / `answerWord()`** — changes affect progression, due dates, XP, mastery, streak, history and session transitions.
3. **Flashcard DOM/3D transforms** — changes can reintroduce mirrored/backwards text or make answers appear before reveal.
4. **Telegram CloudStorage schema** — prefix/chunking/updatedAt rules are compatibility boundaries.
5. **Vocabulary schema/content** — both compact and full sources plus tests depend on consistency.

## HIGH
- Topic/category queue logic.
- Service Worker cache behavior/versioning.
- Telegram initialization order.
- DOM id contracts between HTML and JS.

## MEDIUM
- Speech settings and auto-speech timing.
- Statistics/derived counters.
- Responsive layout.
- User custom-word schema.

## LOW / SAFER
- Pure visual CSS values that preserve selectors and transforms.
- Text copy that does not change ids or behavior.
- Spacing/shadows/typography.

## Confirmed issues from source inspection
- **RESOLVED:** `js/app.js` now matches release identity `0.029`; automated suites pass after the correction.
- **RESOLVED:** flashcard face transform architecture was tightened to remove nested 3D contexts and face-level transform animation.
- **RESOLVED:** long-word content clipping path was addressed through runtime class selection and safe wrapping.
- **RESOLVED:** selected topic now exposes a derived total word count in the UI.
- **RESOLVED:** nested imported/legacy save records are centrally sanitized in `normalizeSave()`.
- **CONFIRMED:** the compact dictionary intentionally omits some richer object fields; `expandCompactDictionary()` reconstructs only the fields present in its `fields` list. Full `words.json` is the richer canonical object form.
- **POTENTIAL:** `validateDictionary()` performs presence/minimum-count validation but does not type-check every vocabulary field.
- **POTENTIAL:** no browser-level automated regression exists in the supplied project.
- **KNOWN LIMIT:** `server/index.mjs` uses environment credentials for Telegram features; missing credentials disable bot setup rather than browser learning.

## Autonomous test infrastructure risks

**Browser environment restriction:** some execution environments may block localhost navigation in Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`). This is a test-environment limitation, not proof of application failure. Preserve the failure artifact and rerun in an environment with local browser navigation enabled.

**Card flip:** high visual sensitivity. The flip must remain split between static card shell, `flashcard-inner` 3D rotation, and locally reversed back face. Do not reintroduce shell-level transform or a second independent face animation without regression testing.

- **RESOLVED:** actual Ukrainian/back content is no longer rendered inside a transformed 3D face; the back text uses a flat sibling overlay to eliminate mirrored-text compositor failures.

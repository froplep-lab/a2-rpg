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
- **CONFIRMED:** `js/app.js` declares version 0.028 while package/server/root VERSION/SW indicate 0.029.
- **CONFIRMED:** the compact dictionary intentionally omits some richer object fields; `expandCompactDictionary()` reconstructs only the fields present in its `fields` list. Full `words.json` is the richer canonical object form.
- **POTENTIAL:** `validateDictionary()` performs presence/minimum-count validation but does not type-check every vocabulary field.
- **POTENTIAL:** no browser-level automated regression exists in the supplied project.
- **KNOWN LIMIT:** `server/index.mjs` uses environment credentials for Telegram features; missing credentials disable bot setup rather than browser learning.

# STATE MAP

## Persistent `save`
Created by `defaults()` and normalized by `normalizeSave()`.

| Field | Source of truth | Persistence | Purpose |
|---|---|---|---|
| `version` | `SAVE_VERSION` | local + Telegram | save schema version |
| `xp` | `save.xp` | yes | progression |
| `streak`, `lastActivity`, `record` | `save` | yes | activity streak/high record |
| `answers`, `correct`, `errors` | `save` | yes | aggregate accuracy |
| `learnedToday`, `dayKey`, `history` | `save` | yes | daily/7-day progress |
| `dailyGoal` | `save.dailyGoal` | yes | daily target, clamped 8–40 |
| `mastery` | `save.mastery[wordKey]` | yes | canonical SRS box value (0–5) per word, mirrored from `save.review[wordKey].box` during normalization/answering |
| `review` | `save.review[wordKey]` | yes | SRS record/source for due status |
| `customWords` | `save.customWords` | yes | user-created vocabulary, max 500 after normalization |
| `favorites` | `save.favorites` | yes | favorite ids/keys |
| `settings` | `save.settings` | yes | theme/audio/motion preferences |
| `currentTopic` | save + transient mirror | yes | selected topic |
| `updatedAt` | `persist()` timestamp | yes | sync freshness |

## Transient `state`
`screen`, `subview`, `mode`, `session`, `sessionIndex`, `seen`, `flipped`, `answerLock`, `favorites`, `toastTimer`, `lastSpokenKey`, `transitionTimer`, `currentTopic`, `sessionRequeued`, `swipeStartX`, `swipeStartY`, `sentenceExpanded`.

### Important distinction
`state.currentTopic` is the UI/session copy; `save.currentTopic` is persisted. `state.session` is derived and disposable. Do not persist the session array.

## Review record
Stored at `save.review[wordKey]`: `box`, `reps`, `lapses`, `interval`, `status`, `dueAt`, `lastSeen`, `lastQuality`.

## Reset/load behavior
- Reload: `loadSave()` restores normalized save, then `boot()` recreates transient session.
- Date rollover: `normalizeSave()` resets `learnedToday` when `dayKey` is not today.
- Migration: legacy localStorage keys are read and normalized.
- Reset: settings UI calls the existing reset path in `bind()`; inspect that handler before changing behavior.

# FUNCTION INDEX — JS/APP

## Persistence/state
- `defaults()` — creates the persistent save schema defaults.
- `normalizeSave(input)` — merges defaults, clamps numeric/settings fields, limits arrays, migrates day state implicitly, and always writes current `SAVE_VERSION`.
- `loadSave()` — reads current localStorage key, then legacy keys, otherwise creates/persists defaults.
- `persist()` — updates timestamp, writes localStorage and schedules Telegram save.
- `scheduleTelegramSave()` — debounces CloudStorage writes for 900 ms.

## Vocabulary/session
- `mergedWords()` — overlays custom words on bundled words by `wordKey()`.
- `topics()` — derives topic metadata/counts from merged vocabulary.
- `filterTopic()` — filters by selected topic or returns all.
- `mastery()` — returns bounded mastery box.
- `due()` / `dueWords()` — determine review eligibility and order by due time.
- `pickSession()` — builds a 24-card max session; review mode is due-only, learn mode prioritizes due then new/learning.

## SRS/progression
- `intervalForQuality(q, box)` — maps answer quality to SRS interval.
- `statusFromReview(r)` — maps review record to `new`, `learning`, `review`, or `mastered`.
- `masteryPercent(r)` — maps box 0–6 to percentage.
- `answerWord(q)` — authoritative answer mutation path: review record, mastery, counters, streak, history, XP, persistence, requeue on forgotten, next-card transition.
- `touchActivity()` — updates daily streak.
- `levelFromXp()` — level curve from XP.

## UI/rendering
- `buildNav()`, `navigate()`, `setSubview()`, `setTopic()` — navigation/filtering.
- `renderTopicSelectors()`, `renderProgress()`, `renderCard()`, `updateCategoryCounts()`, `renderStats()`, `renderCollection()`, `renderReview()`, `renderSettings()` — UI projections.
- `renderAll()` — calls all major renderers.
- `toggleFlip()` — changes transient `state.flipped` and re-renders; answers remain locked until reveal.
- `toggleFavorite()` — persists favorites.
- `addWord()` — creates custom word records.

## Audio/Telegram
- `speak()` — Web Speech API de-DE speech.
- `maybeSpeakCurrent()` — optional delayed auto-speech with duplicate prevention.
- `refreshVoices()` — filters German voices.
- `tgLoadSdk()`, `applyTelegram()`, `cloudSave()`, `cloudLoad()`, `initTelegram()`, `syncTelegram()` — Telegram integration.

## Data/bootstrap
- `expandCompactDictionary()` — reconstructs object records from compact rows.
- `validateDictionary()` — rejects empty/obviously malformed dictionaries but does not perform full schema typing.
- `fetchJsonFast()` — fetches JSON with 10-second AbortController timeout.
- `loadWordData()` — compact-first, full fallback, then non-versioned fallbacks.
- `boot()` — application lifecycle root.

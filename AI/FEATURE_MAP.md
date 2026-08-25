# FEATURE MAP — ACTUAL SYSTEMS

| Feature | Entry/UI | Logic | Persistent state | Risk |
|---|---|---|---|---|
| Flashcard reveal | card wrapper / `flashcard` | `toggleFlip()`, `renderCard()` | no | CRITICAL |
| Remember/Forgot | two answer buttons, swipe | `answerWord()` | review/mastery/XP/history | CRITICAL |
| SRS review | Review screen | `dueWords()`, `pickSession()` | `review` | HIGH |
| Topics | two selects | `topics()`, `setTopic()` | `currentTopic` | HIGH |
| Category status | horizontal category pills | `setCategoryFilter()`, `updateCategoryCounts()` | derived from review | HIGH |
| Statistics | Learn → stats | `renderProgress()`, `renderStats()` | aggregates/history/mastery | MEDIUM |
| Collections | Collections screen | `renderCollection()` | favorites/customWords | MEDIUM |
| Add custom word | Add modal | `addWord()` | `customWords` | HIGH |
| Speech | card/audio/settings | `speak()`, `maybeSpeakCurrent()` | settings | MEDIUM |
| Telegram | Mini App context/settings | `initTelegram()`, CloudStorage funcs | CloudStorage copy | CRITICAL |
| Offline | transparent | `sw.js` | CacheStorage | HIGH |
| Import/export | Settings | `exportProgress()`, `importProgress()` | whole save object | CRITICAL |
| Theme/motion | Settings | `syncTheme()` + settings handlers | `settings` | LOW/MEDIUM |

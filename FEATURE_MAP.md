# FEATURE MAP — GESTALT v0.029

| Feature | Main code | State/data | UI | Risk |
|---|---|---|---|---|
| Flashcard | `renderCard`, `toggleFlip` | `flipped`, session | `flashcard` | CRITICAL |
| Answers | `answerWord` | review/mastery/history/xp | Remember/Forgot | CAUTION |
| SRS | `pickSession`, `dueWords`, `intervalForQuality` | review records | Review screen | CAUTION |
| Category counters | `updateCategoryCounts` | derived | category pills | CAUTION |
| Topics | `topics`, `filterTopic`, `setTopic` | currentTopic | select | CAUTION |
| Statistics | `renderStats`, `renderProgress` | history/mastery | charts | CAUTION |
| Collections | `renderCollection` | customWords/favorites | lists | CAUTION |
| Speech | `speak`, `maybeSpeakCurrent` | settings | audio controls | SAFE/CAUTION |
| Telegram | `initTelegram`, `cloudSave`, `cloudLoad` | CloudStorage | BackButton/settings | CRITICAL |
| Offline | `sw.js` | CacheStorage | transparent | CAUTION |
| Import/export | `exportProgress`, `importProgress` | save object | settings | CRITICAL |

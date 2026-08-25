# GESTALT AI Project Context — v0.029

## PROJECT IDENTITY
- Product: premium, lightweight German vocabulary trainer / Telegram Mini App.
- Platform: browser + Telegram Mini App; responsive desktop supported.
- Purpose: learn German vocabulary using flashcards, Ukrainian translation, pronunciation, examples and SRS.
- Bundled content: 954 words, lessons 8–14.
- Primary interaction: card → reveal → `Знаю` / `Не знаю`.

## CORE LOOP
OPEN APP → LOAD SAVE → LOAD DICTIONARY → TOPIC/CATEGORY → CARD → FLIP → TRANSLATION/EXAMPLE → ANSWER → SRS/XP/HISTORY/STREAK → PERSIST → NEXT CARD.

## SYSTEMS
- Vocabulary: `data/words.json`, `data/words.compact.json`, `js/app.js` loader/validator.
- Flashcards: `index.html` + `css/main.css` + `renderCard()`/`toggleFlip()` in `js/app.js`.
- SRS: `pickSession()`, `dueWords()`, `intervalForQuality()`, `statusFromReview()`, `answerWord()`.
- Persistence: `localStorage` (`gestalt_learning_v12`) + optional Telegram `CloudStorage`.
- Telegram: `js/app.js` SDK bridge + `server/index.mjs` Bot API/webhook/polling.
- Offline: `sw.js` shell cache + network-first dictionary.

## DATA MODEL
Word fields include id/german/ukrainian/grammar/emoji/hint/sentence/sentenceUa/level/category/source/topicId/topicNumber/topicTitle/sourcePage/frequency/phonetic/headword/pluralForm/singularOnly/translationNote.
Save fields include xp/streak/answers/correct/errors/learnedToday/dailyGoal/mastery/review/customWords/history/favorites/settings/currentTopic/updatedAt.
Review records include box/reps/lapses/interval/status/dueAt/lastSeen/lastQuality.

## STATE MODEL
`screen`, `subview`, `mode`, `session`, `sessionIndex`, `flipped`, `answerLock`, `sentenceExpanded`, and `activeCategoryFilter`.

## UI MODEL
Top bar; topic selector; category counters; flashcard; two answer buttons; stats; collections; review; settings; add-word modal; floating bottom navigation.

## ANIMATION SYSTEM
- Parent `.flashcard` is the only element that flips: 0° → 180°.
- `.flash-face` uses `backface-visibility:hidden`.
- Front face stays `rotateY(0deg)`.
- Back face stays `rotateY(180deg)` permanently.
- Never add `.flashcard.is-flipped` child counter-rotations: the supplied baseline caused mirrored text. v0.029 fixes this.

## AUDIO
Web Speech API, `de-DE`; auto-speak disabled by default; duplicate auto-speech avoided by word key.

## BALANCE
Centralized in `BALANCE` in `js/app.js`; numeric values are unchanged from v0.028. See `BALANCE.md`.

## DEPENDENCY MAP
```text
index.html → css/main.css + js/app.js
js/app.js → vocabulary + SRS + localStorage + Telegram SDK + SpeechSynthesis
server/index.mjs → static hosting + Telegram Bot API
sw.js → offline cache + dictionary network-first
```

# AI OPERATING CONTEXT
This is a dependency-light vanilla HTML/CSS/JS German vocabulary trainer. The card is the primary product surface. The most dangerous areas are save schema, SRS state, card 3D transforms, Telegram sync and vocabulary schema. Safest areas are visual CSS, copy, spacing and animation timing. Preserve the 954 bundled words and lessons 8–14, Telegram compatibility, and the removal of old dice/battle/RPG systems. Architecture changes must update this file, `ARCHITECTURE.md` and `CHANGELOG.md`.

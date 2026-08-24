# GESTALT — v0.013

Premium mobile-first German vocabulary trainer for PC, Android, iPhone and Telegram Mini Apps.

## Core
- Premium dark learning UI inspired by the provided reference.
- 24-card study sessions.
- Two-action review: **Запам'ятав / Забув**.
- Smooth 3D card flip to contextual example.
- German pronunciation with browser speech synthesis and voice selection.
- Ukrainian translation, grammar, phonetic guide, hints and example sentence.
- SRS intervals: 1 / 2 / 4 / 7 / 14 / 30 days.
- Mastery 0–5, streaks, daily history and progress statistics.
- Collections, search, favorites and custom words.
- The supplied **Kursbuch 8 — Am Wochenende** vocabulary is included as 123 clean study cards with emojis, natural German examples and Ukrainian translations. The merged runtime dictionary contains 400 unique word keys.
- Telegram Mini App safe-area, BackButton and CloudStorage sync.
- Offline cache and PWA manifest.

## Removed from the active product
Dice, battles, waves, RPG combat and game-mode UI are intentionally excluded from v0.013. The product foundation is vocabulary learning.

## Run
```bash
npm start
```
Open `http://localhost:8080`.

## Telegram
Set `BOT_TOKEN` and `MINI_APP_URL` in `.env` for the included server entry point.

## Validation
```bash
npm run check
npm test
```

## v0.013 improvements
- Corrected the full Kursbuch 8 vocabulary set to 123 clean study cards.
- Replaced placeholder and grammatically incorrect course example sentences with natural German examples and Ukrainian translations.
- Fixed SRS due logic so unseen words are not counted as overdue before their first review.
- Fixed local-date handling around midnight/time zones.
- Improved auto-pronunciation so a card is spoken once per appearance instead of repeatedly on every render.
- Fixed review-start navigation and added keyboard shortcuts on desktop (Enter/Space flip, Left=Forgot, Right=Remember).
- Added delayed Telegram save after progress changes to reduce lost progress without spamming CloudStorage.
- Improved Telegram theme/viewport callbacks and safe-area synchronization.

# GESTALT — v0.012

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
- The supplied **Kursbuch 8 — Am Wochenende** vocabulary has been appended and enriched with emojis and study examples.
- Telegram Mini App safe-area, BackButton and CloudStorage sync.
- Offline cache and PWA manifest.

## Removed from the active product
Dice, battles, waves, RPG combat and game-mode UI are intentionally excluded from v0.012. The product foundation is vocabulary learning.

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

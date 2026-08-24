# GESTALT — Deutsch RPG v0.008

Stable core build focused on the reference UI: Home, Words, Anki/SRS, Random Dice, Profile/Settings.

## Features
- PC + mobile responsive UI
- Telegram Mini App compatible (Telegram API optional)
- Offline-ready PWA cache
- 287 built-in German words + custom words
- SRS intervals: 1/2/4/7/14/30 days
- Mastery 0–5
- Random Dice 5x3 board, roll, merge, waves, boss waves, language power
- XP, level, coins, streak
- Export/import progress
- LocalStorage persistence and migration from common previous save keys

## Run
Open `index.html` through a local web server (recommended) or host the folder.

## Telegram
Use the hosted site as Telegram WebApp / Mini App. Telegram WebApp integration is optional; browser mode works without Telegram.

## QA
Static JS/JSON/path checks are required before packaging. Hardware iPhone/Android testing is not performed in this environment.

## Changelog
### v0.008
- Rebuilt conflicting UI/runtime into a single stable core.
- Removed legacy DOM dependencies from the active entrypoint.
- Added robust storage and old-save migration.
- Added working Words, SRS, Dice and Profile flows.
- Added safe-area mobile navigation and offline cache.

# GESTALT — Autonomous Development Context

## Product
GESTALT is a German-learning RPG / Random Dice-style Mini App. The product goal is a pleasant, long-term learning loop where German learning is gameplay: Learn → Recall → Use → Listen → Repeat → Master → Unlock. The target is A2→B1 with room for A1/B2/C1.

## Reference UX
Primary visual reference: dark premium fantasy interface, mobile-first, GESTALT brand, simple navigation, three primary actions (learning, SRS cards, Random Dice), profile/settings, RPG progression. Remove legacy UI that does not support this product direction.

## Platforms
Desktop browsers: Chrome, Edge, Firefox. Mobile: Android Chrome and iOS Safari. Telegram Mini App is a first-class target and must degrade gracefully to normal browser mode.

## Non-negotiables
1. Never lose saved progress.
2. Prefer migration over destructive changes.
3. Learning and gameplay stay connected.
4. Touch targets must be mobile-friendly.
5. Telegram APIs are optional at runtime; browser mode must still work.
6. No secrets in frontend.
7. Every build must pass syntax, JSON, path, server smoke, storage/SRS smoke and ZIP integrity checks.
8. Never claim physical iPhone/Android/Telegram hardware testing when it was not performed.

## Current core systems
- 287 German words in data/words.json
- SRS intervals: 1 / 2 / 4 / 7 / 14 / 30 days
- Mastery 0–5
- XP / level / coins / streak
- Random Dice 5×3 board with roll, merge, waves, bosses and language-powered attacks
- Telegram CloudStorage + DeviceStorage fallback
- localStorage fallback
- PWA/offline shell
- browser speech synthesis for German pronunciation

## Autonomous development loop
OPEN → INSPECT → IDENTIFY REGRESSIONS → PATCH → TEST → MOBILE/TELEGRAM COMPATIBILITY REVIEW → PACKAGE → CHANGELOG → RETURN ZIP.

Before each release, check:
- JS syntax
- server syntax
- JSON validity
- DOM IDs and handler targets
- no duplicate IDs
- no broken local asset paths
- service worker cache version
- manifest references
- SRS behavior
- local save migration
- Telegram CloudStorage get/set behavior
- Telegram BackButton / MainButton safety
- safe-area and viewport behavior
- server /health and static resources
- ZIP integrity

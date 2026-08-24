# GESTALT — Deutsch Quest / DE B1 RPG v0.005

## What changed
- Bugfix pass for storage persistence, spaced-repetition target selection, Dice wave lifecycle, stale quiz answers and XP/level rewards.
- New GESTALT visual shell inspired by the supplied reference: dark teal/forest fantasy + restrained gold UI.
- Responsive desktop 3-column layout and mobile bottom navigation.
- Learning dashboard with word statistics, streak, recommendation, quests and card-upgrade panel.
- Random Dice Arena retained and restyled to the new GESTALT identity.
- Existing vocabulary, RPG progression, mastery, spaced repetition, audio and inventory systems preserved.
- Existing save data remains in localStorage; no destructive migration was introduced.
- Legacy UI IDs are kept in a compatibility surface so older systems continue to function.

## Run
Open `index.html` in a modern browser. For best results use a local static server.

## Controls
Dashboard: word review and progression.
Cards: flashcard / Anki-style recall.
Dice: Roll → Spawn → Merge → Wave → Language Power.
Quests: daily progression.
Profile: hero and progress.
Settings: audio / theme / compatibility.

## QA
- Static JavaScript syntax checks performed on inline scripts and project JS modules.
- JSON validation performed for project data files.
- ZIP integrity verified.
- Real physical iPhone / Android hardware test was not performed.

## v0.005 bug fixes
- Migrated Dice and learning meta storage to v0.005 while preserving v0.002/v0.003 data.
- Fixed wrong-word mastery updates in the compact Language Battle.
- Fixed stale answer buttons after a timed-out Dice question.
- Added real base damage / game-over flow in Dice Arena.
- Added completed-run state so a finished 10-wave run cannot restart accidentally.
- XP and coins from Dice, review, quests and shop now persist through the legacy RPG save path.
- Fixed light-theme and reduced-motion toggles so they have visible effect.
- Fixed stale page/version labels.

## QA status
- All project JS files pass `node --check`.
- Inline JavaScript extracted from `index.html` passes `node --check`.
- `data/words.json` parses successfully.
- Import/export graph was checked and legacy modules were patched for missing exports.
- Chromium headless runtime smoke-test could not complete in the sandbox because the browser process hung; no claim of full browser/device QA is made.

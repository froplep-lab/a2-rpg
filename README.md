# GESTALT — Deutsch Quest / DE B1 RPG v0.004

## What changed
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

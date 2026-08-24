# GESTALT — Deutsch Quest / DE B1 RPG v0.006

## Update focus
- Rebuilt the visible product shell around the supplied GESTALT reference: 12 primary screens with the same information hierarchy and navigation concept.
- Removed the old visible tavern/legacy screen set from the product flow; legacy modules remain only as hidden compatibility/runtime support where needed.
- Added dedicated screens for Words, Anki/SRS, Random Dice, Card Upgrade, RPG Progress, Quests, Shop, Statistics, Worlds, Profile and Settings.
- Home is now a world-map style journey screen with landmark navigation to the core systems.
- Mobile-first bottom navigation and desktop left navigation mirror the reference information architecture.
- Added functional word search and session-persistent custom-word entry.
- Added functional Anki rating buttons connected to the existing mastery/SRS storage.
- Preserved the existing 287-word vocabulary, Dice Arena, RPG progression, audio, quests and local-save systems.
- Existing storage keys were not destructively reset.

## Run
Open `index.html` in a modern browser or serve the folder with a static HTTP server.

## QA
- All project JavaScript modules pass `node --check`.
- All inline JavaScript blocks pass `node --check`.
- `data/words.json` parses successfully (287 entries).
- HTTP static-server smoke check returned 200 for `index.html`.
- Chromium headless runtime still hangs in this sandbox, so no claim of full browser/device QA is made.

## v0.006 changelog
### Added
- Reference-aligned 12-screen GESTALT information architecture.
- Home world-map journey UI.
- Dedicated Words screen with add/search/collection.
- Dedicated Anki/SRS screen and four grading actions.
- Card upgrade, RPG progress, stats, worlds, profile and settings screens.

### Changed
- Removed the old tavern-style visible UI from the normal product path.
- Simplified navigation to the systems shown in the supplied reference.
- Restyled mobile navigation and desktop navigation to the same product hierarchy.

### Preserved
- Existing vocabulary and learning data.
- Dice Arena battle logic.
- Mastery and spaced repetition storage.
- Existing RPG rewards, quests and audio systems.

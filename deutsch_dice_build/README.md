# DEUTSCH QUEST — B1 RPG v0.003 · DICE ARENA

## Version
0.003 — Deutsch Dice Playtest Build

## Main update
This build turns the battle loop into a standalone 5×3 Random-Dice-inspired language RPG arena.

### Added
- 5×3 Dice Arena board
- Roll / Spawn / Merge loop
- 6 original language dice archetypes
- Dice levels up to 5
- Automatic enemy attacks and wave progression
- Boss waves every 5th wave
- 10-wave run
- Mana economy
- Language Power system
- Live German → Ukrainian recall during battle
- Mastery 0–5 integration with spaced review dates
- Daily battle progress integration
- XP / Coins rewards
- Best wave tracking
- Mobile-first responsive battle UI
- Local save for Dice Arena state
- Rules modal and quick reset

## Existing systems kept
Flashcards, quiz/exam, dictation, sentence builder, articles, verbs, dialogues, heroes, equipment, alchemy, trophies, audio, quests, achievements and the existing vocabulary remain in the project.

## How to run
Open `index.html` in a modern browser. For reliable service-worker/PWA behavior, use a local static server.

Example:
`python -m http.server 8080`

Then open:
`http://localhost:8080/`

## Controls
- Dice Arena → ROLL creates a random die.
- Select two equal dice of the same level → MERGE.
- AUTO MERGE merges available pairs.
- START WAVE begins automatic combat.
- Answer the language question correctly to charge Language Power and increase mastery.

## Debug / Playtest
The project retains the existing Playtest/debug-oriented utilities. Dice Arena state can be reset with the `Скинути бій` button.

## Storage
Legacy project storage remains intact. New Dice Arena data is stored separately under:
- `deutsch_dice_v003`
- Existing `deutsch_quest_v002_meta` is not deleted.

## Known limitations
- Real iPhone/Android hardware testing was not performed in this environment.
- Dice Arena currently uses the project's existing browser audio engine and vocabulary; no new external audio assets were added.
- Browser localStorage is required for persistent Dice Arena progress; the old application remains available if localStorage is unavailable.

## Architecture
The new arena is implemented as an additive module inside the existing app shell to preserve the stable baseline. The data-driven vocabulary still comes from `data/words.json`.

## Changelog
### v0.003
Added: full 5×3 Dice Arena, roll/spawn/merge, 6 dice archetypes, waves, bosses, mana, language-powered attacks, mastery/review updates, XP/coins rewards, mobile UI, local save.

Improved: battle/gameplay now connects learning directly to combat instead of treating learning and game as separate screens.

Preserved: existing cards, heroes, quests, exams, dictionary/trophies, audio and vocabulary systems.

# GESTALT DE B1 RPG — v0.007

## Update
Stability + PC/mobile compatibility pass over v0.006.

### Fixed
- Added the real modular app entry point (`js/app.js`) so learning, quests, audio, profiles, achievements and legacy systems are initialized consistently.
- Fixed missing DOM targets that could stop the dashboard sync function.
- Fixed mobile safe-area CSS; replaced undefined custom variables with `env(safe-area-inset-*)`.
- Fixed duplicate legacy DOM ids in compatibility surface.
- Added offline cache entries for all JavaScript modules.
- Persisted Light/Dark theme and Reduced Motion settings.
- Prevented duplicate custom-word insertion.
- Improved touch target sizes and mobile input sizing.

### Core systems kept
- Vocabulary / A2→B1 learning loop
- Anki / SRS
- Random Dice 5×3
- RPG progression
- Quests / achievements
- Worlds / profile / settings
- Audio / speech synthesis

## Run
Best: serve the folder over HTTP (for example `python -m http.server 8080`) and open `http://localhost:8080/`.
The project also keeps a graceful inline fallback vocabulary so the landing UI can still render when `fetch()` is unavailable.

## QA
- JS syntax checks
- JSON validation
- DOM id/reference audit
- local HTTP smoke test
- ZIP integrity

## Known limitation
No physical iPhone/Android hardware test was performed in this environment.

# GESTALT Changelog

## v0.010 — Telegram-first stability + learning quality
- Fixed Telegram CloudStorage `getItems` handling (Telegram returns a key/value object).
- Added Telegram SDK dynamic loading with browser fallback and timeout.
- Added Telegram MainButton integration for Anki and Dice.
- Added Telegram confirmation dialogs with browser fallback.
- Improved theme mapping to Telegram theme parameters.
- Added safer CloudStorage synchronization lock.
- Reworked SRS review boxes using 1/2/4/7/14/30 day intervals.
- Added learning-aware word selection for Anki and battle questions.
- Added German speech button using browser SpeechSynthesis.
- Hardened service-worker cache and offline behavior.
- Upgraded bot server to support polling or webhook mode.
- Added webhook secret validation and Telegram status endpoint.
- Added autonomous development context.

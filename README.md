# GESTALT — Deutsch RPG v0.010

Telegram-first stability build for PC, mobile browsers, PWA and Telegram Mini App.

## Product loop
**Learn → Recall → Listen → Answer → Master → Reward → Dice → Progress → Return**

The game is designed around the rule **language = gameplay**. German words drive the SRS loop and also power the Random Dice battle.

## Main screens
- Головна
- Вивчення слів
- Картки Anki / SRS
- Random Dice
- Профіль / налаштування

## v0.010 changes
- Fixed Telegram CloudStorage `getItems` handling: values are read from the returned key/value object.
- Added guarded CloudStorage sync to avoid overlapping writes.
- Added automatic Telegram SDK loading with timeout and normal-browser fallback.
- Added Telegram MainButton integration for Anki and Dice where supported.
- Added Telegram-native confirmation dialogs with browser fallback.
- Added Telegram theme parameter mapping into the app theme variables.
- Added SRS boxes: **1 / 2 / 4 / 7 / 14 / 30 days** with quality-based progression.
- Added learning-aware word selection so due / low-mastery words are favored.
- Added German pronunciation button using browser SpeechSynthesis.
- Hardened service-worker cache/versioning and offline fallback.
- Added optional Telegram bot backend with polling **or webhook** mode.
- Added webhook secret validation and `/api/telegram/status`.
- Added autonomous development context and release checklist.

## Telegram deployment
1. Deploy the app on a public **HTTPS** URL.
2. In @BotFather configure the bot's Main Mini App URL to that HTTPS URL.
3. Copy `.env.example` to `.env`.
4. Set `BOT_TOKEN` and `MINI_APP_URL`.
5. For webhook production mode, set `WEBHOOK_URL=https://your-bot-server.example` and a strong `WEBHOOK_SECRET`.
6. Run `npm start`.

The bot token is used only by `server/index.mjs` and is never included in frontend assets. Telegram Mini Apps run inside Telegram's WebView and can also use CloudStorage/DeviceStorage where supported.

## Local browser test
```bash
npm test
npm run check
npm start
```

Then open `http://127.0.0.1:8080/`.

## Vocabulary
The current build contains **287** base German words in `data/words.json`. User-created words are stored separately in player progress.

## Storage
- Browser: localStorage
- Telegram: CloudStorage when available
- Telegram fallback: DeviceStorage when available
- Import/export: JSON backup

The save format is versioned and migrated rather than blindly discarded.

## QA
Automated checks cover:
- JS syntax
- server syntax
- JSON parse
- DOM ID/reference audit
- local asset/path audit
- service-worker asset audit
- SRS core logic
- Telegram CloudStorage object-map parsing
- HTTP smoke tests
- ZIP integrity

Real physical iOS/Android and the real Telegram client still require on-device testing after deployment.

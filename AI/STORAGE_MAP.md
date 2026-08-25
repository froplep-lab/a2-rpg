# STORAGE / PERSISTENCE MAP

## Browser
### LocalStorage
- Current key: `gestalt_learning_v12`.
- Legacy keys: `gestalt_learning_v9` through `v4`, plus `de_b1_rpg_progress_v3`, `deutsch_quest_v002`.
- Save is JSON serialized by `persist()`.
- `normalizeSave()` clamps/sanitizes and injects the current save version.

### Browser file backup
Settings → export creates `gestalt-progress-v${VERSION}.json` from current in-memory `save`. Import parses a JSON file and normalizes it before persistence.

## Telegram CloudStorage
Prefix: `gestalt_v12_`.
- `${prefix}count` stores chunk count.
- `${prefix}0` ... `${prefix}N` store 2400-character string chunks.
- `cloudLoad()` also checks older prefixes `v10`–`v7`.
- `initTelegram()` chooses remote save only when `remote.updatedAt > local.updatedAt`.

## Service Worker CacheStorage
Cache: `gestalt-v0.029`.
- Shell assets are individually cached during install; failure of one shell asset does not abort installation.
- Vocabulary is network-first with cache fallback.
- Other GETs are cache-first-ish with network fill and `index.html` fallback.

## Migration / reset
Local save migration is normalization-based, not an explicit version-by-version transformation map. The save version is overwritten with `SAVE_VERSION` during normalization.

## Risks
Any change to save fields, key names, CloudStorage prefix/chunk format, or import/export representation is compatibility-sensitive.

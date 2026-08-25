# KNOWN ISSUES — GESTALT v0.031

## CRITICAL
- Node smoke tests cannot replace full real-browser interaction testing across engines/devices.
- Save and Telegram CloudStorage schemas are compatibility boundaries.

## HIGH
- Production Telegram setup requires correct HTTPS `MINI_APP_URL` and intended webhook/polling configuration.
- SpeechSynthesis varies by browser/device.

## MEDIUM
- `js/app.js` remains a single large module; future refactors should be incremental.
- `sentenceUa()` has a fallback path; canonical book data should remain complete.

## LOW
- No external database; persistence is localStorage + optional Telegram CloudStorage.
- Manifest source version `0.016` is historical metadata, not runtime version.

## Fixed in v0.030
- Mirrored card back after flip. Cause: child back-face transform was reset to 0° while parent rotated 180°, producing mirrored revealed content. Back now remains at 180° and only the parent rotates.

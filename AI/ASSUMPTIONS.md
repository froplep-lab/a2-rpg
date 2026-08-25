# ASSUMPTIONS / EVIDENCE STATUS

## CONFIRMED by source
- Frontend is vanilla HTML/CSS/ES module.
- Node server uses built-in modules.
- Dictionary contains exactly 954 records.
- Lessons/topics are 8–14.
- Browser persistence is localStorage key `gestalt_learning_v12`.
- Telegram CloudStorage prefix is `gestalt_v12_` with 2400-character chunks.
- SRS ladder and XP values are defined in `BALANCE`.
- Card answers require reveal.
- Card flip is parent-only in current CSS.
- Service Worker cache is `gestalt-v0.029`.
- Existing automated tests pass in this environment.
- Server root/health/API status endpoints work without Telegram credentials.

## CONFIRMED discrepancy
- `js/app.js` uses `VERSION='0.028'` while the project release identity elsewhere is 0.029.

## LIKELY / needs targeted verification
- Exact visual rendering across all browser engines/devices.
- Exact SpeechSynthesis voice availability by platform.
- Telegram CloudStorage size/latency behavior in production.
- Service Worker behavior across Telegram's embedded webview versions.

## UNKNOWN from supplied evidence
- Real-world Telegram production configuration, domain/TLS, bot token, webhook endpoint and user scale.
- Whether every vocabulary sentence is pedagogically ideal beyond the static dataset checks.
- Whether any file is truly dead code beyond what static references demonstrate.

## Non-assumptions
Documentation deliberately does not declare a file unused merely because no static import was found, and it does not infer architecture rules not supported by code.

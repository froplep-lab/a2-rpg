# GESTALT v0.024

## v0.024 — card translation / example stability
- Ukrainian word translation is now shown on the back face, centered as the primary answer.
- Removed the Ukrainian translation from the front face so the card remains a real recall check.
- Added an optional collapsed example section; the German example and Ukrainian sentence translation are hidden until opened.
- Added `translationNote` to the vocabulary schema for precise explanations, clarifications, gender/context notes, and ambiguity handling where needed.
- Corrected a set of clearly broken/ambiguous Ukrainian glossary entries and example sentence inflections.
- Fixed `das Stadtzentrum → Stadtzentren`.
- Kept the existing SRS, Telegram Mini App, speech, navigation, collections and statistics architecture unchanged.

## Cards
- Clean single-line word rendering for long German vocabulary.
- Separate plural badge.
- IPA pronunciation field.
- Optional transcription visibility.
- A2-oriented context examples.

## Compatibility
- Existing localStorage migration keys remain supported.
- Telegram CloudStorage keeps compatibility with previous prefixes.
- Existing Telegram Mini App integration, speech synthesis, import/export and navigation are retained.
## v0.024
- Домашній екран очищено від щоденного блоку статистики; детальний прогрес залишається у «Статистика».
- Відповідь «Знаю / Не знаю» доступна лише після перевертання картки.
- Граматичні маркери `(Sg.)` та службові позначення множини відокремлені від learner-facing слова.
- Додано нормалізовані `headword`, `pluralForm`, `singularOnly` для словника.
- Транскрипція словника перегенерована через eSpeak German IPA mode 2 з чистої лексичної форми.
- Озвучка слова також використовує очищену лексичну форму без артикля та `(sich)`.
- Поліпшена мобільна висота картки, горизонтальний список категорій та візуальний стан disabled для кнопок.
## v0.024 — stability / data integrity
- Fixed SRS session selection being overwritten by a late category-filter patch.
- Fixed swipe answers being possible before card reveal.
- Removed dictionary notation such as `(Sg.)` and plural markers from the display `german` field.
- Corrected marker-driven plural reconstruction, including `Rathaus → Rathäuser`.
- Normalized learner-facing IPA output to conventional German symbols instead of eSpeak implementation glyphs.
- Kept category filtering inside the existing session logic rather than replacing it.
- Added smoke-test coverage for these regressions.


## v0.026 — Stability / loading
- Optimized dictionary delivery with compact 364 KB payload (from ~841 KB JSON).
- Added compact dictionary loader with full JSON fallback.
- Added 10-second timeout and multi-source retry for dictionary loading.
- Service Worker no longer blocks installation on dictionary pre-cache failure.
- Dictionary requests use network-first with cache fallback.
- Disabled immutable HTTP caching for HTML/JS/CSS/JSON/WebManifest so Telegram/mobile clients can receive fixes promptly.

## v0.027 — Critical UI regression fix

- Restored category counters for the active topic (`Усі`, `Нові`, `У процесі`, `Повторення`, `Вивчені`).
- Fixed missing `updateCategoryCounts()` runtime function that stopped rendering after the dictionary loaded.
- Restored flashcard 3D rotation by removing the `transform:none` override and applying `rotateY(180deg)` on `.flashcard.is-flipped`.
- Kept sentence example collapsed by default and translation on the back side.

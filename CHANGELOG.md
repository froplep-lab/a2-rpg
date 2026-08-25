# GESTALT v0.022

## Learning
- Real spaced repetition progression with explicit memory boxes.
- Forgot answers create a short 10-minute retry and requeue the card.
- Learned answers increase the next interval progressively.

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
## v0.022
- Домашній екран очищено від щоденного блоку статистики; детальний прогрес залишається у «Статистика».
- Відповідь «Знаю / Не знаю» доступна лише після перевертання картки.
- Граматичні маркери `(Sg.)` та службові позначення множини відокремлені від learner-facing слова.
- Додано нормалізовані `headword`, `pluralForm`, `singularOnly` для словника.
- Транскрипція словника перегенерована через eSpeak German IPA mode 2 з чистої лексичної форми.
- Озвучка слова також використовує очищену лексичну форму без артикля та `(sich)`.
- Поліпшена мобільна висота картки, горизонтальний список категорій та візуальний стан disabled для кнопок.

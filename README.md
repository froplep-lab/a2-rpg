# GESTALT v0.015

Premium mobile-first German vocabulary trainer.

## Тема 8 — Am Wochenende
Уся лексика, яку користувач надав у цьому етапі, збережена окремою темою `topic-8`. Нові теми можна додавати надалі без змішування з Тема 8.

## Основний цикл
Картка → озвучка → приклад → Запам’ятав / Забув → SRS → наступна картка.

## Запуск
```bash
npm install
npm test
npm run check
npm run start
```

Для Telegram Mini App використовуйте HTTPS URL та server/.env з BOT_TOKEN і MINI_APP_URL.


## v0.015
Stability update: corrected review-only sessions, polite audio behavior, forgotten-card requeue, Telegram conflict resolution with `updatedAt`, collection speech button, and a reliable smoke-test working directory.

## v0.016 — Book-first vocabulary
The bundled vocabulary is sourced only from the uploaded `Schritte plus Neu 3+4` glossary, starting at lesson 8 (`Am Wochenende`) and continuing through lesson 14 to the end of the PDF. Each card has an emoji and lesson topic metadata.

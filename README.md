# GESTALT — Deutsch Learning v0.011

Telegram-first, mobile-first застосунок для приємного вивчення німецьких слів.

## Основа продукту
**Картка → Спроба згадати → Переклад → Приклад → Озвучка → SRS → Повторення**

Ця версія навмисно очищена від бойових, Dice, RPG та інших ігрових систем. Фокус — якість навчання.

## Основні можливості
- 287 базових німецьких слів A2/B1.
- Власні слова користувача.
- SRS: 1 / 2 / 4 / 7 / 14 / 30 днів.
- Чотири оцінки: Не знаю / Складно / Добре / Легко.
- Німецька озвучка слова та прикладу через SpeechSynthesis.
- Вибір німецького голосу та швидкості.
- Автоматична озвучка після відкриття картки.
- Пошук словника.
- Mastery 0–5.
- XP, streak, щоденна ціль.
- Export / Import прогресу.
- localStorage + Telegram CloudStorage fallback.
- PWA / offline cache.
- Telegram Mini App: BackButton, MainButton, safe-area, theme, haptic feedback.

## Видалено
У цій версії більше немає:
- Random Dice.
- Battle / waves / enemies / boss.
- RPG combat / mana / power / board.
- Ігрових нагород, пов'язаних із боєм.
- UI-механік, які відволікають від навчання.

## Telegram
1. Розгорни застосунок на публічному HTTPS.
2. Вкажи `MINI_APP_URL` у `.env`.
3. Вкажи `BOT_TOKEN` тільки на сервері.
4. Для production webhook можна використати `WEBHOOK_URL` та `WEBHOOK_SECRET`.

## Локальний запуск
```bash
npm test
npm run check
npm start
```

Відкрити `http://127.0.0.1:8080/`.

## QA
Automated checks покривають:
- JS syntax.
- server syntax.
- JSON parse.
- DOM references.
- local paths.
- service-worker assets.
- SRS / storage sanity.
- HTTP smoke test.

Реальний iPhone/Android та фізичний Telegram-клієнт потребують on-device перевірки після розгортання.

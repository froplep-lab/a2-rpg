# Deutsch Quest — B1 RPG v0.001

Це велика playtest-база перед наступним апдейтом.

## Що всередині
- 287 словникових карток A2/B1 з німецьким словом, українським перекладом, граматикою, прикладом, emoji, темою та rarity.
- Flashcards + озвучка німецькою.
- Leitner / spaced repetition.
- Quiz, dictation, articles, verbs, sentence builder, dialogues.
- Boss / RPG mechanics, quests, achievements, heroes, XP, streak.
- Memory match та Speed Rush.
- Telegram WebApp bridge.
- Новий responsive shell для iPhone / Android / tablet / desktop.
- Нижня mobile navigation.
- PWA manifest + service worker для web-app/offline shell.
- Playtest Center для швидкої перевірки основних підсистем перед релізом.
- Safe-area підтримка iOS, reduced-motion, touch-friendly controls, desktop wide layout.

## Запуск
Рекомендовано через VS Code Live Server або будь-який локальний HTTP server:

```bash
python -m http.server 8080
```

Потім відкрити `http://localhost:8080`.

## Playtest
На головному екрані є **PLAYTEST CENTER**. Він перевіряє:
- vocabulary database
- localStorage
- speech synthesis
- Web Audio
- responsive viewport
- touch support
- Telegram WebApp availability

## Важливо
Сервіс-воркер працює тільки через HTTP(S), не через `file://`.

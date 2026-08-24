# Deutsch Quest — B1 RPG v0.002

Великий playtest update поверх **v0.001 baseline**. Старий проєкт збережений, а найсильніший UI/gameplay shell з окремого `index.html` інтегрований у новий build.

## Що додано в v0.002
- **Command Center / Dashboard** як новий центр гри.
- Daily Expedition: 3 щоденні цілі — перегляд слів, Language Battle, правильні recall.
- **Language Battle**: 5 хвиль, 5×3 tactical board-візуалізація, питання по словнику, damage через правильні відповіді та нагороди XP/Coins.
- **Mastery Forge**: 0–5 mastery для кожного слова + due review.
- Spaced-repetition intervals: 1 / 2 / 4 / 7 / 14 / 30 днів.
- Daily streak і weekly XP / battle / recall tracking.
- Рекомендація слова для наступного тренування.
- Mobile-first responsive dashboard, reduced-motion fallback.
- Версія піднята до **v0.002**.
- Старі modular JS/CSS/data системи v0.001 залишені в архіві проєкту та не видалені.

## Збережено з baseline
- 287 словникових карток.
- Flashcards + native/browser speech.
- Quiz, dictation, articles, verbs, sentence builder, dialogues.
- Heroes, equipment, storage, alchemy/cube, trophies, chests, rarity.
- RPG XP/levels/coins, quests, achievements, battle-related systems.
- Telegram bridge, PWA manifest, service worker.
- Existing localStorage keys та старий прогрес; нова v0.002 мета-структура зберігається окремим ключем.

## Запуск
Рекомендовано через HTTP server:

```bash
python -m http.server 8080
```

Потім відкрити `http://localhost:8080`.

## Controls
- Touch / mouse: усі основні кнопки.
- Dashboard → **Language Battle** для нового бойового циклу.
- Flashcard → tap/click для перевороту.
- Audio → кнопки pronunciation / music.
- Старі вкладки: Пергаменти, Випробування, Герой, Алхімія, Трофеї.

## Playtest
Перевіряти:
- dashboard rendering
- daily streak / daily missions
- mastery + review timestamps
- Language Battle: 5 waves, damage, XP/Coins
- localStorage persistence
- speech/audio fallback
- responsive layout

## Architecture
- `index.html` — integrated game shell + v0.002 Command Center.
- `data/words.json` — baseline vocabulary.
- `js/` — modular baseline systems retained for continued expansion.
- `css/` — baseline styling/animations retained.
- `sw.js` — PWA cache.
- `manifest.webmanifest` — PWA metadata.

## Changelog

### v0.002
**Added**
- Command Center
- Daily Expedition
- Language Battle
- Mastery Forge
- spaced review scheduling
- weekly progression

**Improved**
- visual hierarchy
- mobile dashboard
- learning ↔ gameplay connection

**Preserved**
- v0.001 vocabulary and existing systems

**Known limitations**
- Real iPhone/Android hardware test was not performed in this environment.
- Browser SpeechSynthesis quality depends on the installed German voice.
- The new battle board is a lightweight playtest mechanic, not yet the full 5×3 summon/merge PvE system.

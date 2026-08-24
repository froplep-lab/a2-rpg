# Random Deutsch Kards — Final

A polished, self-contained Vite + Phaser Telegram Mini App prototype focused on the core learning/game loop:

- Dashboard with level, XP, coins, streak and daily bounties
- Word Trial with 5 multiple-choice questions
- German pronunciation via browser SpeechSynthesis
- Card collection with rarity, level and mastery
- Phaser tower-defense battle: 3 waves, enemies, units and Heart HP
- Victory/defeat rewards
- Local persistence with migration-safe save data
- Sound toggle and progress reset
- Telegram WebApp initialization + haptics
- Responsive mobile-first UI

## Run

```bash
npm install
npm run dev
```

Then open the Vite URL. For a production package:

```bash
npm run build
```

The project is intentionally kept simple: `index.html` is only the shell, while gameplay/data/state live in `src/` and `data/`.

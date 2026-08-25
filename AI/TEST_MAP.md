# Test Map

## Static regression

| Command | Scope | Evidence |
|---|---|---|
| `npm test` | vocabulary, DOM IDs, SRS/card invariants, release markers | terminal output |
| `npm run state-check` | malformed save normalization | terminal output |
| `npm run platform-check` | platform/server assumptions | terminal output |
| `npm run check` | JS syntax | Node exit code |
| `npm run test:regression` | aggregate static baseline | all above |

## Autonomous browser regression

`npm run test:e2e` uses `tests/e2e/autonomous.mjs` and `tests/fixtures/long-card.json`.

Flow:

```text
start server
→ attach Chromium/CDP
→ enable Runtime + Network + Page
→ navigate to localhost debug mode
→ load deterministic fixture
→ verify topic count
→ capture startup screenshot
→ click card through real DOM path
→ verify flip state / translation / orientation invariant
→ capture back screenshot
→ click "Знаю"
→ verify answer/progression state
→ inspect saved state
→ reload application
→ verify persisted XP/state
→ check desktop layout
→ check mobile layout
→ capture mobile screenshot
```

## Failure artifacts

`tests/artifacts/e2e-result.json` is always written when the harness can start. On successful browser runs it is accompanied by screenshots. On environment failures it includes the browser/runtime diagnostics that were available.

## Visual evidence

`tests/visual/README.md` documents the screenshot artifacts. Future AI sessions should inspect the corresponding screenshot when a visual assertion fails, especially for the flashcard front/back and mobile layout.

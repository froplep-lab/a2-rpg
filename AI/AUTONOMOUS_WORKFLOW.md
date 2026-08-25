# Autonomous AI Development Workflow

## Purpose

This project contains a permanent local development bridge and browser harness so a future AI can repeatedly run, observe, diagnose, fix, and regression-test the application instead of relying only on static source inspection.

## Entry sequence

1. Read `00_READ_ME_FIRST.md` and the relevant `AI/*.md` context.
2. Run `npm run test:regression` for static/safe baseline checks.
3. Run `npm run test:e2e` for real browser interaction where Chromium local navigation is permitted.
4. Inspect `tests/artifacts/e2e-result.json` after every browser run.
5. Inspect `tests/artifacts/startup.png`, `card-back.png`, and `mobile.png` on visual failures.
6. Reproduce the reported failure using the same user path before editing code.
7. Use the development bridge only for deterministic setup/state inspection; prefer real clicks and real application logic for behavior tests.
8. Make the smallest root-cause fix.
9. Re-run the targeted scenario, then `npm run test:regression`.
10. Update `AI/BUG_FIX_LOG.md`, `AI/STABILITY_CHECKLIST.md`, and affected context files when behavior or architecture changes.

## Browser harness

`tests/e2e/autonomous.mjs` starts a free local port, launches the Node server, launches Chromium with CDP, enables Runtime/Network/Page domains, performs DOM interactions, reads runtime state, captures screenshots, and checks persistence after reload.

The harness captures:

- JavaScript console errors/warnings;
- uncaught exceptions;
- failed network requests and HTTP >= 400 responses;
- runtime state before/after actions;
- desktop and mobile layout measurements;
- screenshot artifacts;
- server and Chromium diagnostics.

A test cannot report PASS when captured runtime errors or non-cancelled network failures remain.

## Development bridge

The app exposes `window.__GESTALT_DEV__` only when both conditions are true:

- the URL contains `?debug=1`;
- the page is served from localhost/loopback.

Available operations are intentionally limited to development use:

- `getState()` — read normalized runtime state;
- `getSave()` — inspect persisted application state;
- `getCurrentWord()` — inspect the active card;
- `getComputedCard()` — inspect the card/inner/front/back transforms and verify that the back-face transform combines to an identity orientation;
- `flip()` / `unflip()` — controlled card setup;
- `answer(quality)` — exercise answer logic in a controlled test;
- `setSave(data)` — deterministic fixture setup through the real normalization/persistence pathway;
- `setTopic(id)` — deterministic topic setup;
- `reset()` / `reload()` — clean-state control.

Production users cannot activate the bridge merely by adding the debug query unless the page is being served from loopback.

## Deterministic fixture

`tests/fixtures/long-card.json` is the permanent regression fixture for:

- very long German words;
- long Ukrainian translations;
- German special characters;
- custom-word topic isolation;
- card flip layout;
- persistence after answering/reload.

## Commands

```text
npm run test             # static smoke suite
npm run state-check      # save/state normalization suite
npm run platform-check   # platform constraints
npm run check            # JavaScript syntax
npm run test:regression  # all non-browser regression checks
npm run test:e2e         # autonomous Chromium/CDP run
npm run test:visual      # browser visual/artifact run
npm run test:all         # regression + browser
```

## Failure interpretation

`PASS` means the corresponding check was actually executed and met its assertions.

`FAIL` means the check executed and detected a defect or environment failure.

`PARTIAL`/`NOT TESTED` belongs in `AI/STABILITY_CHECKLIST.md` when the environment prevents a runtime verification.

Never convert an infrastructure restriction such as `ERR_BLOCKED_BY_ADMINISTRATOR` into a product PASS.

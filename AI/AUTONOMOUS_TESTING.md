# Autonomous Testing Capability

This repository is intentionally self-testable.

## Runtime control surface

The development bridge is exposed as `window.__GESTALT_DEV__` only on loopback hosts with `?debug=1`. It is not a production API.

## Browser runner

`tests/e2e/autonomous.mjs` is the permanent browser automation entry point. It uses the Chromium binary already available in the environment and Node's built-in WebSocket support for Chrome DevTools Protocol; no Playwright/Puppeteer dependency is required.

## Observability collected

The runner records console errors/warnings, uncaught exceptions, network failures, HTTP >=400 responses, runtime state snapshots, screenshots, and server/browser diagnostic logs.

## Deterministic setup

The runner loads `tests/fixtures/long-card.json` through the application's own normalization/persistence path and then uses real UI interactions for flip/answer/reload verification.

## Future test growth

When a bug is found:

```text
reproduce
→ add deterministic fixture if needed
→ add/extend e2e scenario
→ fix root cause
→ capture screenshot/state evidence
→ run targeted test
→ run test:regression
→ update BUG_FIX_LOG + STABILITY_CHECKLIST
```

The test suite is intended to accumulate regression knowledge rather than remain a disposable one-off test script.

## Browser runner environment

`npm run test:e2e` starts the local server and Chromium/CDP automatically. In restricted environments where loopback navigation is blocked, set `E2E_HOST` to a reachable host/IP; the harness records `tests/artifacts/e2e-result.json` with the exact browser/network failure instead of reporting a false PASS.


## Card flip invariant

The card uses one 3D track and two real faces:
- `.flashcard-inner` rotates 180° when `.flashcard.is-flipped` is active.
- `.flash-front` stays at 0°.
- `.flash-back` stays at local 180°.
- Therefore the final back content orientation is identity (180° + 180°).

Do not replace this with a separate translated overlay unless a confirmed browser regression requires it and the replacement is covered by visual E2E evidence.

# DEVELOPMENT GUIDE

## Standard workflow
```text
USER REQUEST
→ locate feature in FEATURE_MAP/CODE_MAP
→ read relevant context file
→ inspect actual source
→ identify source of truth
→ impact analysis
→ smallest safe implementation
→ npm test
→ npm run check
→ npm run platform-check
→ targeted manual checks
→ update `AI/BUG_FIX_LOG.md` and `AI/STABILITY_CHECKLIST.md` when a meaningful defect or verification status changes
→ update AI docs if behavior/architecture changed
```

## Integration rules
- Keep business changes close to their existing authoritative functions.
- Avoid inventing a second state store.
- Prefer derived UI over persisted duplicates.
- Preserve existing DOM ids unless changing controller bindings together.
- When editing vocabulary, keep full and compact representations aligned.
- When editing SRS, verify queue selection and answer mutation together.
- When editing persistence, verify old data, import/export, localStorage and Telegram paths.
- When editing Service Worker cache, update cache version and tests together.

## Documentation update triggers
Update `AI/` docs when any of these change: new feature, state field, save schema, source of truth, data flow, dependency, critical UI contract, SRS/balance rule, persistence key/prefix, test coverage, or risk classification.

## Minimal-change principle
The current code intentionally remains a single frontend module. Do not split/refactor it merely for style unless the user explicitly requests architectural work.

## Browser-driven development loop

Use `npm run test:e2e` to launch a clean local server and Chromium/CDP session. The permanent harness exercises real DOM click paths, captures runtime state, records console/network failures, captures screenshots, and checks persistence after reload. For deterministic visual/layout coverage use `tests/fixtures/long-card.json`. When a browser test fails, inspect `tests/artifacts/e2e-result.json` before changing code.

### Autonomous test commands

Run `npm run test:regression` for source/state/platform checks and `npm run test:e2e` for real browser automation. `npm run test:all` combines both.

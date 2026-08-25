# Visual regression artifacts

The autonomous browser runner captures stable reference states into `tests/artifacts/`:

- `startup.png`
- `card-back.png`
- `mobile.png`

The harness intentionally keeps screenshots as debugging evidence. Future AI agents can compare these images against a golden baseline or inspect them after a failed run.

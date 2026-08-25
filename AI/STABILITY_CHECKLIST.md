# Stability Checklist

| System | Status | Evidence / Note |
|---|---|---|
| Startup/static boot | PASS | `npm run test:regression` |
| Dictionary loading | PASS | smoke suite |
| Topic word counts | PASS | smoke suite + browser fixture assertion prepared |
| Card rendering | PASS (static) | DOM/state invariants |
| Card flip architecture | PASS (static) / PARTIAL visual | inner layer owns 3D transform; browser visual blocked in this sandbox |
| Back translation orientation | PASS (structural) / PARTIAL runtime visual | canonical two-face 3D invariant is checked; browser visual remains environment-dependent |
| Answer system | PASS (static) / PARTIAL runtime | e2e click path implemented |
| Progress / XP / SRS | PASS (static) / PARTIAL runtime | state normalization + e2e assertions |
| Persistence / reload | PASS (static) / PARTIAL runtime | e2e reload assertion implemented |
| Responsive mobile | PASS (static) / PARTIAL visual | mobile viewport assertion implemented |
| Console errors | PARTIAL | browser navigation blocked by sandbox policy |
| Network failures | PARTIAL | browser navigation blocked by sandbox policy |
| Screenshots | PARTIAL | capture pipeline implemented; local browser navigation blocked here |
| Audio | NOT TESTED runtime | browser interaction unavailable in this environment |
| Telegram cloud sync | NOT TESTED | requires Telegram runtime/credentials |

## Autonomous browser verification

Card Back Orientation: PARTIAL — code invariant PASS; full Chromium visual verification is blocked in this sandbox by browser navigation policy.
E2E Runtime Console/Network: PARTIAL — harness is implemented and captures diagnostics, but the same navigation policy prevents app-page execution here.

Do not upgrade these rows to PASS without running `npm run test:e2e` in an environment where the app page can actually load.


## Final regression after canonical flip fix
- `npm test` — PASS
- `npm run state-check` — PASS
- `npm run check` — PASS
- `npm run platform-check` — PASS
- `npm run test:e2e` — PARTIAL/ENVIRONMENT BLOCKED (`ERR_BLOCKED_BY_ADMINISTRATOR` before application load)


### Latest stabilization pass
- Daily progress renderer connected to main UI render: PASS (static/code verification)
- Statistics cards synchronized with review state: PASS (static/code verification)
- Flashcard accessible pressed-state semantics: PASS (static/code verification)


### 2026-08-25 stabilization pass
- PASS — Canonical mastery state (`0–5` SRS box)
- PASS — Legacy mastery percentage migration
- PASS — Derived review status from canonical SRS values
- PASS — Release/service-worker cache identity synchronized to `0.030`

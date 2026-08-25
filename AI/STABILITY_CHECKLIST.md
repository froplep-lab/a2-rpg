# Stability Checklist

| System | Status | Evidence / Note |
|---|---|---|
| Startup/static boot | PASS | `npm run test:regression` |
| Dictionary loading | PASS | smoke suite |
| Topic word counts | PASS | smoke suite + browser fixture assertion prepared |
| Card rendering | PASS (static) | DOM/state invariants |
| Card flip architecture | PASS (static) / PARTIAL visual | inner layer owns 3D transform; browser visual blocked in this sandbox |
| Back translation orientation | PASS (structural) / PARTIAL runtime visual | combined transform is checked by browser harness when available |
| Answer system | PASS (static) / PARTIAL runtime | e2e click path implemented |
| Progress / XP / SRS | PASS (static) / PARTIAL runtime | state normalization + e2e assertions |
| Persistence / reload | PASS (static) / PARTIAL runtime | e2e reload assertion implemented |
| Responsive mobile | PASS (static) / PARTIAL visual | mobile viewport assertion implemented |
| Console errors | PARTIAL | browser navigation blocked by sandbox policy |
| Network failures | PARTIAL | browser navigation blocked by sandbox policy |
| Screenshots | PARTIAL | capture pipeline implemented; local browser navigation blocked here |
| Audio | NOT TESTED runtime | browser interaction unavailable in this environment |
| Telegram cloud sync | NOT TESTED | requires Telegram runtime/credentials |

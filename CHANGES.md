# NATION — Phase 1 Engine Core

## Added / changed

- Added `data/balance.json` and `data/economy.json` as the source of truth for election, calendar, government, career, simulation and economy tuning values.
- Added a serializable v2 game state factory with a seeded opening parliament and state-assembly composition, 34 party records, 36 state/UT records, all 4,666 supplied constituency records, a candidate index, government state, calendar and history log.
- Replaced the counter-only time seam with deterministic `tick(state, monthDelta)`, monthly economy/mood progression, election phases, recurring Lok Sabha/assembly cycles and seeded by-elections.
- Added vote-share and constituency winner simulation, exact seat invariants, alliance vote pooling, coalition/majority government formation, PM/CM selection, and confidence-motion dissolution.
- Added player campaign actions, nomination/career progression helpers, per-state lazy candidate CSV loading and save v0/v1 → v2 migration.
- Added live UI hooks without changing the visual design: Dashboard End Turn/date, election calendar and result view, live Parliament seat composition, State Assembly composition, and lazy candidate-load status.
- Expanded engine tests and added a 50-seed, 30-year simulation stress worker.

## Verification

- `node --test tests/*.test.js`: **12 passed, 0 failed**.
- `node --check` passed for every changed `.js` file.
- The changed `src/main.jsx` was parsed as TSX with **0 syntax diagnostics**; relative import paths were checked with **0 unresolved paths**.
- The 50-seed stress test advances every game for 30 years and checks seat invariants and winner distribution. To keep that multi-seed test bounded, its test-only balance clone extends the election term to 360 months, so each jurisdiction runs its first election within the simulated 30 years. A separate test runs a 30-year simulation using the default five-year cycles and validates all national and applicable assembly seat totals.
- A Vite production build and device/browser runtime were **not verified** in this sandbox: project dependencies were absent, and `npm install --ignore-scripts --no-audit --no-fund` timed out. No claim is made that the UI build or Android runtime was tested here.

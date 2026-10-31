# NATION v1.2.0 — Changes

## Data and simulation
- Reworked `scripts/build-data.mjs` to read the unchanged source CSV files and apportion all 33,000 AI profiles by constituency seat share using deterministic Hamilton allocation.
- Kept the 12,000 player-pool profiles separate in `public/data/player-candidates.json`.
- Added `public/data/candidate-distribution.json` and `docs/CANDIDATE_DISTRIBUTION.md`; automated test verifies 4,666 seats and 7–8 AI profiles per seat.
- Corrected bill-to-ministry assignments explicitly rather than relying on array index.
- Added active-session gating and Draft → Introduced → Voted legislative workflow.
- Added configurable background profiles and starting contacts.
- Added citizen / MLA / MP monthly salary, player salary contribution to party funds, transfers, membership fees, candidate filing fee, party loan accounting and seven campaign fee definitions.

## UI and identity
- Removed the prefilled player identity and old player name from active source.
- New Game now opens the identity flow; full name and Home State / UT are required, City is optional, and B11 remains the default portrait.
- Hid game navigation until a new or saved career is active.
- Replaced hardcoded Dashboard/Profile sample metrics with game-state values.
- Removed the duplicate screen portrait layer; the dashboard displays one selected portrait.
- Added state/UT tile selection and a distinct State Details screen with seat and economy data.
- Added party filter (All / National / State), party detail screen and membership application form.
- Added Party HQ section tabs, People pool browsing, funding transfers, membership fee, party loan and campaign controls.
- Removed generic section cards and the generic Open Section button flow. Removed toast/modal popups from normal navigation and moved Save/Load to a screen.
- Replaced raw media action IDs with readable labels; currency labels use ₹ formatting.
- Added compact phone layout rules, text-size / graphics-quality settings, navbar time controls, offline precache entries and landscape web manifest declarations.

## Architecture, assets and cleanup
- Canonical store: `src/state/store.js`.
- Stylesheet entry: `src/styles/index.css` with tokens, layout and responsive CSS.
- Removed duplicate stores, duplicate stylesheets, `main.jsx.bak`, duplicate time-engine casing file, old data builder and unused legacy UI/store files.
- Copied registry-mapped source artwork into `public/assets` so runtime paths resolve.
- B03/B05 are suppressed in the picker in favour of gold icons; G12 remains null with a gold-icon treatment.
- Added `scripts/check-ui.mjs` and `npm run check:ui`.

## Validation
- `node --test tests/*.test.js tests/*.test.mjs`: 37 passed.
- `node --check` on all JS/MJS files: passed.
- TypeScript parser syntax check on all JSX files: passed.
- `node scripts/check-ui.mjs`: passed.
- `node scripts/check-assets.mjs`: passed.
- Update ZIP overlay and cleanup were tested against the combined supplied base; resulting file tree matched the working tree exactly.
- `npm run check` was not executable because esbuild is not installed; npm install was not run.
- Browser E2E, Vite build, Capacitor/Android build and physical-device QA were not run.

# NATION: RISE TO POWER — v1.3.1

Offline-first political career and governance simulation set in a fictional political world inspired by India's institutions and state structure.

## Requirements
- Node.js 20+ recommended
- npm
- Android 8+ target through Capacitor (native Android project is maintained separately)

## Install and run
```bash
npm ci
npm run check
npm run check:assets
npm run check:ui
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

## v1.3.1 hotfixes
- Android top navigation and game-time controls use separate horizontal touch-scroll strips.
- Party approval synchronizes authoritative player affiliation and office status into UI state after deadlines and save loading.
- Election Commission rows show application status, registered party status and active player affiliation.

## v1.3.0 highlights
- Real-time clock: 30 seconds per game day at 1x; 2x and 4x available.
- Intermediate time callbacks process scheduled deadlines when advancing multiple days.
- Party registration workflow with ₹10,000 fee and seven-day Election Commission decision.
- Party membership applications, manifesto policy commitments and internal governance records.
- Political meetings with a three-day scheduling rule.
- Judiciary case register and evidence-weighted adjudication.
- Seven fictional media organisations with configurable attributes and public-opinion impact.
- Election Commission notices, candidate nominations, scrutiny and result certification.
- Save schema v4 with migration from v1-v3.

## Project structure
- `src/engine/` — simulation logic
- `src/engine/v130/` — v1.3 institutional systems
- `src/state/store.js` — canonical UI state store
- `src/components/` — shared UI and engine panels
- `src/styles/` — single stylesheet entry and responsive styles
- `data/` — authoritative simulation configuration
- `data-source/` — preserved source datasets
- `public/data/` — offline runtime datasets
- `tests/` — deterministic engine and institution tests

## Important status
This package contains tested v1.3 institutional foundations, not a claim that every item in the blueprint is complete. The existing UI remains partly consolidated in `main.jsx` and `EnginePanel.jsx`. Full Election Commission administration, complete judiciary hierarchy, full newsroom simulation, complete internal party organisation, production build, browser E2E and Android device QA remain outstanding. See `docs/V130_IMPLEMENTATION_STATUS.md` and `FINAL_REPORT.md`.

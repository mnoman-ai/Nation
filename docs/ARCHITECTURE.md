# Nation v1.0.0 — Architecture

## Scope
Landscape-first offline React frontend matching the 15-page supplied UI reference. This release implements presentation, navigation, identity/profile, party browsing/membership, state tile-grid, local save/load and a pluggable turn clock. Full political/election/economy simulation is deliberately deferred to the next version.

## Folders
- `src/components`: reusable panels, stats, progress, buttons and modal.
- `src/content/strings.en.js`: UI copy and screen section labels.
- `src/store`: Zustand application state and local save adapter.
- `src/engine/TimeEngine.js`: pure month-tick interface; no simulation rules.
- `data-source`: unchanged original CSV/XLSX source files.
- `public/data`: compact app-facing JSON and state-partitioned candidate files.
- `public/assets`: supplied WebP artwork and party emblem SVGs.
- `scripts`: source-data processing and Termux workflow.

## Data flow
Source CSVs remain authoritative in `data-source/`. `npm run data:build` converts parties, state reference, constituencies, seat counts and leadership to JSON; candidate records are partitioned by `state_id` and fetched on demand. UI reads the bundled JSON; Zustand holds current player/UI/session state. Local save slot 1 currently persists through localStorage. Dexie is included as a dependency for the next persistence integration, but the present UI save adapter is intentionally simple and versioned.

## Store shape
`player`, `screen`, `sub`, `started`, `notifications`, `settings`, `savedAt`, `saveVersion`. Save payload version is 1. Future migrations belong beside the persistence adapter.

## Offline / Capacitor
All artwork, fonts and dependencies are bundled. PWA service worker caches the built application. Capacitor wraps `dist`; Android project generation and native signing require Android SDK/Gradle setup on the build machine.

## Assumptions
See `ASSUMPTIONS.md` for missing source assets and frontend-only boundaries.

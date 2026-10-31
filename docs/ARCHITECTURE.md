# NATION v1.1.0 — Engine Architecture

## Runtime boundaries
- `src/engine/` is pure JavaScript. No React, DOM, storage, or network APIs are imported there.
- `src/store/useGame.js` is the UI adapter and owns the live world, TimeEngine instance, Dexie save calls, and screen actions.
- `src/components/EnginePanel.jsx` connects engine state/actions to the relevant frontend screens.
- `src/assets/registry.js` is the only image URL registry. UI components use slot keys, never construct file paths.
- `data/*.json` is the authoritative balance/rules/content configuration. `scripts/build-data.mjs` builds the state-wise candidate data and copies config JSON into `public/data/`.
- `data-source/` retains the original candidate, party, leadership, affiliation, constituency and seat-count source files unchanged.

## Folder map
- `src/engine`: clock, seeded RNG, voter model, eligibility, election simulation/lifecycle, candidate repository, party/player actions, coalition logic, legislature, government/budget, economy, events/media, AI, save migration, scenario helpers.
- `src/assets`: slot registry and generated party palette.
- `src/components`: reusable UI widgets, PartyFlag and EnginePanel.
- `data`: editable simulation configuration.
- `public/data`: offline runtime data; candidate JSON is split by state/UT.
- `public/assets`: bundled WebP artwork and SVG emblems.
- `tests`: Node headless engine and regression tests.

## State and data flow
`loadEngineData()` loads only bundled local JSON. `createWorld()` copies the data into one save-scoped world and stores the deterministic RNG seed/state. `TimeEngine` is the sole game-time authority. Actions consume configured hours through `advanceHours`; day turns and real-time ticks use the same engine. Calendar callbacks advance monthly economy, AI, policies/projects, events and career review.

`CandidateRepository` fetches a state/UT candidate file on demand and maintains a two-state LRU cache. Election simulation partitions each state's source candidates across that state's seats, processes the state batch in a Web Worker when available, and falls back to chunked main-thread processing.

The economy object in `world.economy` is the only live economy/budget state. Economy, Government and Budget panels read that object.

## Save flow
Three save slots use Dexie/IndexedDB with a localStorage compatibility copy. `saveVersion` is 3; migrations are in `src/engine/save.js`. Slot 1 is autosaved after day/action changes. The seed and RNG state are part of the serialized world.

## Offline / Capacitor
All data, images, fonts and JS dependencies are bundled. Runtime fetches target only local `/data/` files. Capacitor `webDir: dist`, app ID and Android configuration are preserved from v1.0.0. No server, ad SDK, analytics SDK or external runtime endpoint is introduced.

## Known implementation boundaries
See `ASSUMPTIONS.md` and `FINAL_REPORT.md`. Engine unit/integration tests are not equivalent to a verified Android build or UI end-to-end test.

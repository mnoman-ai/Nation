# NATION v1.3.0 — Architecture

## Runtime boundaries
- `src/engine/` contains pure JavaScript simulation logic. No React, DOM, browser storage or network APIs are imported by engine modules.
- `src/state/store.js` is the canonical UI state adapter and connects engine actions to React screens.
- `src/components/EnginePanel.jsx` binds current engine actions and data to institutional screen panels.
- `src/assets/registry.js` is the runtime artwork registry.
- `data/*.json` contains editable simulation configuration; `data-source/` preserves original candidate and party source files.

## v1.3 institutional modules
- `src/engine/v130/partyRegistry.js`: party applications, review, symbol allocation and membership decisions.
- `src/engine/v130/manifesto.js`: policy commitments, promises and fiscal estimate.
- `src/engine/v130/partyGovernance.js`: internal elections, factions, discipline, loyalty and office appointments.
- `src/engine/v130/meetings.js`: invitations, responses, scheduled meetings, discussion and agreements.
- `src/engine/v130/judiciary.js`: case filing, hearings, evidence-weighted adjudication and appeal window.
- `src/engine/v130/media.js`: seven fictional media houses, reports and public-opinion effects.
- `src/engine/v130/electionCommission.js`: notices, nominations, scrutiny, withdrawal and result certification.

## Time and deterministic state
- `TimeEngine` is the sole game-time authority. Real-time 1x is 30 real seconds per game day; 2x/4x scale linearly.
- Time advancement calls the world tick for every intermediate day/hour so deadlines and events are not silently skipped.
- All new institution records are stored under `world.institutions`; notifications remain in `world.notifications`.

## Save migration
- Save schema version is 4.
- `src/engine/saveMigration.js` migrates v1-v3 saves and initializes new institution collections.
- `src/engine/save.js` owns world serialization/deserialization and exports the canonical version.

## Excluded scope
- Upper-house legislature functionality is intentionally excluded. Parliament remains Lok Sabha only.

## Limitations
- UI decomposition into one JSX file per screen is not complete.
- Browser E2E, production build and physical Android QA are not claimed. See `docs/V130_IMPLEMENTATION_STATUS.md`.

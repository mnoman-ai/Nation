# NATION v1.1.0 update contents

This is an overlay update for the supplied v1.0.0 project. Unzip at the project root.

## Added
- `data/*.json`: editable simulation rules, balance, actions, economy, shocks, bills, policies, projects, events, party palette and emblem-maker shapes.
- `src/engine/*`: deterministic engine modules, state-wise candidate loading, election worker/fallback, world orchestration and save migrations.
- `src/assets/*`: asset slot registry and generated party palette.
- `src/components/EnginePanel.jsx`, `src/components/PartyFlag.jsx`.
- `scripts/build-data.mjs`, `scripts/check.mjs`, `scripts/check-assets.mjs`.
- `public/offline-assets.json` and updated `public/sw.js` for bundled offline precache.
- `tests/engine-v110.test.js`, `docs/ASSET_USAGE.md`, `docs/ARCHITECTURE.md`.

## Changed
- `src/main.jsx`, `src/store/useGame.js`, `src/content/strings.en.js`, `src/style.css`.
- `src/engine/TimeEngine.js` and the other engine modules.
- `package.json`, `public/assets/manifest.json`, `public/data/*.json`.
- `PROJECT_STATE.md`, `TEST_CHECKLIST.md`, `ASSUMPTIONS.md`, `FINAL_REPORT.md`.

## Deleted / renamed
- None. Existing Capacitor configuration and Android project files are preserved.

# NATION: RISE TO POWER — v1.4.0 Graphics Foundation

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

## v1.4.0 graphics foundation
- Loading screen before the main menu.
- Classic two-column main menu composition.
- Hybrid dark command surfaces and light data panels.
- Save, pause, stop and speed controls centralized in Settings; +1 Day and +7 Days remain visible outside Settings.
- S01–S10 scene registry slots with code-authored local SVG fallbacks until supplied WebP scenes are available.
- Single player portrait overlay reserved to the left third of each scene banner.
- Android landscape-first CSS layout; native orientation lock must be applied in the separate Android project.

## Scope boundary
This is the first graphics-first implementation milestone, not the final v1.4.0 release. The detailed geographic map, interactive legislative seating, full-screen graphics completion, victory sequences, custom day-duration engine integration, production build and physical Android verification remain open. See `docs/V140_GRAPHICS_STATUS.md`.

## Project structure
- `src/engine/` — simulation logic
- `src/engine/v130/` — v1.3 institutional systems
- `src/state/store.js` — canonical UI state store
- `src/components/` — shared UI and engine panels
- `src/assets/registry.js` — runtime asset lookup
- `src/styles/` — design tokens and responsive layout
- `assets/scenes/` — S01–S10 vector scene fallbacks
- `data/` — authoritative simulation configuration
- `public/data/` — offline runtime datasets
- `tests/` — deterministic engine and institution tests

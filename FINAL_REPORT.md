# NATION v1.4.0 — Initial Graphics Foundation Report

## Delivered
- Version bumped to 1.4.0.
- Loading screen added before the main menu.
- Classic main-menu layout implemented.
- Hybrid dark/light visual system and landscape-first layout overrides added.
- Save, Pause/Resume, Stop and 1x/2x/4x controls moved into Settings; +1 Day and +7 Days remain visible in the top bar.
- S01–S10 registry slots added with ten code-authored SVG scene fallbacks.
- SceneBanner component added with a single portrait overlay in the left third.
- Offline precache, asset manifest, asset-use documentation and service-worker cache version updated.
- Portrait rotate instruction overlay removed.

## Verification performed in this environment
- `node scripts/check.mjs` — passed.
- `node scripts/check-assets.mjs` — passed after S01–S10 strict contract addition.
- `node scripts/check-ui.mjs` — passed.
- `npm test` — 74 tests passed, 0 failed.
- JSX parse validation with the system TypeScript parser — passed for `src/main.jsx` and `src/components/SceneBanner.jsx`.
- Production build — not run because project dependencies are not installed; no npm install was performed.
- Native Android build and physical-device QA — not run; supplied source ZIP has no `android/` directory.

## Not complete / deferred
- Detailed 36-state/UT geographic SVG map.
- Fully interactive Parliament and State Assembly seats.
- Custom day-duration integration with TimeEngine (Settings UI is a disabled preview).
- Supplied S01.webp–S10.webp photographs (not present in either uploaded archive; SVG fallbacks used).
- Remaining full-screen graphics, victory sequences, full accessibility/performance review and Android QA.

This is an initial v1.4.0 graphics foundation milestone, not a final release candidate.

# NATION: RISE TO POWER — Project State

## Release target
- Product version: `1.0.0` launch build; milestones M01–M14.
- Current milestone: `M01 — Project scaffold`.
- Target: Android (Termux development) + web/PWA.
- Plain JavaScript; approved stack only; 1280×720 landscape stage.

## M01 status
- [x] Vite + React scaffold and folder structure
- [x] Central design tokens in `src/styles/tokens.css`
- [x] CSV-to-JSON conversion script and optional XLSX import hook
- [x] Asset folders and naming guide
- [x] Economy/budget single source-of-truth foundation file
- [x] Initial automated tests and checklist
- [ ] Copy source CSV/XLSX files into `data-source/`
- [ ] Run install/build/tests on the user's Termux device

## Locked decisions
- Fictional parties, emblems, leaders, candidates, constituencies, events, laws and ministers.
- Real state/UT references and specified seat totals may be used; fictional constituency names/boundaries are never represented as official.
- Use only the approved stack in the Master Brief.
- Economy/budget screens must read `data/economy.json`.
- G01–G12 can be plugged in later with a placeholder until delivered.
- Preserve original data; generated JSON is rebuildable output.

## Known issues
- M01 is a scaffold, not the finished game; no simulation is implemented.
- CSVs not yet copied into `data-source/` will be reported missing by the converter.
- Workbook-only data needs optional `xlsx` package (`npm install --save-dev xlsx`).
- Economy values are consistent placeholder game-scale values, not final balance.
- Fonts currently load from Google Fonts; offline bundling is later work.
- 1280×720 scaler, navigation/router, save migrations and language toggle are M02.

## Next
M02 — App shell: stage scaler, top navbar/router, versioned save/load migrations, settings, English/Hindi toggle.

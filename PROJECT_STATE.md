# NATION v1.3.0 — Project State

## Current baseline
- Overlay is based on the supplied v1.2.0 source archive.
- Offline Vite/React/Capacitor structure, datasets, artwork registry and 4–8 candidates-per-seat distribution are retained.
- No server, external network service, ads or analytics were added. Runtime data fetches are local bundled files.
- Parliament is Lok Sabha only; no Rajya Sabha module is present.

## v1.3 engine modules
- `src/engine/v130/partyRegistry.js`
- `src/engine/v130/manifesto.js`
- `src/engine/v130/partyGovernance.js`
- `src/engine/v130/meetings.js`
- `src/engine/v130/judiciary.js`
- `src/engine/v130/media.js`
- `src/engine/v130/electionCommission.js`
- `src/engine/v130/partyArt.js`
- `src/engine/v130/shared.js`

## State and data
- Save schema v4; v1-v3 migration is tested.
- `world.institutions` stores applications, meetings, cases, media houses/reports, symbols, notices, nominations, factions, internal elections and discipline/office records.
- Party identity is canonical in `world.parties`; institution records reference party IDs.
- Seven voter groups are active.

## Current verification
- 66 automated tests passed, 0 failed.
- `node scripts/check.mjs` passed (JS syntax, UI, asset and project checks).
- Four JSX files passed parser verification.
- Vite build, browser E2E, Capacitor sync/APK and physical Android QA are not verified.

## Release gate
See `docs/V130_IMPLEMENTATION_STATUS.md` and `FINAL_REPORT.md`. The update is not declared release-complete while the listed institutional workflows and platform QA remain outstanding.

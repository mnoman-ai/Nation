# NATION v1.2.0 — Project State

Status: v1.2.0 update work is integrated into the supplied v1.1.0 project. This update is not certified launch-ready.

## Verified implementation
- 33,000 AI candidates are deterministically allocated across 4,666 constituencies in proportion to state/UT seat counts; the 12,000 player-pool candidates remain separate.
- Every constituency receives 7 or 8 AI profiles in the generated seat allocation. The source CSV/XLSX data is not modified.
- Background profiles are configured in `data/backgrounds.json`; the selected background applies starting stats and contacts.
- The player identity now starts blank. Name and Home State / UT are required; City is optional; B11 is the default portrait.
- The dashboard and player profile now read values from game state instead of the old hardcoded sample metrics.
- The India Map uses a tile grid and opens a state/UT detail screen with seat and economy data.
- Parliament bill ministries are explicitly mapped. Draft bills cannot be voted on; a live legislative session and bill introduction are required.
- Salary, office pay, 65% player salary contribution to the party, candidate filing fee, membership fee, party loans, and campaign finance primitives are added.
- Party HQ has working Overview, Leadership, Members, People, Funding, Alliances, Campaigns and other section tabs; the 12,000-profile People list loads from bundled data.
- Asset registry slots remain strict. B03/B05 are hidden behind a gold-icon presentation; G12 remains a gold-icon slot.
- One canonical Zustand store and one stylesheet import entry are used. Duplicate stores, style files, old time engine casing duplicate, old build-data script and main.jsx.bak are removed.
- Time controls are in the navbar; turn-based mode exposes only +1 Day / +7 Days and real-time exposes Pause / 1x / 2x / 4x.
- Landscape is declared in both web manifests. Compact phone CSS replaces the old small-screen stage layout.

## Verification completed
- `node --test tests/*.test.js tests/*.test.mjs`: 37 tests passed.
- `node --check` on all JavaScript and MJS files: passed.
- TypeScript JSX parser pass on all remaining JSX files: passed.
- `node scripts/check-ui.mjs`: passed.
- `node scripts/check-assets.mjs`: passed (95 registry slots; G12 is intentionally null).
- Patch overlay + `scripts/cleanup.sh` was tested against the combined supplied base; the applied tree matched the working tree with zero file mismatches.
- Candidate distribution test: 4,666 seats, 33,000 AI profiles, 12,000 separate player profiles, 7–8 per seat.

## Not verified
- `npm run check` / esbuild: esbuild is not installed in this sandbox. npm install was not run as instructed.
- Vite production build, browser UI end-to-end, Capacitor sync, APK/AAB, Android WebView and physical phone behavior were not run.
- Native Android landscape lock is not verified because the supplied source ZIP has no Android project/manifest. Web manifest orientation is set to landscape.

## Known incomplete work
- The UI is improved and some screens are data-bound, but it is not yet split into one dedicated JSX module per screen; `src/main.jsx` remains a large root component.
- Several screens and workflows remain partial: live round-by-round count UI, nominations/auto-fill UI, full parliament seat arc, committees, full cabinet, state assembly bills, complete Government/Media/Events/Notifications workflows, full party registration/manifesto editor, party leadership election process, donor deal workflow, full tutorial, and complete credits.
- Loan state and warnings are implemented as engine primitives but court-hearing resolution and Election Commission enforcement UI are incomplete.
- Party salary contribution is currently calculated for the player when the player holds MLA/MP office; automatic 65% collection from every other AI MLA/MP is not yet implemented.
- The seven campaign types and their costs are configurable; campaign contract lifecycle is partial and not fully tied to the Model Code of Conduct.

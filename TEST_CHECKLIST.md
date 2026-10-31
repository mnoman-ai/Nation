# NATION v1.2.0 — Test Checklist

## Automated checks run in this sandbox
- [x] `node --test tests/*.test.js tests/*.test.mjs` — 37 passed.
- [x] `node --check` for all `.js` and `.mjs` files.
- [x] JSX parse check for all remaining `.jsx` files using the installed TypeScript parser.
- [x] `node scripts/check-ui.mjs`.
- [x] `node scripts/check-assets.mjs`.
- [x] Unzip update over supplied base, run `scripts/cleanup.sh`, compare resulting project tree: zero mismatches.
- [x] Candidate distribution: 33,000 AI / 12,000 player pool / 4,666 seats / 7–8 AI candidates per seat.
- [x] Bill-to-ministry mapping test for Education, Agriculture and Health.
- [x] Session-gated voting test; Draft bills cannot be voted on.
- [x] Blank new-game identity and B11 default portrait test.
- [x] Salary, party contribution, loan request and prepaid campaign test.
- [x] Party loan default test: three quarterly warnings, court notice and enforcement state.
- [x] Rupee formatter uses lakh, crore and lakh-crore units.
- [x] Existing seeded acceptance test through Assembly simulation, coalition, balanced budget, event decision and save reload.

## Not run / not verified
- [ ] `npm run check` (esbuild absent; npm install intentionally not run).
- [ ] Vite production build.
- [ ] Browser E2E on desktop and phone viewport.
- [ ] Capacitor sync / Android Gradle build / APK / AAB.
- [ ] Native landscape orientation on Android 8+.
- [ ] Physical 3 GB RAM device performance and long-session memory use.
- [ ] Android WebView IndexedDB save/load after force-close and offline restart.
- [ ] Full visual comparison against all 15 supplied mockups.

## First 10 phone checks
1. Install/update while offline; confirm app opens without network.
2. Confirm landscape presentation and no scaled-down 1280×720 stage.
3. New Game opens blank identity; name and Home State are mandatory; City is optional.
4. Portrait picker has accessible labels; B03/B05 show gold icons; B11 is the default banner portrait.
5. Dashboard values change from game state; no placeholder metrics or duplicate portrait.
6. India Map opens a detail screen for every state and UT, including the five without Assemblies.
7. Party directory filters All / National / State; party profile opens a membership application.
8. Party HQ People loads the 12,000 player-pool records; recruit and funding actions update state.
9. Parliament: Draft bill voting is disabled; start an eligible session, introduce a bill, then vote.
10. Save slots 1–3, force-close the app, restart offline, and verify exact save restoration.

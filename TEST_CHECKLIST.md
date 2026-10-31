# TEST_CHECKLIST.md — v1.1.0

## Executed in this environment
- [x] `node --test tests/*.test.js` — 22 passed, 0 failed.
- [x] TimeEngine start date, day advance, real-time 1x/2x/4x rate and invalid input.
- [x] Voter group shares sum to 100 and are deterministic.
- [x] Eligibility age, state, party-leader, duplicate and two-seat rules.
- [x] Coalition arithmetic and duplicate member rejection.
- [x] Budget balance and deficit rejection.
- [x] AI monthly step and economy bounded update.
- [x] Save serialization / migration round-trip.
- [x] 31 Assembly jurisdictions / 4,123 seats / 543 Lok Sabha seats and exact opening dates.
- [x] Individual seat winner matches highest counted vote total.
- [x] Candidate allocation uses source IDs once and creates no synthetic candidate IDs.
- [x] Auto-pause on poll/counting dates.
- [x] State contest simulation on scheduled polling date.
- [x] Event choice consequences.
- [x] Acceptance flow through Assembly + Lok Sabha elections, government arithmetic, budget, session, event and save/reload.
- [x] 10-year seeded monthly run.
- [x] 4,123-seat Assembly simulation; 4,123 unique winning candidate IDs.
- [x] `node --check` for all engine JS and non-JSX project JS/scripts.
- [x] `node scripts/build-data.mjs` — rebuilt 45,000 candidate profiles across 36 state/UT files.

## Known expected check result
- [ ] `node scripts/check-assets.mjs` — reports only missing `event.G12` / `public/assets/events/G12.webp`; fallback is configured.

## Not run / not verified
- [ ] `npm run check` — requires locally installed esbuild in node_modules; npm install was not run in this sandbox.
- [ ] Vite production build — not run.
- [ ] Browser JSX compilation / runtime console.
- [ ] Android Gradle build, APK/AAB signing, Capacitor sync.
- [ ] Physical device landscape, low-RAM, offline and Android Back-button QA.
- [ ] Dexie IndexedDB save/load on Android WebView.
- [ ] Complete interaction test for every screen and all 10 modules.

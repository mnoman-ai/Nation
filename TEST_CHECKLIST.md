# NATION v1.3.1 — Test Checklist

## Automated — verified 2026-11-01
- [x] Full suite: 66 passed, 0 failed (`node --test tests/*.test.js tests/*.test.mjs`).
- [x] Time engine: 30s/day, speed scaling, +7 days, intermediate events and auto-pause.
- [x] Party registration: ₹10,000 fee, no influence/member gate, seven-day decision, EC uniqueness/document rules.
- [x] Party membership response, internal elections, factions, loyalty and defections.
- [x] Salary, 65% elected-office party share, member fee, candidate fee, campaign billing and party loan lifecycle.
- [x] Manifesto policy/promise fiscal aggregation.
- [x] Meetings: multiple-party responses, three-day scheduling, attendance and alliance agreement.
- [x] Judiciary: evidence-weighted case decision, hearing, appeal and loan enforcement records.
- [x] Seven media outlets and public-opinion impact.
- [x] Election math, candidate distribution, voter model, save/reload and v1-v3 migration.
- [x] Headless acceptance test covering registration, election, government, alliance, court, loan and save/migration.
- [x] `node scripts/check.mjs`: 58 JS/MJS/CJS syntax files, UI contract, assets and project integrity.
- [x] JSX parser check: four JSX files, zero syntax diagnostics (host parser only).

## Not run
- [ ] Vite production build — Vite not installed; no npm install performed.
- [ ] Browser end-to-end and desktop visual QA.
- [ ] Capacitor sync, Android APK build, Android 8+ / 3 GB RAM device QA.
- [ ] Physical landscape lock, portrait fallback, keyboard, safe-area and touch-target tests.

## Phone acceptance sequence
1. Landscape launch and portrait fallback.
2. Safe area, navbar, header/date and scrolling on narrow screen.
3. Long text in every form with keyboard open.
4. Party creation fee and seven-day EC decision.
5. Membership application and post authority.
6. Manifesto publish and policy implementation.
7. Election campaign, nominations, vote tally and seat allocation.
8. Lok Sabha / State Assembly sessions and bills.
9. Three-day meeting schedule, agreement and court case.
10. Loan warnings/enforcement, notifications, save, close and reload.

## v1.3.1 Android regression checks
- [ ] Swipe the top navigation left/right until Notifications is reachable.
- [ ] Swipe the game controls independently; verify Save, Pause, Stop, 1x, 2x, 4x, +1 Day and +7 Days.
- [ ] Submit a complete party registration and advance seven in-game days.
- [ ] Verify application status, registered party status, player affiliation and Party HQ actions update without restarting.
- [ ] Save and reload after approval; verify party affiliation remains active.


## v1.4.0 graphics foundation smoke test

- [ ] Loading screen appears before the Main Menu and progress reaches completion.
- [ ] Main Menu uses scenic A01 banner, one left-third portrait, horizontal five-action row and feature strip.
- [ ] New Game, Continue, Load Game, Settings and Credits each perform their intended action.
- [ ] Dashboard uses the hybrid dark/light panels and all six shortcut buttons navigate.
- [ ] Top bar exposes only +1 Day and +7 Days for manual time advancement; Settings opens from its button.
- [ ] Save, Pause/Resume, Stop and 1x/2x/4x controls are available in Settings.
- [ ] Custom day duration is visibly marked as pending engine integration; it must not be treated as active yet.
- [ ] S01–S10 scene banners load locally while offline; each shows at most one portrait in the left third.
- [ ] S01 Courts/Supreme Court; S02 District/Lower Court; S03 State Assembly; S04 Lok Sabha; S05 Committees; S06 Election Commission; S07 Meetings; S08 Party registration/manifesto; S09 Finance/Bank Loan; S10 Media & News.
- [ ] No rotate-device message appears. Confirm native landscape lock separately after running `scripts/android-patch.sh` in the Android project.
- [ ] Check touch scrolling, 44px targets, text legibility and no horizontal overflow on the actual phone.

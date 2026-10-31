# ASSUMPTIONS.md — NATION v1.2.0

## Concerns
1. **Native landscape lock:** both web manifests specify `orientation: landscape`, but the supplied source has no `android/app/src/main/AndroidManifest.xml`. The native Capacitor activity orientation cannot be verified or safely patched without that project file.
2. **Baked-background portraits:** `/assets/players/B03.webp` and `/assets/players/B05.webp` contain a baked white/checker background. Registry keys are retained, but the UI uses the gold-icon treatment instead of rendering these two files.
3. **Missing event artwork:** `/assets/events/G12.webp` is absent. The `event.G12` registry slot is retained as `null`; event UI uses a gold icon. No replacement artwork is substituted.
4. **Candidate home districts:** source candidate profiles have state IDs but no constituency assignments. Generated AI `state_id` assignments are seat-proportional; original `home_district` strings are preserved and may not match the generated target state. Source candidate IDs and profile data are not fabricated.
5. **Player pool separation:** the 12,000 `PLAYER_CONTROLLED` records are emitted separately as `public/data/player-candidates.json`; they are not mixed into AI seat allocation.
6. **Party loan workflow:** principal, 24% annual interest, two-year term, three-month warnings, court notice and enforcement status are modelled in the engine. Full hearing adjudication and Election Commission UI are incomplete.
7. **Campaign workflow:** all seven campaign types and fees are configurable; monthly and prepaid contract accounting is implemented. Complete campaign outcome effects and election-code cutoff wiring remain incomplete.
8. **Salary distribution:** the player's ₹55,000 citizen / ₹3 lakh MLA / ₹7 lakh MP salary and 65% party contribution when elected are implemented. Salary transfers from all other AI elected members are not yet modelled as a full payroll ledger.
9. **Screen architecture:** the duplicate store and stylesheet systems were removed. The root UI has not yet been fully decomposed into a separate JSX file for every screen; this remains a known gap.
10. **Build verification:** npm install was intentionally not run. `npm run check` cannot execute because esbuild is not installed in this sandbox. Node tests, JS syntax checks, JSX parsing, UI scan and asset scan were run instead.
11. **Offline scope:** no server endpoints, analytics, ads or remote APIs were added. Runtime data fetches target bundled local `/data/` files.
12. **Source datasets:** `data-source` CSV/XLSX files are carried over unchanged from the supplied v1.0.0 baseline where required by `scripts/build-data.mjs`; the build script reads them and writes generated JSON only.

13. **Background profiles:** starting stats and contacts are read from `data/backgrounds.json`; the chosen background does not change the monthly salary rate.

## Decisions retained
- Start date: 1 January 2025; one difficulty; English-only UI.
- 31 Assembly jurisdictions / 4,123 Assembly seats; 543 Lok Sabha seats; 5 no-Assembly UTs.
- Opening Assembly poll/results: 6 April 2027 / 11 April 2027.
- Opening Lok Sabha poll/results: 26 April 2029 / 1 May 2029.
- No Rajya Sabha, no reserved seats, no real political parties or politicians.
- AI candidate apportionment uses state/UT constituency seat counts and deterministic Hamilton allocation.

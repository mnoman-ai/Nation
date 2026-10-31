# ASSUMPTIONS.md — NATION v1.1.0

## Concerns (implemented as far as source data allows)
1. **Missing art:** supplied full art ZIP contains A01–A10, B01–B11, C01–C06, D01–D11, E01–E34 and G01–G11. `G12.webp` is absent. Registry slot `event.G12` is retained as `null`; event cards use the gold-icon fallback. Exact missing file: `public/assets/events/G12.webp`.
2. **No constituency assignment in candidate source:** candidate records contain state/UT IDs but no constituency IDs. Candidates are deterministically partitioned across seats within their home state, without inventing candidate IDs or reusing a candidate in multiple seats in the same contest. The dataset has 1,211 candidates for Uttar Pradesh and 403 Assembly seats (3.00 candidates per seat on average); therefore the requested 4-candidate minimum cannot be met there without moving candidates across states or fabricating profiles. Neither was done. The simulation uses the available eligible candidates (2–8 in the data-limited cases).
3. **Party colours are absent from the party CSV:** a deterministic, fictional palette is supplied in `data/party-colours.json`; party emblems remain the exact supplied SVGs.
4. **Master GDD:** no separate Master GDD file was present inside the newly uploaded v1.0.0 project ZIP or the full art ZIP. The explicit v1.1.0 contract was treated as controlling. If the GDD exists elsewhere, its unprovided details have not been inferred.
5. **G12 event artwork is the only missing mapped artwork.** B11 and all 34 emblems are present.
6. **Election candidate distribution:** AI and player-pool records are preserved and loaded state-wise. No candidate profile is fabricated. The source data does not include seat-specific candidate assignments, so the engine creates a deterministic seat allocation from state-level pools.
7. **UI string centralisation:** the legacy v1.0.0 screen copy and some new EnginePanel labels remain inline; full migration of every visible string into `src/content/strings.en.js` is incomplete.
8. **Engine scope not fully complete:** see `FINAL_REPORT.md`. Several systems have engine primitives and partial UI wiring, but not every requested interaction (e.g. live round-by-round count UI, party emblem maker UI, all cabinet/coalition workflows) is complete.
9. **Android build:** Capacitor configuration was preserved. No Android SDK/Gradle build or physical Android QA was run in this environment.
10. **Build validation:** npm install was intentionally not run. `node --test` and `node --check` were used where possible. JSX esbuild check is provided but could not be executed without installed node_modules/esbuild.
11. **No external network endpoints, ads or analytics were added.** Local fetches only target bundled app data.

## Design decisions kept
- Start date 1 January 2025; one difficulty; English-only UI; offline-first.
- 31 Assembly jurisdictions / 4,123 Assembly seats, 543 Lok Sabha seats; 5 no-Assembly UTs.
- Opening polling/results dates exactly as specified.
- No Rajya Sabha; no reserved seats; no real political parties or politicians.
- No candidate replacement dataset.

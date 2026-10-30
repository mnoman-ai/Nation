# Assumptions and Known Gaps

- The user’s latest scope instruction takes precedence: v1.0.0 delivers graphics/UI/frontend plus a simulation foundation; full simulation engine is deferred to the next version.
- Supplied visual reference is a 15-page raster PDF. Composition and visual language are recreated responsively; exact pixel identity cannot be guaranteed across differing device aspect ratios.
- Asset archive contains A01–A10, B01–B10, C01–C06, D01–D11 and event folder with no G01–G12 art. B11 default Arjun Verma art is missing. B01 is used as the visible fallback in the UI. Add B11/G01–G12 by updating `assets/manifest.json` and relevant screen mapping.
- No `assets/manifest.json` was supplied; generated manifest maps all extracted assets and explicitly records missing IDs.
- The party emblem index is supplied; emblem display currently resolves by ordered party index and has a text-safe fallback. Party IDs are not inferred from row numbers for identity.
- Candidate data is split by state_id into public/data/candidates-*.json and fetched lazily. Candidate UI shows an on-demand sample/count foundation; complete candidate browser workflows and simulation are future work.
- This frontend implements one browser save slot using versioned localStorage. Three-slot Dexie persistence and migration coverage remain to be completed before a commercial release.
- No event art is available; event screen uses supplied matching banners/thumbs and does not claim G01–G12 exist.
- The 36-state/UT tile map is schematic and does not depict geographic borders. It displays supplied state records where present; no geographic boundary claims are made.
- This build is an initial integrated frontend package, not a certified launch-ready commercial release. Android APK/AAB signing and real-device verification are not performed in this sandbox.

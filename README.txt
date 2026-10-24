NATION: RISE TO POWER — v0.0.6
Playable-foundation update and scrolling fixes

WHAT CHANGED
- Fixed viewport sizing and scrolling on the start screen, main content pages, sidebar, mobile navigation and modals.
- Mobile layout now keeps the main content as the scrollable area and the navigation in a bottom strip.
- Constituency explorer has interactive State/UT selection, Assembly/Lok Sabha type toggle, search, region filter and a details view with type/state/region/fictional ID.
- No geographic India map is included in this version, as requested; the structured interactive list is the primary explorer for now.
- Reads a previous v0.0.5 local save when available and writes new saves to the v0.0.6 key. Keep an exported backup before major updates.
- Updated service-worker cache version so older cached files are less likely to override this build.

PLAYABLE SYSTEMS (SIMPLIFIED)
- New game and character creation, citizen career, date advancement and salary.
- Dashboard and local save/autosave, manual save slots, JSON export/import.
- Interactive State/UT selector and fictional constituency list.
- Basic election setup, campaign actions, polling, vote allocation and results.
- Party creation, recruitment, candidate roster, relationship proposals.
- News, public opinion, events, policies/projects, finance, research and achievements.

IMPORTANT DATA NOTICE
The constituency names and IDs are fictional gameplay records, not official ECI constituency data. This build does not include a geographic map or a complete verified seat-by-seat dataset. Government, diplomacy, AI and economic simulation remain simplified.

RUN
1. Extract this ZIP.
2. Open index.html in a modern browser for a quick preview. PWA/service worker requires localhost or HTTPS.
3. Android workflow: npm install; npm run web:prepare; npx cap sync android; then build in Android Studio/your existing Android build workflow.

APP ID: com.nation.risetopower
APP NAME: NATION: RISE TO POWER
VERSION: 0.0.6

SCROLLING PATCH (v0.0.6 corrected package)
- Corrected the app shell sizing: the shell no longer incorrectly takes 100% height inside an already constrained grid row.
- Main content is now the constrained flex/grid child with its own vertical scrolling viewport.
- Mobile layout explicitly allocates remaining height to main content and keeps the horizontal nav strip separate.
- Start screen and modals have independent overflow handling for short landscape viewports.
- This patch addresses the CSS sizing/overflow root cause, but final physical-device verification is still recommended.

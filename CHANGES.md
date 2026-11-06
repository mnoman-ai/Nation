# NATION: RISE TO POWER — v1.4.0

## Graphics foundation milestone
- Added a loading screen before the main menu.
- Rebuilt the main menu in the classic scenic-banner composition, aligned to page 1 of the supplied graphics reference.
- Introduced the hybrid dark/light visual system, dashboard shortcut strip and Android landscape layout overrides.
- Moved Save, Pause/Resume, Stop and speed controls into Settings; retained +1 Day and +7 Days outside Settings.
- Added the S01–S10 scene registry slots and ten local SVG scene fallbacks with the left-third portrait reserve.
- Added the SceneBanner component and single portrait overlay behavior.
- Updated asset manifest, offline precache list, asset documentation and service-worker cache version.
- Removed the rotate-device overlay; native Android landscape lock remains a separate Android-project task.

## Explicitly deferred
- Detailed current 36-state/UT geographic map data integration.
- Full interactive Parliament and State Assembly seating.
- Custom day-duration integration with TimeEngine.
- Full graphics completion across all screens, victory animation, complete device QA and final release validation.

See `docs/V140_GRAPHICS_STATUS.md` for the exact implementation boundary and known gaps.

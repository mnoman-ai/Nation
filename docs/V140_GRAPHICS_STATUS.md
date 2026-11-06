# NATION v1.4.0 — Graphics Foundation Status

## Release scope

This is the first graphics-first implementation milestone. It does not claim that the entire 50-point graphics and bug list is complete. Engine rewrites and new simulation behavior are deliberately excluded from this phase.

## Design baseline

The 15-page user-provided `Nation Graphics.pdf` was reviewed and its screen-by-screen compositions are summarized in `docs/GRAPHICS_REFERENCE_AUDIT.md`. The classic menu and dashboard composition are being aligned to those references.

- Hybrid UI: dark command surfaces with light information/data panels.
- Realistic supplied imagery with custom SVG interface/scene overlays.
- Classic main menu.
- Hybrid political command-centre dashboard.
- Detailed India Map is the target; the current state selector remains a cartogram until a vetted 36-unit boundary dataset is integrated.
- Parliament and State Assembly target a hybrid chamber illustration plus interactive, engine-fed seat map.
- Player portrait overlays the reserved left third once per scene.
- Android-first landscape layout.

## Implemented in this milestone

- Added a boot/loading screen with a progress indicator before the main menu.
- Rebuilt the main menu into the classic scenic-banner composition: single left portrait, horizontal actions and lower feature strip.
- Centralized Save, Pause/Resume, Stop and 1x/2x/4x controls inside Settings.
- Kept only +1 Day and +7 Days outside Settings.
- Added Settings layout for the custom day-duration control; it remains disabled until the time engine adapter is implemented.
- Added the S01–S10 scene registry keys and ten locally bundled code-authored SVG scene fallbacks.
- Added the `SceneBanner` component with a single portrait overlay in the left third.
- Updated asset manifest, offline precache list and asset-use documentation.
- Removed the portrait rotate instruction overlay. Native Android orientation locking still requires the separately maintained Android project.
- Added v1.4.0 visual tokens, landscape layout overrides, dashboard shortcut strip, focus states and reduced-motion handling.

## Not yet complete

- Supplied photographic S01.webp–S10.webp files are absent from both supplied archives. Current S-series entries are clearly identified SVG fallbacks.
- Detailed geographically accurate 36-state/UT SVG map is not yet integrated. Current selector is still a schematic cartogram.
- Parliament and State Assembly chamber graphics are scene fallbacks; fully interactive seats and engine-driven voting visualization remain to be implemented.
- Full screen-by-screen visual rebuild is not complete.
- Victory animations, full loading asset progress, all button-state audits, complete accessibility review and Android device QA remain open.
- Custom day duration is a UI placeholder; it is not connected to TimeEngine in this graphics-first phase.
- Native Android project is not included in the supplied source ZIP; native orientation and APK build must be verified in the user's Android project.
- The Node test suite passed 74/74. Production build and physical Android test are not claimed because dependencies are not installed here and no native Android project was included.

## External map-data note

A public DataMeet-derived state-boundary dataset surfaced during research, but its available page describes a 2011 boundary vintage and known pre-Telangana / pre-2019 reorganisation limitations. It was not imported as a final current map. A current, licensed 36-unit boundary source must be validated before the map is marked complete.

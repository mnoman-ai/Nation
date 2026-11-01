# NATION: RISE TO POWER — v1.3.1

## Android interaction and party-registration hotfix

- Reworked the top navigation and game-time controls into separate, full-width horizontal touch-scroll regions on narrow Android/WebView layouts.
- Added WebView-friendly momentum scrolling, horizontal touch gesture handling, stable non-shrinking controls and visible scroll affordance.
- Kept the navigation and controls independent so a swipe on one strip does not compress or block the other.
- Synchronized the top-level player UI state from the authoritative world state after real-time ticks, manual day advances, deadline processing and save loading. This ensures an automatically approved party's new party ID and office status propagate to all screens, not only the simulation world object.
- Election Commission application rows now show the application decision, created party registration status, and whether the player is actively affiliated with that party.
- Correction resubmission now preserves existing headquarters, logo, flag and colour selections when the corresponding form field is not changed.
- Added v1.3.1 regression checks for Android touch-scroll regions and party affiliation state propagation.

## Compatibility

- Keeps the existing v1.3.0 offline data model, saves, game rules, Capacitor configuration and Android patch script.
- No server, analytics, ads or network gameplay services were added.

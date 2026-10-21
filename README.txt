NATION: RISE TO POWER — v0.0.3
LANDSCAPE-FIRST DEVELOPMENT BUILD

The game remains a single-file HTML/CSS/JavaScript prototype in index.html. Capacitor configuration and the Android APK workflow are preserved.

ANDROID / WEB SOURCE
- Extract this ZIP.
- Open index.html in a modern browser to test the web foundation.
- For APK builds, use the existing GitHub Actions workflow and Capacitor configuration.
- Keep the device in landscape orientation for the intended layout.

V0.0.3 SCOPE
- Core navigation: Dashboard, Parliament, Election, Political Parties, State Assemblies, Infrastructure, Save / Load.
- Campaign operations are grouped under Election.
- Political party management supports add, edit and archive/restore.
- State Assembly directory provides selection/navigation only; seat counts, elected members and government details are not fabricated.
- Infrastructure categories are visible; project cost, budget impact, duration and outcomes are not active.
- Parliament is explicitly inactive until an election and legislative systems can supply real in-game data. No Rajya Sabha is included.

IMPORTANT LIMITATIONS
This is an early playable foundation, not a complete political simulation. Election resolution, constituency-level candidate data, party treasury, government formation, legislative proceedings and infrastructure simulation are not implemented. UI must not be interpreted as real-world current data.

SAVE COMPATIBILITY
The game uses a new v0.0.3 local-save namespace. A compatible v0.0.1 autosave/manual slot is copied into the new namespace when first read; the old save remains untouched.

#!/bin/sh
set -eu

# Run from the project root after unzipping nation-v1.2.0-update.zip.
rm -f \
  src/main.jsx.bak \
  src/store.js \
  src/style.css \
  src/styles.css \
  src/engine/timeEngine.js \
  scripts/build-data.js \
  src/components/EngineWorkspace.jsx \
  src/engine/parties.js \
  src/services/audio.js

rm -rf \
  src/store \
  src/services \
  assets/emblems/NATION_party_emblems

# Remove empty legacy folders only; retain public/assets/emblems/NATION_party_emblems,
# which is the strict runtime registry location.
rmdir src/services src/store 2>/dev/null || true

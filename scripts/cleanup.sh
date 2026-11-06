#!/bin/sh
set -eu
# Remove obsolete v1.2 development-only source artifacts. Runtime assets are preserved.
rm -f src/main.jsx.bak src/components/EngineWorkspace.jsx src/engine/timeEngine.js scripts/build-data.js
rm -rf src/store src/services
rmdir src/services src/store 2>/dev/null || true

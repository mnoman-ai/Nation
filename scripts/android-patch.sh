#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ ! -f "$MANIFEST" ]; then
  echo "Android platform files are absent. Run 'npx cap add android' on the development machine, then rerun this patch." >&2
  exit 2
fi
python3 - "$MANIFEST" <<'PY'
import re, sys
from pathlib import Path
p = Path(sys.argv[1])
text = p.read_text()
pattern = r'(<activity\b[^>]*android:name="[^"]*(?:MainActivity|\.MainActivity)"[^>]*)(>)'
m = re.search(pattern, text, re.S)
if not m:
    raise SystemExit('Could not find the MainActivity element in AndroidManifest.xml')
attrs = re.sub(r'\s+android:screenOrientation="[^"]*"', '', m.group(1))
attrs += ' android:screenOrientation="sensorLandscape"'
config = re.search(r'android:configChanges="([^"]*)"', attrs)
required = ['orientation', 'screenSize', 'keyboardHidden']
values = config.group(1).split('|') if config else []
for item in required:
    if item not in values:
        values.append(item)
if config:
    attrs = attrs[:config.start()] + 'android:configChanges="' + '|'.join(values) + '"' + attrs[config.end():]
else:
    attrs += ' android:configChanges="' + '|'.join(values) + '"'
text = text[:m.start(1)] + attrs + text[m.end(1):]
p.write_text(text)
PY
python3 - <<'PY'
import json
from pathlib import Path
p = Path('capacitor.config.json')
data = json.loads(p.read_text())
data.setdefault('android', {})['backgroundColor'] = '#071b26'
data.setdefault('plugins', {})['StatusBar'] = {'overlaysWebView': True, 'style': 'DARK', 'backgroundColor': '#071b26'}
p.write_text(json.dumps(data, indent=2) + '\n')
PY
# Hide Android system bars while the game is active.
for ACTIVITY in android/app/src/main/java/*/*/MainActivity.java android/app/src/main/java/*/*/MainActivity.kt; do
  [ -f "$ACTIVITY" ] || continue
  if ! grep -q 'IMMERSIVE_STICKY\|5894' "$ACTIVITY"; then
    if echo "$ACTIVITY" | grep -q '\.java$'; then
      sed -i '/super\.onCreate(savedInstanceState);/a\        getWindow().getDecorView().setSystemUiVisibility(5894 | 1024 | 512 | 4096);' "$ACTIVITY"
    else
      sed -i '/super\.onCreate(savedInstanceState)/a\        window.decorView.systemUiVisibility = 5894 or 1024 or 512 or 4096' "$ACTIVITY"
    fi
  fi
done
npx cap sync android

#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
pkg update -y
pkg install -y nodejs-lts git unzip
npm install
npm run data:build
printf '\nNation setup complete. Next: npm test && npm run build\n'

# NATION: RISE TO POWER — v1.1.0 update

Overlay this ZIP on top of the v1.0.0 project root. Do not extract into a nested folder.

## Termux commands
```sh
pkg update && pkg upgrade
pkg install nodejs-lts git unzip
unzip nation-v1.1.0-update.zip -d /path/to/NationProject
cd /path/to/NationProject
npm install
npm run data:build
npm run test
npm run check
npm run check:assets
npm run build
npx cap sync android
```

Open the existing Android project in Android Studio or build with the Android Gradle wrapper already configured in your project. This update does not replace `capacitor.config.js` or the Android folder.

## Scripts
- `npm run data:build` — rebuild source JSON, state-wise candidate partitions and public runtime configs.
- `npm run test` — Node headless engine tests.
- `npm run check` — esbuild parse check over every JS/JSX source file, reporting all failures together.
- `npm run check:assets` — registry existence and hardcoded image path check. It currently reports the absent G12 event art.
- `npm run build` — Vite production build.

## Offline / privacy
All runtime game data and art are bundled. There are no ad or analytics SDKs and no external runtime endpoints. Candidate and party data are fictional. No real political parties, leaders or candidates are represented.

## Play Store preparation
- Provide a public privacy policy URL stating that the game stores saves locally and has no analytics, advertising or account backend.
- Complete the Play Console Data Safety form based on the final Android package and SDK inventory.
- Complete the content rating questionnaire; describe fictional political themes, campaign conflict, scandals and disasters accurately.
- Suggested short listing: “Build a political career, lead a party and shape a fictional nation in an offline strategy simulation.”
- Suggested full listing: “Start as a citizen, build influence, contest elections, negotiate coalitions and manage public institutions. All parties, candidates and constituencies are fictional.”
- Add landscape screenshots, feature graphic, app icon, version details and a tested signed AAB.
- Verify Android 8+ compatibility, 3 GB RAM performance, offline launch and privacy disclosures before release.

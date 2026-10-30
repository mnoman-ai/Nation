# NATION: RISE TO POWER v1.0.0

Offline-first, landscape political career game frontend built with React + Vite and prepared for Capacitor Android packaging.

## Requirements
- Node.js 20+ and npm
- Termux on Android: `pkg update && pkg install nodejs-lts git unzip`

## Termux setup
```sh
unzip nation-v1.0.0.zip -d Nation
cd Nation
bash scripts/termux-setup.sh
npm run data:build
npm test
npm run build
npm run dev -- --host 0.0.0.0
```
Open the local Vite URL shown in Termux. The app bundles fonts and artwork; runtime network access is not used by game screens.

## Capacitor Android
```sh
npm install
npx cap add android
npm run build
npx cap sync android
npx cap open android
```
Android Studio + Android SDK/Gradle are required to produce APK/AAB. Set `minSdkVersion 26` in the generated Android project before release. The included workflow can build a debug APK and optionally sign an AAB when signing secrets are configured.

## Data workflow
Original source data is preserved in `data-source/`. Run `npm run data:build` after updating source CSVs. Do not edit generated public/data files by hand.

## GitHub backup
```sh
git init
git add .
git commit -m "Nation v1.0.0 frontend"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

## Play Store readiness checklist
- Publish a privacy policy stating the game works offline, has no ads/analytics and stores saves locally. Update it if any data collection is introduced.
- Complete Play Console Data safety accurately; do not claim a third-party audit.
- Set content rating via IARC questionnaire; describe fictional political themes and non-graphic crisis events accurately.
- Listing title: Nation: Rise to Power.
- Short description: Build a political career in an offline fictional political strategy game.
- Long description: Create your identity, explore fictional parties, build relationships and navigate institutions in a landscape-first political career experience. Set in India with fictional political actors and fictional constituency data.
- Provide phone/tablet screenshots, icon, feature graphic, target API compliance and signed AAB.
- Verify all fictional disclaimers and artwork rights before submission.

## Important
This package is the UI/frontend release foundation, not a complete simulation engine or certified commercial launch. Read `ASSUMPTIONS.md`, `PROJECT_STATE.md` and `FINAL_REPORT.md` before release.

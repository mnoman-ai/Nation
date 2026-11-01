# v1.3.1 engineering report

## Scope
Focused hotfix for the Android issues reported after converting Nation v1.3.0 into an Android app.

## Changes made
1. Top navigation is a dedicated horizontal touch-scroll strip on narrow devices.
2. Save / Pause / Stop / 1x / 2x / 4x / +1 Day / +7 Days are a separate horizontal touch-scroll strip.
3. Android WebView touch momentum and horizontal gesture behavior are explicitly enabled.
4. World player affiliation and status are copied into the UI store after day ticks, real-time ticks and save loading.
5. Election Commission UI distinguishes application status, registered party status and active player affiliation.
6. Correction resubmission retains previously selected application values when no replacement value is entered.

## Verification
- Node syntax checks: passed for modified JavaScript modules.
- Existing automated test suite: 66/66 passed.
- New v1.3.1 regression checks: added; included in the 69-test target suite.
- Production Vite build: not run in this environment because npm dependency installation did not complete before timeout. Run `npm ci` then `npm run build` on the Termux internal-storage project directory.
- Android APK build and physical-device swipe/party-approval verification: not run here. These require the user's Android/Termux environment.

## Important
This ZIP contains the complete web/PWA source and Capacitor project configuration/scripts, not a compiled APK. Preserve the existing game save before replacing the installed app or updating source.

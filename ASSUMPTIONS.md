# NATION v1.3.0 — Assumptions and Concerns

## Confirmed decisions
- Parliament is implemented as Lok Sabha only; no upper-house system is included.
- Party creation costs exactly ₹10,000 from the personal account; no influence or membership threshold applies.
- Party registration decision is due after seven in-game days.
- Accepted political meeting invitations schedule the meeting three in-game days later.
- Real-time speed is 30 seconds per game day at 1x, 15 seconds at 2x and 7.5 seconds at 4x.
- Donation income and unsupported fundraising income are disabled. Personal transfers, membership fees, office-holder contributions and loans remain separately accounted.

## Assumptions needed to make unspecified mechanics executable
- The new six-group voter list is treated as an abbreviated list; General/Others from the prior seven-group voter model remains active to preserve the original GDD.
- Membership applications receive a party-side decision after seven in-game days. This deadline was not specified in the v1.3 brief.
- The Election Commission's seven-day automatic review approves only unique party names/abbreviations when a symbol is available; otherwise it requests changes. This is a temporary deterministic review rule, not a complete document-authentication simulation.
- Evidence-weighted court outcomes use a deterministic case-strength calculation. This avoids political-affiliation-based verdicts but is not a substitute for a full judicial hierarchy, judge roster and precedent model.

## Concerns / incomplete scope
- The v1.3 blueprint is larger than a safe single patch can fully complete without a full UI and engine rewrite. This update adds tested institutional mechanics but does not complete every item in all five phases.
- The existing UI still uses a shared `main.jsx` plus `EnginePanel.jsx`; per-screen JSX decomposition remains outstanding.
- Native Android orientation locking requires the Android project/manifest and device verification. A web manifest orientation hint alone cannot prove native enforcement.
- The seven media organisations have working attributes and report effects, but automatic newsroom generation and ownership evolution are not complete.
- Parliament/Assembly, court hierarchy, EC document review and party faction simulation remain partial.
- No production build, browser automation or physical Android test is claimed.

## Verification update (2026-11-01)
- The current test suite was rerun directly in the project runtime: 66 tests passed, 0 failed.
- `scripts/check.mjs` was added because `package.json` referenced it but the file was missing. It runs JS syntax checks, UI contract, asset registry and project integrity checks.
- Four JSX files were separately parsed with the host TypeScript compiler; this was a syntax-only check and does not add TypeScript as a game dependency.
- Production build remains unverified because Vite and project dependencies are not installed. No package installation was performed.
- The Android platform directory is not present in the supplied source project. `scripts/android-patch.sh` is provided for the owner's Android development checkout; native orientation, immersive status bar and APK output remain unverified.

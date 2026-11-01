# NATION v1.3.0 — Changes

## Core simulation
- Changed real-time clock to 30 seconds per in-game day at 1x; 2x and 4x scale proportionally.
- Time advancement now processes intermediate day/hour callbacks so scheduled deadlines and notifications are not skipped by multi-day advances.
- Events remain gated until the first election result is published.

## Political institutions
- Added deterministic Election Commission party-registration applications with ₹10,000 fee, no minimum influence/membership, seven-day decision date, name/abbreviation uniqueness checks, symbol allocation, correction requests and decision notifications.
- Added party membership applications and party-side response records; acceptance assigns the office/post and updates the authoritative party/member records.
- Added manifesto categories, policy commitments, custom promises, fiscal-cost aggregation and publishing.
- Added internal party leadership elections, faction records, office-bearer appointments, disciplinary records and loyalty values.
- Added meeting invitations, accept/reject, three-day meeting scheduling, attendance, discussion records and signed alliance agreements.
- Added court case filing, hearing records, evidence-weighted adjudication, verdict notices and appeal deadlines.
- Added seven independent fictional media organisations, configurable credibility/reach/influence/editorial attributes, report publishing and public mood/party-support effects.
- Added Election Commission notices, candidate nomination submission/scrutiny/withdrawal and election result certification.
- Added deduplicated notification records with type, priority and target.

## Finance and data integrity
- Disabled donation-based and unsupported fundraising income under the v1.3.0 finance rule.
- Kept party and personal accounts separate.
- Increased save schema to v4; v1-v3 saves migrate with new institution collections initialized.
- Excluded upper-house legislature functionality; Parliament remains Lok Sabha only.

## UI
- Added Election Commission, Meetings and Courts navigation entries.
- Wired Party HQ manifesto, meetings, party registration, internal faction and leadership controls to engine actions.
- Added Election Commission, judiciary and seven-house media panels.
- Party registration form no longer blocks on influence or minimum membership.

## Validation
- Node test suite: 47 tests passed before the final additions; v1.3-specific test suite: 13 tests passed.
- Full suite rerun after final time-engine, membership, migration and UI changes: 55 passed, 0 failed.
- `npm run check` was attempted but esbuild is unavailable; `npm run build`, Android build, browser E2E and physical-device QA have not been run in this environment.

## Verification continuation — 2026-11-01
- Added `scripts/check.mjs`, repairing the existing `npm run check` entry point. It checks 58 JS/MJS/CJS files and runs the UI, asset and project-integrity validators.
- Re-ran the full automated suite: 66 passed, 0 failed.
- Parsed all four JSX files with the host TypeScript parser: zero syntax diagnostics.
- Re-ran asset registry and project integrity checks successfully.
- Updated implementation and final reports to clearly identify remaining partial systems and unverified production/Android/browser work.

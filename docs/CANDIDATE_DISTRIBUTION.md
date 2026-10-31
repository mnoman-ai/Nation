# AI Candidate Distribution — v1.2.0

The source candidate CSV is read-only. `scripts/build-data.mjs` reads the 45,000 source records, keeps the 12,000 `PLAYER_CONTROLLED` profiles in `public/data/player-candidates.json`, and distributes the 33,000 `AI_CONTROLLED` profiles across all 4,666 constituencies.

The state allocation uses Hamilton's largest-remainder method:

`state AI share = state constituency seats × (33,000 / 4,666)`

The fractional remainder is apportioned deterministically. Candidate ordering is deterministic (SHA-256 of candidate ID plus the v1.2.0 allocation key). Candidate profile fields are preserved; only the generated assignment field `state_id` is set to the target state/UT. The original CSV/XLSX files are not edited.

| State / UT | Constituencies | AI candidates assigned | Exact fair share |
|---|---:|---:|---:|
| Andhra Pradesh | 200 | 1,415 | 1414.49 |
| Arunachal Pradesh | 62 | 439 | 438.49 |
| Assam | 140 | 990 | 990.14 |
| Bihar | 283 | 2,002 | 2001.50 |
| Chhattisgarh | 101 | 714 | 714.32 |
| Goa | 42 | 297 | 297.04 |
| Gujarat | 208 | 1,471 | 1471.07 |
| Haryana | 100 | 707 | 707.24 |
| Himachal Pradesh | 72 | 509 | 509.22 |
| Jharkhand | 95 | 672 | 671.88 |
| Karnataka | 252 | 1,782 | 1782.25 |
| Kerala | 160 | 1,132 | 1131.59 |
| Madhya Pradesh | 259 | 1,832 | 1831.76 |
| Maharashtra | 336 | 2,376 | 2376.34 |
| Manipur | 62 | 439 | 438.49 |
| Meghalaya | 62 | 439 | 438.49 |
| Mizoram | 41 | 290 | 289.97 |
| Nagaland | 61 | 431 | 431.42 |
| Odisha | 168 | 1,188 | 1188.17 |
| Punjab | 130 | 919 | 919.42 |
| Rajasthan | 225 | 1,591 | 1591.30 |
| Sikkim | 33 | 233 | 233.39 |
| Tamil Nadu | 273 | 1,931 | 1930.78 |
| Telangana | 136 | 962 | 961.85 |
| Tripura | 62 | 439 | 438.49 |
| Uttar Pradesh | 483 | 3,416 | 3415.99 |
| Uttarakhand | 75 | 530 | 530.43 |
| West Bengal | 336 | 2,376 | 2376.34 |
| Andaman and Nicobar Islands | 1 | 7 | 7.07 |
| Chandigarh | 1 | 7 | 7.07 |
| Dadra and Nagar Haveli and Daman and Diu | 2 | 14 | 14.14 |
| Delhi | 77 | 545 | 544.58 |
| Jammu and Kashmir | 95 | 672 | 671.88 |
| Ladakh | 1 | 7 | 7.07 |
| Lakshadweep | 1 | 7 | 7.07 |
| Puducherry | 31 | 219 | 219.25 |

The per-seat allocation is 7 candidates for 4,328 seats and 8 candidates for 338 seats (7.07 average). No seat falls outside the required 4–8 range. The separate player pool is not included in these AI seat allocations.

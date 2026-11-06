# Asset Usage — NATION v1.4.0

All runtime artwork is resolved through `src/assets/registry.js`. UI components must use registry keys and must not hardcode asset paths. Unassigned slots use purpose-built vector or neutral fallbacks; unrelated images are never substituted.

## Existing main banners

A01–A10 retain their v1.3.1 screen assignments. They remain the primary screen banners and are not replaced by the S-series.

## S01–S10 interior scene slots (strict)

| ID | Registry key | Only permitted placement | Current asset |
|---|---|---|---|
| S01 | `scene.S01` | Courts — Supreme Court section | Code-made SVG scene fallback |
| S02 | `scene.S02` | Courts — District/Lower Court section | Code-made SVG scene fallback |
| S03 | `scene.S03` | State Assembly — chamber/sessions section | Code-made SVG scene fallback |
| S04 | `scene.S04` | Parliament — Lok Sabha chamber/sessions section | Code-made SVG scene fallback |
| S05 | `scene.S05` | Parliament — Committees section | Code-made SVG scene fallback |
| S06 | `scene.S06` | Election Commission — registration/verification section | Code-made SVG scene fallback |
| S07 | `scene.S07` | Meetings and Alliances section | Code-made SVG scene fallback |
| S08 | `scene.S08` | Party Creation, Party Registration and Manifesto builder | Code-made SVG scene fallback |
| S09 | `scene.S09` | Finance and Bank Loan section | Code-made SVG scene fallback |
| S10 | `scene.S10` | Media & News newsroom section | Code-made SVG scene fallback |

The original requested S01.webp–S10.webp files were not present in either supplied source archive at the time of this build. The SVGs in `assets/scenes/` are intentional, code-authored fallbacks, not replacements masquerading as supplied photography. When the WebP files are supplied, update only the registry values and manifest entries; keep the same keys and strict placements.

## Portrait overlay rule

Interior scene artwork reserves its left third for one player portrait overlay. A scene may render at most one portrait overlay, positioned in that reserved area. The portrait is not repeated in a second overlay on the same scene.

## Existing asset groups

- B01–B10: player portrait picker; selected portrait overlay only.
- C01–C06: career background selection and profile.
- D01–D11: existing contextual thumbnails in their assigned sections.
- E01–E34: party emblems and flags only.
- G01–G12: event cards; missing event art uses the existing neutral icon fallback.

## Registry policy

`src/assets/registry.json` is the runtime source of truth. `assets/manifest.json` is the human-readable inventory. `scripts/check-assets.mjs` verifies every non-empty registry path and rejects hardcoded asset paths in source components.

# Test Checklist

## M01 — Project scaffold
- [ ] `npm install` completes in Termux.
- [ ] `npm test` passes.
- [ ] `npm run build` creates `dist/`.
- [ ] `npm run data:build` completes and clearly lists missing source files.
- [ ] Put a small CSV in `data-source/`, run converter and inspect JSON output.
- [ ] Open dev URL on phone; title and scaffold panel render.
- [ ] Check source CSV/XLSX originals are not overwritten.
- [ ] Confirm economy shares sum to 100 and revenue equals expenditure.

## Later device checks
- [ ] Realme C55 landscape layout and 12px minimum text.
- [ ] Touch targets >=44px; no unintended horizontal overflow.
- [ ] Offline/PWA behavior after service worker milestone.
- [ ] Save migration, export/restore and storage-failure handling.
- [ ] Profile image loading and 30+ FPS target on low-end phone.

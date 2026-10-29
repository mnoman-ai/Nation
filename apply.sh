#!/data/data/com.termux/files/usr/bin/bash
set -eu
mkdir -p src/{engine,screens,components,state,styles} data scripts public/assets/{images,emblems,textures} tests docs data-source .github/workflows
cat > package.json <<'EOF'
{
  "name":"nation-rise-to-power","version":"1.0.0","private":true,"type":"module",
  "scripts":{"dev":"vite --host 0.0.0.0","build":"vite build","preview":"vite preview --host 0.0.0.0","data:build":"node scripts/build-data.mjs","test":"node --test"},
  "dependencies":{"@phosphor-icons/react":"^2.1.10","chart.js":"^4.5.0","dexie":"^4.0.11","d3-geo":"^3.1.1","framer-motion":"^12.0.0","howler":"^2.2.4","i18next":"^25.0.0","react":"^19.0.0","react-dom":"^19.0.0","zustand":"^5.0.0"},
  "devDependencies":{"@vitejs/plugin-react":"^4.4.0","vite":"^6.0.0"}
}
EOF
cat > index.html <<'EOF'
<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><meta name="theme-color" content="#0b1424"/><meta name="description" content="Fictional political strategy and government simulation"/><title>NATION: RISE TO POWER</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>
EOF
cat > vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],publicDir:'public',build:{target:'es2020',assetsInlineLimit:2048,sourcemap:false},server:{host:'0.0.0.0',strictPort:true}});
EOF
cat > .gitignore <<'EOF'
node_modules/
dist/
*.log
.env
data-source/*
!data-source/README.md
!data-source/.gitkeep
EOF
touch data-source/.gitkeep
cat > data-source/README.md <<'EOF'
Copy original CSV/XLSX source files into this folder. Keep originals unchanged. Expected: POLITICAL_PARTIES_1.csv or POLITICAL_PARTIES.csv, PARTY_LEADERSHIP.csv, PARTY_STATE_UNITS.csv, STATES_REFERENCE.csv, CONSTITUENCIES.csv, CONSTITUENCY_SEAT_COUNTS.csv, DATA_DICTIONARY.csv, VALIDATION_REPORT.csv, CANDIDATES.csv, CANDIDATE_AFFILIATIONS.csv, ELECTION_CANDIDATURES.csv, NATION_CANDIDATES_AND_PARTIES.xlsx.
EOF
cat > src/styles/tokens.css <<'EOF'
:root {
 color-scheme:dark; font-family:Inter,"Noto Sans Devanagari",system-ui,sans-serif;
 --navy-950:#080f1c; --navy-900:#0b1424; --navy-850:#101d31; --navy-800:#14243a; --navy-700:#20334d;
 --gold-500:#c9a44c; --gold-400:#e0c16f; --gold-300:#f1d995;
 --cream-100:#f4efdf; --cream-200:#e8dfc8; --ink-900:#1c2430;
 --text-primary:#f5f0e3; --text-muted:#b6bfca; --success:#6ebc91; --warning:#e9b85d; --danger:#d87575;
 --border-gold:rgba(201,164,76,.46); --panel-glow:0 0 22px rgba(201,164,76,.08); --shadow-panel:0 12px 28px rgba(0,0,0,.28);
 --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:24px; --space-6:32px;
 --radius-sm:5px; --radius-md:9px; --radius-lg:14px; --touch-min:44px; --stage-width:1280; --stage-height:720;
 --font-logo:"Cinzel",Georgia,serif; --font-heading:"Playfair Display",Georgia,serif; --font-body:Inter,"Noto Sans Devanagari",system-ui,sans-serif;
}
*{box-sizing:border-box} html,body,#root{width:100%;min-height:100%;margin:0}
body{min-width:320px;background:var(--navy-950);color:var(--text-primary);font-family:var(--font-body);font-size:14px}
button,input,select,textarea{font:inherit} button{min-height:var(--touch-min)}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--gold-400);outline-offset:2px}
img{max-width:100%}
EOF
cat > src/styles/global.css <<'EOF'
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap');
.scaffold{min-height:100svh;display:grid;align-content:center;justify-items:center;gap:14px;padding:24px;background:radial-gradient(ellipse at 50% 0%,rgba(201,164,76,.16),transparent 55%),linear-gradient(145deg,var(--navy-900),var(--navy-950));text-align:center}
.eyebrow{color:var(--gold-400);letter-spacing:.16em;font-size:12px}
h1{margin:0;font:600 clamp(22px,4vw,42px)/1.2 var(--font-logo)} h1 span{color:var(--gold-400)}
.status{color:var(--text-muted)} .panel{width:min(100%,540px);padding:22px;border:1px solid var(--border-gold);border-radius:var(--radius-lg);background:linear-gradient(145deg,rgba(20,36,58,.96),rgba(11,20,36,.96));box-shadow:var(--shadow-panel),var(--panel-glow)}
.panel strong{color:var(--gold-300)} .panel p{line-height:1.6} .panel small{color:var(--text-muted)}
EOF
cat > src/main.jsx <<'EOF'
import React from 'react';
import {createRoot} from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
function ScaffoldCheck(){return <main className="scaffold"><p className="eyebrow">PROJECT SCAFFOLD · M01</p><h1>NATION: <span>RISE TO POWER</span></h1><p className="status">Foundation ready for the first UI milestone.</p><section className="panel"><strong>Milestone 01</strong><p>Project structure, design tokens and data pipeline scaffold are installed.</p><small>Gameplay simulation is not implemented in M01.</small></section></main>}
createRoot(document.getElementById('root')).render(<React.StrictMode><ScaffoldCheck/></React.StrictMode>);
EOF
cat > scripts/build-data.mjs <<'EOF'
import fs from 'node:fs/promises';
import path from 'node:path';
const sourceDir=path.resolve('data-source'), outDir=path.resolve('data');
const specs=[
 {names:['POLITICAL_PARTIES_1.csv','POLITICAL_PARTIES.csv'],out:'political-parties.json',key:'party_id'},
 {names:['PARTY_LEADERSHIP.csv'],out:'party-leadership.json'},
 {names:['PARTY_STATE_UNITS.csv'],out:'party-state-units.json'},
 {names:['STATES_REFERENCE.csv'],out:'states-reference.json',key:'state_id'},
 {names:['CONSTITUENCIES.csv'],out:'constituencies.json',key:'constituency_id'},
 {names:['CONSTITUENCY_SEAT_COUNTS.csv'],out:'constituency-seat-counts.json'},
 {names:['DATA_DICTIONARY.csv'],out:'data-dictionary.json'},
 {names:['VALIDATION_REPORT.csv'],out:'validation-report.json'},
 {names:['CANDIDATE_AFFILIATIONS.csv'],out:'candidate-affiliations.json'},
 {names:['ELECTION_CANDIDATURES.csv'],out:'election-candidatures.json'},
 {names:['CANDIDATES.csv'],out:'candidates.json',key:'candidate_id',large:true}
];
export function parseCsv(text){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];
  if(quoted){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++;}else quoted=false;}else field+=ch;}
  else if(ch==='"'&&field.length===0)quoted=true;
  else if(ch===','){row.push(field);field='';}
  else if(ch==='\n'){row.push(field.replace(/\r$/,''));if(row.some(v=>v.length))rows.push(row);row=[];field='';}
  else field+=ch;
 }
 if(field.length||row.length){row.push(field.replace(/\r$/,''));if(row.some(v=>v.length))rows.push(row);}
 if(!rows.length)return [];
 const headers=rows.shift().map(v=>v.replace(/^\uFEFF/,'').trim());
 return rows.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??''])));
}
async function main(){
 await fs.mkdir(outDir,{recursive:true});
 const manifest={generatedAt:new Date().toISOString(),generatedFiles:[],missingSources:[],notes:['Source CSV/XLSX files are user-provided.','Constituency seed names and boundaries are fictional, not official geography.','Financial capacity values are fictional game credits, not INR.','Large candidate lists should be queried on demand.']};
 for(const spec of specs){
  let source=null;
  for(const name of spec.names){try{await fs.access(path.join(sourceDir,name));source=path.join(sourceDir,name);break;}catch{}}
  if(!source){manifest.missingSources.push(spec.names[0]);continue;}
  const rows=parseCsv(await fs.readFile(source,'utf8'));
  if(spec.key){const seen=new Set();for(const r of rows){const id=r[spec.key];if(id&&seen.has(id))throw new Error(`Duplicate ${spec.key} "${id}" in ${path.basename(source)}`);if(id)seen.add(id);}}
  await fs.writeFile(path.join(outDir,spec.out),JSON.stringify(rows)+'\n');
  manifest.generatedFiles.push({file:spec.out,source:path.basename(source),records:rows.length,large:!!spec.large});
  console.log(`${path.basename(source)} -> data/${spec.out} (${rows.length} records)`);
 }
 const workbook=path.join(sourceDir,'NATION_CANDIDATES_AND_PARTIES.xlsx');
 try{await fs.access(workbook);try{const XLSX=await import('xlsx');const wb=XLSX.readFile(workbook);for(const name of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});const safe=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const file=`workbook-${safe}.json`;await fs.writeFile(path.join(outDir,file),JSON.stringify(rows)+'\n');manifest.generatedFiles.push({file,source:path.basename(workbook),sheet:name,records:rows.length});}}catch(e){console.warn('Workbook present but xlsx package unavailable. CSV conversion continued. To enable: npm install --save-dev xlsx');}}
 catch{}
 await fs.writeFile(path.join(outDir,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(`Data build done. Generated ${manifest.generatedFiles.length} JSON files.`);
 if(manifest.missingSources.length)console.log('Not present yet: '+manifest.missingSources.join(', '));
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) main().catch(e=>{console.error('Data build failed:',e.message);process.exitCode=1;});
EOF
cat > data/economy.json <<'EOF'
{
  "schemaVersion": 1,
  "currency": {"code":"GC","name":"Game Credits","note":"Fictional game currency, not INR."},
  "baseline": {
    "annualRevenue":4850000000000,
    "annualExpenditure":4850000000000,
    "defenceSharePercent":14,
    "healthSharePercent":8,
    "educationSharePercent":12,
    "infrastructureSharePercent":18,
    "socialWelfareSharePercent":20,
    "otherSharePercent":28
  },
  "sourceNote":"Internally consistent foundation values only. Tune during game balancing before release. All economy and budget screens must read this file rather than duplicating values."
}
EOF
cat > data/README.md <<'EOF'
Generated JSON is rebuilt from `data-source/` with `npm run data:build`. Do not manually edit generated files. `economy.json` is the single source of truth for initial economy/budget UI values. Candidate data must be queried on demand. Fictional constituency seeds must not be presented as official geography.
EOF
cat > src/engine/README.md <<'EOF'
M01 placeholder for pure game logic. Engine modules must not import UI/DOM code, should use injected seeded randomness instead of Math.random(), and should be deterministic/testable. Full simulation is not implemented in M01.
EOF
cat > src/screens/README.md <<'EOF'
One screen component per file. Screens compose shared components and read state/data through stores or data-access modules; do not hardcode dataset records inside screens.
EOF
cat > src/components/README.md <<'EOF'
Reusable UI components live here. Planned shared components: Card, ProgressBar, Donut, Navbar, SeatArc, Tabs and StatTile.
EOF
cat > src/state/README.md <<'EOF'
Zustand stores and save/load orchestration live here. Every persisted save must include saveVersion and migrate old versions before use.
EOF
cat > public/assets/ASSET_GUIDE.md <<'EOF'
Asset naming: A01-A10 hero WebP; B01-B11 player portrait WebP (B11 default Arjun Verma); C01-C06 career-origin WebP; D01-D11 section thumbnail WebP; G01-G12 event art arrives later; E01-E34 party emblem SVG. Put images in `public/assets/images/` and SVG emblems plus `party_emblems_index.json` in `public/assets/emblems/`. Keep artwork WebP, compressed, with no baked-in UI text. Party flags are composed in code from party colours and emblems.
EOF
cat > public/assets/images/README.md <<'EOF'
Copy supplied A/B/C/D WebP files here using their IDs. G01-G12 arrive later; use a consistent in-app placeholder until then.
EOF
cat > public/assets/emblems/README.md <<'EOF'
Copy supplied emblem SVGs and party_emblems_index.json here. Preserve exact IDs and filenames; flags are generated in code, not image files.
EOF
cat > tests/build-data.test.mjs <<'EOF'
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseCsv} from '../scripts/build-data.mjs';
test('CSV parser preserves commas and escaped quotes inside cells',()=>{
 const rows=parseCsv('id,name,note\n1,"Verma, Arjun","Said ""hello"""\n');
 assert.equal(rows.length,1);assert.equal(rows[0].name,'Verma, Arjun');assert.equal(rows[0].note,'Said "hello"');
});
test('economy shares total 100 and budget balances',async()=>{
 const e=JSON.parse(await readFile(new URL('../data/economy.json',import.meta.url),'utf8'));const b=e.baseline;
 assert.equal(b.defenceSharePercent+b.healthSharePercent+b.educationSharePercent+b.infrastructureSharePercent+b.socialWelfareSharePercent+b.otherSharePercent,100);
 assert.equal(b.annualRevenue,b.annualExpenditure);
});
EOF
cat > PROJECT_STATE.md <<'EOF'
# NATION: RISE TO POWER — Project State

## Release target
- Product version: `1.0.0` launch build; milestones M01–M14.
- Current milestone: `M01 — Project scaffold`.
- Target: Android (Termux development) + web/PWA.
- Plain JavaScript; approved stack only; 1280×720 landscape stage.

## M01 status
- [x] Vite + React scaffold and folder structure
- [x] Central design tokens in `src/styles/tokens.css`
- [x] CSV-to-JSON conversion script and optional XLSX import hook
- [x] Asset folders and naming guide
- [x] Economy/budget single source-of-truth foundation file
- [x] Initial automated tests and checklist
- [ ] Copy source CSV/XLSX files into `data-source/`
- [ ] Run install/build/tests on the user's Termux device

## Locked decisions
- Fictional parties, emblems, leaders, candidates, constituencies, events, laws and ministers.
- Real state/UT references and specified seat totals may be used; fictional constituency names/boundaries are never represented as official.
- Use only the approved stack in the Master Brief.
- Economy/budget screens must read `data/economy.json`.
- G01–G12 can be plugged in later with a placeholder until delivered.
- Preserve original data; generated JSON is rebuildable output.

## Known issues
- M01 is a scaffold, not the finished game; no simulation is implemented.
- CSVs not yet copied into `data-source/` will be reported missing by the converter.
- Workbook-only data needs optional `xlsx` package (`npm install --save-dev xlsx`).
- Economy values are consistent placeholder game-scale values, not final balance.
- Fonts currently load from Google Fonts; offline bundling is later work.
- 1280×720 scaler, navigation/router, save migrations and language toggle are M02.

## Next
M02 — App shell: stage scaler, top navbar/router, versioned save/load migrations, settings, English/Hindi toggle.
EOF
cat > TEST_CHECKLIST.md <<'EOF'
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
EOF
cat > .github/workflows/README.md <<'EOF'
GitHub Actions APK workflow is planned after Capacitor setup in a later milestone. M01 does not build an APK.
EOF
echo "M01 scaffold files written in: $(pwd)"
echo "Next commands: npm install && npm test && npm run build"

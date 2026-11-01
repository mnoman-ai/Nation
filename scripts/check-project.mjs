import fs from 'node:fs';
import path from 'node:path';

const required = [
  'index.html', 'package.json', 'src/main.jsx', 'src/state/store.js',
  'src/styles/index.css', 'assets/manifest.json', 'docs/ARCHITECTURE.md',
  'public/data/POLITICAL_PARTIES.json', 'public/data/player-candidates.json',
  'public/data/constituencies.json', 'public/data/candidate-distribution.json',
  'src/engine/v130/index.js', 'tests/v130-institutions.test.js',
];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error('Missing required project files:', missing.join('\n'));
  process.exit(1);
}

const parties = JSON.parse(fs.readFileSync('public/data/POLITICAL_PARTIES.json', 'utf8'));
const people = JSON.parse(fs.readFileSync('public/data/player-candidates.json', 'utf8'));
const constituencies = JSON.parse(fs.readFileSync('public/data/constituencies.json', 'utf8'));
const distribution = JSON.parse(fs.readFileSync('public/data/candidate-distribution.json', 'utf8'));
if (parties.length !== 34) throw new Error(`Expected 34 master parties, found ${parties.length}`);
if (people.length !== 12000) throw new Error(`Expected 12,000 people records, found ${people.length}`);
if (constituencies.length !== 4666) throw new Error(`Expected 4,666 constituencies, found ${constituencies.length}`);
if (distribution.totalSeats !== constituencies.length) throw new Error('Candidate distribution seat total does not match constituencies');

const manifest = JSON.parse(fs.readFileSync('assets/manifest.json', 'utf8'));
const missingAssets = [];
let slotCount = 0;
for (const [group, entries] of Object.entries(manifest)) {
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) continue;
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value !== 'string') continue;
    slotCount += 1;
    const file = group === 'emblems'
      ? `assets/emblems/${value.split('/').pop()}`
      : `assets/${value}`;
    if (!fs.existsSync(file)) missingAssets.push(`${group}.${key}: ${file}`);
  }
}
if (missingAssets.length) {
  console.error('Missing registered runtime assets:', missingAssets.join('\n'));
  process.exit(1);
}

const candidateCsv = fs.readdirSync('public/data').filter((name) => /^candidates-ST\d+\.csv$/.test(name));
if (candidateCsv.length < 28) throw new Error(`Expected candidate CSV partitions for the state/UT dataset; found ${candidateCsv.length}`);
console.log(`Project structure checked; ${parties.length} parties, ${people.length} people, ${constituencies.length} constituencies, ${candidateCsv.length} candidate CSV partitions and ${slotCount} asset slots verified.`);

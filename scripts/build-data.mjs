import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const sourceDir = path.join(root, 'data-source');
const outputDir = path.join(root, 'public/data');
const configDir = path.join(root, 'data');
fs.mkdirSync(outputDir, { recursive: true });

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  const text = String(input).replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value.length || row.length) {
    row.push(value);
    if (row.some((cell) => cell !== '')) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows.shift();
  return rows.map((cells) => Object.fromEntries(headers.map((key, index) => [key, cells[index] ?? ''])));
}

function readCsv(name) {
  const file = path.join(sourceDir, name);
  if (!fs.existsSync(file)) throw new Error(`Required source dataset is missing: ${file}`);
  return parseCsv(fs.readFileSync(file, 'utf8'));
}
function writeJson(name, value) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value)}\n`);
}
function stableKey(candidate) {
  return createHash('sha256').update(`${candidate.candidate_id}|NATION-v1.2.0`).digest('hex');
}

const parties = readCsv('POLITICAL_PARTIES.csv');
const states = readCsv('STATES_REFERENCE.csv');
const constituencies = readCsv('CONSTITUENCIES.csv');
const seatCounts = readCsv('CONSTITUENCY_SEAT_COUNTS.csv');
const leadership = readCsv('PARTY_LEADERSHIP.csv');
const candidates = readCsv('CANDIDATES.csv');

for (const [filename, rows] of [
  ['parties.json', parties], ['states.json', states], ['constituencies.json', constituencies],
  ['seat-counts.json', seatCounts], ['leadership.json', leadership],
]) writeJson(filename, rows);

const seatTotals = new Map();
for (const seat of constituencies) seatTotals.set(seat.state_ut_id, (seatTotals.get(seat.state_ut_id) || 0) + 1);
const totalSeats = [...seatTotals.values()].reduce((sum, value) => sum + value, 0);
const aiPool = candidates.filter((candidate) => candidate.control_type === 'AI_CONTROLLED');
const playerPool = candidates.filter((candidate) => candidate.control_type === 'PLAYER_CONTROLLED');
if (aiPool.length !== 33000) throw new Error(`Expected 33,000 AI candidates; found ${aiPool.length}`);
if (playerPool.length !== 12000) throw new Error(`Expected 12,000 player-pool candidates; found ${playerPool.length}`);
if (totalSeats !== 4666) throw new Error(`Expected 4,666 total seats; found ${totalSeats}`);

// Hamilton apportionment: state candidate totals are proportional to the actual
// constituency count. The source CSV is read-only; only generated JSON is changed.
const allocations = [...seatTotals].map(([stateId, seats]) => {
  const exact = seats * aiPool.length / totalSeats;
  return { stateId, seats, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
});
let remainder = aiPool.length - allocations.reduce((sum, item) => sum + item.count, 0);
allocations.sort((a, b) => b.remainder - a.remainder || a.stateId.localeCompare(b.stateId));
for (let i = 0; i < remainder; i += 1) allocations[i].count += 1;
allocations.sort((a, b) => a.stateId.localeCompare(b.stateId));

const orderedAi = aiPool.slice().sort((a, b) => stableKey(a).localeCompare(stableKey(b)));
let cursor = 0;
const index = {};
for (const allocation of allocations) {
  const rows = orderedAi.slice(cursor, cursor + allocation.count).map((candidate) => ({
    ...candidate,
    // Game assignment only; candidate profile fields and original source files stay untouched.
    state_id: allocation.stateId,
  }));
  cursor += allocation.count;
  writeJson(`candidates-${allocation.stateId}.json`, rows);
  index[allocation.stateId] = { count: rows.length, seats: allocation.seats, fairShare: allocation.seats * aiPool.length / totalSeats };
}
writeJson('player-candidates.json', playerPool);
writeJson('candidate-distribution.json', {
  aiCandidates: aiPool.length,
  playerCandidates: playerPool.length,
  totalSeats,
  candidatesPerSeatAverage: aiPool.length / totalSeats,
  allocationMethod: 'Hamilton largest remainder by state constituency count; deterministic candidate ordering',
  states: index,
});
writeJson('index.json', {
  candidateCount: aiPool.length,
  playerPoolCount: playerPool.length,
  states: Object.keys(index),
  partyCount: parties.length,
  constituencyCount: constituencies.length,
  distributionFile: 'candidate-distribution.json',
  playerPoolFile: 'player-candidates.json',
});

for (const file of fs.readdirSync(configDir).filter((name) => name.endsWith('.json'))) {
  fs.copyFileSync(path.join(configDir, file), path.join(outputDir, file));
}
console.log(`Built ${aiPool.length} AI candidates across ${allocations.length} states/UTs; retained ${playerPool.length} player-pool candidates separately.`);

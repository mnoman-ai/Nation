import { readFile } from 'node:fs/promises';
import { createNewGame } from '../src/engine/gameState.js';
import { tick } from '../src/engine/timeEngine.js';
import { getSeatTotals } from '../src/engine/election.js';

const readJson = (name, root = 'public/data') => readFile(new URL(`../${root}/${name}.json`, import.meta.url), 'utf8').then(JSON.parse);
const [parties, states, constituencies, seatCounts, partyStateUnits, partyLeadership, candidateIndex, balance, economy] = await Promise.all([
  readJson('POLITICAL_PARTIES'), readJson('STATES_REFERENCE'), readJson('CONSTITUENCIES'),
  readJson('CONSTITUENCY_SEAT_COUNTS'), readJson('PARTY_STATE_UNITS'), readJson('PARTY_LEADERSHIP'),
  readJson('candidate-index'), readJson('balance', 'data'), readJson('economy', 'data'),
]);
const smokeBalance = structuredClone(balance);
// Keep the 50-run 30-year smoke test bounded: each jurisdiction completes its first election,
// while the separate full-cycle test exercises recurring five-year elections.
smokeBalance.time.lokSabhaTermMonths = 360;
smokeBalance.time.assemblyTermMonths = 360;
const config = { parties, states, constituencies, seatCounts, partyStateUnits, partyLeadership, candidateIndex, balance: smokeBalance, economy };
const summaries = [];
for (let seed = 1; seed <= 50; seed += 1) {
  let state = tick(createNewGame(config, seed * 7919), 360);
  const result = state.latestResults.LOK_SABHA;
  if (!result) throw new Error(`No Lok Sabha result after 30 years (seed ${seed})`);
  const seatSum = Object.values(result.seatsByParty).reduce((sum, seats) => sum + seats, 0);
  if (seatSum !== 543) throw new Error(`Invalid national seat total ${seatSum} (seed ${seed})`);
  const partiesWithSeats = Object.values(result.seatsByParty).filter((seats) => seats > 0).length;
  const top = Object.entries(result.seatsByParty).sort((a, b) => b[1] - a[1])[0];
  if (partiesWithSeats < 5) throw new Error(`Only ${partiesWithSeats} parties won seats (seed ${seed})`);
  if (top[1] >= 543 * 0.9) throw new Error(`Trivial national sweep by ${top[0]} (${top[1]} seats, seed ${seed})`);
  const assemblyTotalsValid = state.states.filter((region) => region.assemblySeats > 0).every((region) => {
    const totals = getSeatTotals(state, 'ASSEMBLY', region.state_ut_id);
    return Object.values(totals).reduce((sum, value) => sum + value, 0) === region.assemblySeats;
  });
  if (!assemblyTotalsValid) throw new Error(`Assembly seat invariant failed (seed ${seed})`);
  summaries.push({ seed, topParty: top[0], partiesWithSeats, seatSum, assemblyTotalsValid });
  state.constituencies.length = 0;
  state.elections.length = 0;
  state.electionResults.length = 0;
  state.historyLog.length = 0;
  state.lastElectionResult = null;
  state.latestResults = null;
  state = null;
}
const topWinners = new Set(summaries.map((item) => item.topParty));
if (topWinners.size < 3) throw new Error(`National winner spread too narrow: ${[...topWinners].join(', ')}`);
process.stdout.write(JSON.stringify({ runs: summaries.length, uniqueTopParties: topWinners.size, topPartyCounts: Object.fromEntries([...topWinners].map((party) => [party, summaries.filter((item) => item.topParty === party).length])) }));

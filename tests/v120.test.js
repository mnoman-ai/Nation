import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { partitionCandidates } from '../src/engine/elections.js';
import { createSession, startSession, introduceBill, voteBill } from '../src/engine/legislature.js';
import { createWorld } from '../src/engine/GameEngine.js';
import { payMonthlySalary, setPlayerOffice, requestPartyLoan, startCampaign, stopCampaign, tickPartyLoans, processPartyLoanDeadlines } from '../src/engine/finance.js';
import { setMembershipFee, nominateCandidate } from '../src/engine/party.js';

const readJson = (file) => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));

test('v1.2.0 AI candidate distribution covers every seat with 4–8 candidates and reconciles totals', () => {
  const seats = readJson('../public/data/constituencies.json');
  const stateIds = [...new Set(seats.map((seat) => seat.state_ut_id))];
  const candidates = stateIds.flatMap((id) => readJson(`../public/data/candidates-${id}.json`));
  const playerPool = readJson('../public/data/player-candidates.json');
  const allocation = readJson('../public/data/candidate-distribution.json');
  const assigned = partitionCandidates(seats, candidates, 1200);
  const counts = [...assigned.values()].map((rows) => rows.length);
  assert.equal(candidates.length, 33000);
  assert.equal(playerPool.length, 12000);
  assert.equal(assigned.size, 4666);
  assert.equal(counts.reduce((sum, count) => sum + count, 0), 33000);
  assert.ok(counts.every((count) => count >= 4 && count <= 8));
  assert.equal(allocation.totalSeats, 4666);
  assert.equal(Object.values(allocation.states).reduce((sum, state) => sum + state.count, 0), 33000);
});

test('bill ministry mappings use the subject ministry rather than array index', () => {
  const bills = readJson('../data/bills.json');
  const ministryById = Object.fromEntries(bills.map((bill) => [bill.id, bill.ministry]));
  assert.equal(ministryById.BL01, 'Education');
  assert.equal(ministryById.BL03, 'Agriculture');
  assert.equal(ministryById.BL04, 'Health & Family Welfare');
});

test('voting is blocked for Draft bills and outside a live session', () => {
  const world = { time: { date: '2027-07-15T08:00:00.000Z' }, player: { reputation: 50 }, bills: [{ id: 'BL01', status: 'Draft', votes: [] }], sessions: [], government: {}, committees: {} };
  assert.throws(() => voteBill(world, 'BL01', 'yes'), /active legislative session/i);
  const session = createSession('2027-07-15', 'Monsoon');
  world.sessions.push(session);
  startSession(world, session.id);
  assert.throws(() => voteBill(world, 'BL01', 'yes'), /introduced before voting/i);
  introduceBill(world, 'BL01');
  const result = voteBill(world, 'BL01', 'yes');
  assert.equal(result.vote, 'yes');
  assert.equal(world.bills[0].status, 'Voted');
  assert.equal(session.votes.length, 1);
});

test('new game has no prefilled player identity and preserves B11 as default portrait', async () => {
  const data = {
    balance: readJson('../data/balance.json'), rules: readJson('../data/rules.json'),
    parties: readJson('../public/data/parties.json'), states: readJson('../public/data/states.json'),
    seatCounts: readJson('../public/data/seat-counts.json'), actions: readJson('../data/actions.json'),
    events: readJson('../data/events.json'), bills: readJson('../data/bills.json'),
    policies: readJson('../data/policies.json'), projects: readJson('../data/projects.json'),
    economy: readJson('../data/economy.json'), shocks: readJson('../data/shocks.json'), finance: readJson('../data/finance.json'),
    'voter-priorities': readJson('../data/voter-priorities.json'), 'ideology-fit': readJson('../data/ideology-fit.json'),
  };
  const world = createWorld(data);
  assert.equal(world.player.name, '');
  assert.equal(world.player.age, null);
  assert.equal(world.player.state, '');
  assert.equal(world.player.city, '');
  assert.equal(world.player.portrait, 'B11');
});

test('salary, elected-office party share, party loan and campaign contracts use rupee amounts', async () => {
  const data = {
    balance: readJson('../data/balance.json'), rules: readJson('../data/rules.json'),
    parties: readJson('../public/data/parties.json'), states: readJson('../public/data/states.json'),
    seatCounts: readJson('../public/data/seat-counts.json'), actions: readJson('../data/actions.json'),
    events: readJson('../data/events.json'), bills: readJson('../data/bills.json'),
    policies: readJson('../data/policies.json'), projects: readJson('../data/projects.json'),
    economy: readJson('../data/economy.json'), shocks: readJson('../data/shocks.json'), finance: readJson('../data/finance.json'),
  };
  const world = createWorld(data, { player: { partyId: 'NDP', status: 'Citizen', partyOffice: 'Party President' } });
  const citizenPay = payMonthlySalary(world);
  assert.equal(citizenPay.salary, 55000);
  setPlayerOffice(world, 'MLA');
  const beforeParty = world.partyFunds;
  const mlaPay = payMonthlySalary(world);
  assert.equal(mlaPay.salary, 300000);
  assert.equal(world.partyFunds - beforeParty, 195000);
  const loan = requestPartyLoan(world, 1000000);
  assert.equal(loan.principal, 1000000);
  assert.equal(world.partyFunds, beforeParty + 195000 + 1000000);
  const campaign = startCampaign(world, 'mediaBroadcasting', 4);
  assert.equal(campaign.prepaid, 400000);
  assert.equal(campaign.monthsRemaining, 4);
  stopCampaign(world, 'mediaBroadcasting');
});

test('party membership fee is bounded and candidate filing charges ₹5,000', async () => {
  const data = {
    balance: readJson('../data/balance.json'), rules: readJson('../data/rules.json'),
    parties: readJson('../public/data/parties.json'), states: readJson('../public/data/states.json'),
    seatCounts: readJson('../public/data/seat-counts.json'), actions: readJson('../data/actions.json'),
    events: readJson('../data/events.json'), bills: readJson('../data/bills.json'),
    policies: readJson('../data/policies.json'), projects: readJson('../data/projects.json'),
    economy: readJson('../data/economy.json'), shocks: readJson('../data/shocks.json'), finance: readJson('../data/finance.json'),
  };
  const world = createWorld(data, { player: { partyId: 'NDP', members: 12, partyOffice: 'Party President' } });
  assert.equal(setMembershipFee(world, 50000), 50000);
  assert.throws(() => setMembershipFee(world, 50001), /between ₹1 and ₹50,000/);
  world.partyFunds = 10000;
  const nomination = nominateCandidate(world, { seatId: 'ASM-ST01-001', candidateId: 'PC000001', contestId: 'ASM-ST01-2027' });
  assert.equal(nomination.status, 'Submitted');
  assert.equal(world.partyFunds, 5000);
});

test('rupee formatter uses lakh and crore units', async () => {
  const { formatRupees } = await import('../src/engine/format.js');
  assert.equal(formatRupees(55000), '₹55,000');
  assert.equal(formatRupees(1000000), '₹10.00 Lakh');
  assert.equal(formatRupees(100000000), '₹10.00 Cr');
  assert.equal(formatRupees(1000000000000), '₹1.00 Lakh Cr');
});

test('party loan defaults produce three quarterly warnings, a court notice and enforcement state', async () => {
  const finance = readJson('../data/finance.json');
  const world = { finance, time: { date: '2025-01-01T00:00:00.000Z' }, player: { partyId: 'NDP', money: 0, partyOffice: 'Party President' }, partyFunds: 0, partyLoans: [], notifications: [] };
  const loan = requestPartyLoan(world, 1000000);
  world.partyFunds = 0;
  // The loan matures after 24 months. Three quarterly warnings follow at
  // months 27, 30 and 33; the third warning opens a court case rather than
  // skipping the hearing and final seven-day repayment opportunity.
  for (let month = 1; month <= 33; month += 1) {
    world.time.date = new Date(Date.UTC(2025, month, 1)).toISOString();
    tickPartyLoans(world);
  }
  assert.equal(loan.warnings, 3);
  assert.equal(loan.status, 'Court Notice');
  assert.ok(world.notifications.some((item) => item.title.includes('Court notice')));
  world.time.date = `${loan.hearingDate}T00:00:00.000Z`;
  assert.equal(processPartyLoanDeadlines(world), 1);
  assert.ok(loan.hearingHeldAt);
  assert.equal(loan.status, 'Court Notice');
  world.time.date = loan.lastChanceDate;
  assert.equal(processPartyLoanDeadlines(world), 1);
  assert.equal(loan.status, 'Election Commission Action');
  assert.ok(world.notifications.some((item) => item.title.includes('Election Commission action')));
});

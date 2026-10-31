import { SAVE_VERSION } from './saveMigration.js';
import { seededRng, randomBetween } from './rng.js';
import { simulateElection } from './election.js';
import { applyGovernmentResult } from './government.js';

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const numericFields = [
  'national_strength', 'organisation_strength', 'public_support', 'leadership_strength',
  'financial_strength', 'candidate_quality', 'grassroots_network', 'media_influence',
  'internal_unity', 'factional_conflict', 'coalition_compatibility',
];

function normalizedParty(source, defaultPartyStat = 50) {
  const party = { ...source };
  for (const field of numericFields) party[field] = number(source[field], defaultPartyStat);
  party.scandalLevel = 0;
  return party;
}

function buildPartyStateUnits(units = []) {
  const result = {};
  for (const unit of units) result[`${unit.state_id}:${unit.party_id}`] = { ...unit };
  return result;
}

export function createNewGame(config, seed = 241024) {
  if (!config || !Array.isArray(config.parties) || !Array.isArray(config.states) || !Array.isArray(config.constituencies)) {
    throw new Error('createNewGame requires parties, states and constituencies in config');
  }
  const balance = config.balance;
  const economyConfig = config.economy;
  if (!balance || !economyConfig) throw new Error('createNewGame requires balance and economy data');
  const parties = config.parties.map((party) => normalizedParty(party, balance.simulation.defaultPartyStat));
  const allianceGroups = new Map();
  for (const party of parties) {
    const allianceId = party.initial_alliance_id;
    if (allianceId && allianceId !== 'NONE') {
      if (!allianceGroups.has(allianceId)) allianceGroups.set(allianceId, []);
      allianceGroups.get(allianceId).push(party.party_id);
    }
  }
  const seatCounts = new Map((config.seatCounts || []).map((item) => [item.state_ut_id, item]));
  const states = config.states.map((source, index) => {
    const seats = seatCounts.get(source.state_ut_id) || {};
    const assemblySeats = number(seats.assembly_seats, 0);
    const stagger = balance.time.assemblyStaggerRangeMonths > 0
      ? (index * balance.time.assemblyStaggerStepMonths) % balance.time.assemblyStaggerRangeMonths
      : 0;
    return {
      state_ut_id: source.state_ut_id,
      state_ut_name: source.state_ut_name,
      lokSabhaSeats: number(seats.lok_sabha_seats, 0),
      assemblySeats,
      assemblyApplicable: assemblySeats > 0,
      publicMood: number(economyConfig.initial.publicMood, balance.simulation.neutralMood),
      antiIncumbency: 0,
      nextAssemblyElectionMonth: assemblySeats > 0 ? balance.time.firstAssemblyElectionMonth + stagger : null,
    };
  });
  const constituencies = config.constituencies.map((source) => ({
    constituency_id: source.constituency_id,
    state_ut_id: source.state_ut_id,
    state_ut_name: source.state_ut_name,
    constituency_name: source.constituency_name,
    legislature_type: source.legislature_type,
    region: source.region,
    winnerPartyId: null,
    lastVoteShares: null,
  }));
  const constituencyIndicesByState = {};
  const constituencyIndicesByLegislature = { LOK_SABHA: [], ASSEMBLY: [] };
  const constituencyIndexById = {};
  constituencies.forEach((item, index) => {
    constituencyIndexById[item.constituency_id] = index;
    (constituencyIndicesByState[item.state_ut_id] ||= []).push(index);
    if (constituencyIndicesByLegislature[item.legislature_type]) constituencyIndicesByLegislature[item.legislature_type].push(index);
  });
  const rng = seededRng(seed);
  const seedCursor = Math.floor(rng() * 0xffffffff) >>> 0;
  const elections = [{
    id: 'LS-01', type: 'LOK_SABHA', stateId: null,
    scheduledMonth: balance.time.firstLokSabhaElectionMonth,
    phase: 'schedule', status: 'scheduled', snapElection: false,
  }];
  for (const state of states) {
    if (!state.assemblyApplicable) continue;
    elections.push({
      id: `AS-${state.state_ut_id}-01`, type: 'ASSEMBLY', stateId: state.state_ut_id,
      scheduledMonth: state.nextAssemblyElectionMonth,
      phase: 'schedule', status: 'scheduled', snapElection: false,
    });
  }
  const homeState = null;
  const month = balance.time.startMonth;
  const year = balance.time.startYear;
  const game = {
    saveVersion: SAVE_VERSION,
    seed: number(seed, balance.simulation.defaultSeed) >>> 0,
    rngState: seedCursor,
    player: {
      name: '', age: null, gender: '', origin: '',
      status: 'Citizen', careerStage: 'citizen', partyId: null, candidateId: null, isPartyLeader: false, candidacy: null,
      reputation: balance.career.startingReputation,
      influence: balance.career.startingInfluence,
      support: balance.career.startingSupport,
      skin: 0, money: economyConfig.startingPlayerFunds, campaignActions: [], electedTerms: 0,
      homeStateId: homeState?.state_ut_id || null,
    },
    world: {
      name: 'India', loadedCandidatesByState: {}, candidateIndex: config.candidateIndex || [],
      constituencyIndexById, constituencyIndicesByState, constituencyIndicesByLegislature,
      partyStateUnits: buildPartyStateUnits(config.partyStateUnits),
      partyLeadership: config.partyLeadership || [],
      mood: number(economyConfig.initial.publicMood, balance.simulation.neutralMood),
      economy: { ...economyConfig.initial },
      alliances: [...allianceGroups].map(([id, partyIds]) => ({ id, partyIds })),
      scandals: {},
    },
    parties,
    states,
    constituencies,
    government: { national: null, states: {}, pendingConfidenceMotions: [] },
    calendar: { monthIndex: 0, year, month, dateLabel: `${year}-${String(month).padStart(2, '0')}`, timeMode: balance.time.mode },
    elections,
    electionResults: [],
    lastElectionResult: null,
    latestResults: { LOK_SABHA: null, ASSEMBLY: {}, BY_ELECTION: null },
    historyLog: [{ monthIndex: 0, type: 'game_started', message: `New game started with seed ${number(seed, balance.simulation.defaultSeed) >>> 0}.` }],
    rules: { balance: structuredClone(balance), economy: structuredClone(economyConfig) },
  };
  // Force an explicit data integrity check at construction time, not after the first election.
  const lokSabhaCount = constituencies.filter((item) => item.legislature_type === 'LOK_SABHA').length;
  if (lokSabhaCount !== states.reduce((sum, item) => sum + item.lokSabhaSeats, 0)) {
    throw new Error(`Lok Sabha data mismatch: ${lokSabhaCount} constituencies in source data`);
  }
  const assemblyCounts = new Map();
  for (const item of constituencies) if (item.legislature_type === 'ASSEMBLY') assemblyCounts.set(item.state_ut_id, (assemblyCounts.get(item.state_ut_id) || 0) + 1);
  for (const state of states) {
    const actual = assemblyCounts.get(state.state_ut_id) || 0;
    if (actual !== state.assemblySeats) throw new Error(`Assembly data mismatch for ${state.state_ut_name}: expected ${state.assemblySeats}, found ${actual}`);
  }
  for (const party of game.parties) party.pollingModifier = randomBetween(game, -balance.election.nationalPollingSwingRange, balance.election.nationalPollingSwingRange);
  // Seed a coherent opening parliament and state assemblies from the supplied fictional party data.
  // This is the starting scenario, not a time advance or a recorded election event.
  const constituencyById = new Map(game.constituencies.map((item) => [item.constituency_id, item]));
  const baselineNational = simulateElection(game, { id: 'BASELINE-LOK-SABHA', type: 'LOK_SABHA', stateId: null });
  if (baselineNational) {
    for (const winner of baselineNational.winners) {
      const constituency = constituencyById.get(winner.constituencyId);
      if (constituency) { constituency.winnerPartyId = winner.winnerPartyId; constituency.lastVoteShares = baselineNational.voteShareByParty; }
    }
    const nationalGovernment = applyGovernmentResult(game, baselineNational);
    if (nationalGovernment) nationalGovernment.isOpeningScenario = true;
  }
  for (const region of game.states.filter((item) => item.assemblySeats > 0)) {
    const baselineAssembly = simulateElection(game, { id: `BASELINE-AS-${region.state_ut_id}`, type: 'ASSEMBLY', stateId: region.state_ut_id });
    if (!baselineAssembly) continue;
    for (const winner of baselineAssembly.winners) {
      const constituency = constituencyById.get(winner.constituencyId);
      if (constituency) { constituency.winnerPartyId = winner.winnerPartyId; constituency.lastVoteShares = baselineAssembly.voteShareByParty; }
    }
    const stateGovernment = applyGovernmentResult(game, baselineAssembly);
    if (stateGovernment) stateGovernment.isOpeningScenario = true;
  }
  game.historyLog.unshift({ monthIndex: 0, type: 'opening_scenario', message: 'Opening Parliament and state assembly compositions were seeded from the supplied party data.' });
  return game;
}

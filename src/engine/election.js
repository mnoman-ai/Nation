import { nextRandom, randomBetween } from './rng.js';

const numeric = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function allocateSeats(voteShares, totalSeats) {
  const seatsToAllocate = Math.max(0, Math.floor(numeric(totalSeats)));
  const entries = Object.entries(voteShares || {}).map(([id, value]) => [id, Math.max(0, numeric(value))]);
  const sum = entries.reduce((total, [, value]) => total + value, 0);
  if (!entries.length || seatsToAllocate === 0) return Object.fromEntries(entries.map(([id]) => [id, 0]));
  if (sum <= 0) {
    const output = Object.fromEntries(entries.map(([id]) => [id, 0]));
    for (let i = 0; i < seatsToAllocate; i += 1) output[entries[i % entries.length][0]] += 1;
    return output;
  }
  const exact = entries.map(([id, value]) => {
    const raw = value / sum * seatsToAllocate;
    return { id, raw, seats: Math.floor(raw) };
  });
  let remaining = seatsToAllocate - exact.reduce((total, item) => total + item.seats, 0);
  exact.sort((a, b) => (b.raw - b.seats) - (a.raw - a.seats) || a.id.localeCompare(b.id));
  for (let i = 0; i < remaining; i += 1) exact[i % exact.length].seats += 1;
  return Object.fromEntries(exact.map(({ id, seats }) => [id, seats]));
}

function stateUnitFor(state, stateId, partyId) {
  return state.world.partyStateUnits[`${stateId}:${partyId}`] || null;
}

function partyBaseScore(state, party, stateId, election) {
  const { weights, stateUnitWeights } = state.rules.balance.election;
  let weighted = 0;
  for (const [field, weight] of Object.entries(weights)) weighted += numeric(party[field], state.rules.balance.simulation.defaultPartyStat) * weight;
  const unit = stateUnitFor(state, stateId, party.party_id);
  let regional = 0;
  if (unit) {
    regional += numeric(unit.regional_public_support, state.rules.balance.simulation.defaultPartyStat) * stateUnitWeights.regional_public_support;
    regional += numeric(unit.organisation_strength, state.rules.balance.simulation.defaultPartyStat) * stateUnitWeights.organisation_strength;
    regional += numeric(unit.local_network_strength, state.rules.balance.simulation.defaultPartyStat) * stateUnitWeights.local_network_strength;
    regional += numeric(unit.campaign_capacity, state.rules.balance.simulation.defaultPartyStat) * stateUnitWeights.campaign_capacity;
    regional += Math.log10(Math.max(state.rules.balance.simulation.indexMinimum, numeric(unit.regional_financial_capacity, 1))) * state.rules.balance.election.regionalFinanceLogScale * stateUnitWeights.regional_financial_capacity;
    regional -= state.rules.balance.election.regionalFinanceOffset;
  }
  const region = state.states.find((item) => item.state_ut_id === stateId);
  const neutralMood = state.rules.balance.simulation.neutralMood;
  const mood = numeric(region?.publicMood, neutralMood) - neutralMood;
  weighted += regional;
  weighted += mood * state.rules.balance.election.stateMoodWeight * ((numeric(party.public_support, neutralMood) - neutralMood) / neutralMood);
  if (election.type !== 'BY_ELECTION' && region?.government?.rulingPartyIds?.includes(party.party_id)) {
    weighted -= numeric(region.antiIncumbency, 0) * state.rules.balance.election.antiIncumbencyPenalty;
  }
  weighted += numeric(party.pollingModifier, 0);
  const alliance = state.world.alliances.find((item) => item.partyIds.includes(party.party_id));
  if (alliance) weighted += state.rules.balance.election.allianceScoreBonus * Math.max(0, alliance.partyIds.length - 1);
  weighted += randomBetween(state, -state.rules.balance.election.statePollingSwingRange, state.rules.balance.election.statePollingSwingRange) * state.rules.balance.election.statePollingSwingWeight;
  weighted -= numeric(party.scandalLevel, 0) * state.rules.balance.simulation.scandalExposureFactor;
  for (const action of state.player.campaignActions || []) {
    if (action.partyId !== party.party_id || action.month < state.calendar.monthIndex - state.rules.balance.time.lokSabhaTermMonths) continue;
    if (action.stateId && action.stateId !== stateId) continue;
    const effects = state.rules.balance.election.campaignEffectWeights;
    weighted += numeric(action.support, 0) * effects.support + numeric(action.media, 0) * effects.media + numeric(action.organisation, 0) * effects.organisation + numeric(action.financial, 0) * effects.financial;
    if (action.moneySpent) weighted += Math.min(state.rules.balance.election.campaignMoneyImpactCap, Math.abs(action.moneySpent) / state.rules.balance.election.campaignMoneyImpactDivisor);
  }
  return weighted;
}

function sharesFromScores(scores, temperature, minimumShare) {
  const max = Math.max(...scores.map((item) => item.score));
  const values = scores.map((item) => ({ id: item.id, value: Math.exp((item.score - max) / Math.max(1, temperature)) }));
  const total = values.reduce((sum, item) => sum + item.value, 0);
  const shares = Object.fromEntries(values.map((item) => [item.id, Math.max(minimumShare, item.value / total)]));
  const normalizer = Object.values(shares).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(shares).map(([id, value]) => [id, value / normalizer]));
}

export function simulateElection(state, election) {
  const balance = state.rules.balance.election;
  const legislatureType = election.type === 'BY_ELECTION' ? election.legislatureType : election.type;
  const indices = election.type === 'BY_ELECTION'
    ? [state.world.constituencyIndexById[election.constituencyId]].filter((index) => Number.isInteger(index))
    : legislatureType === 'LOK_SABHA'
      ? state.world.constituencyIndicesByLegislature.LOK_SABHA
      : (state.world.constituencyIndicesByState[election.stateId] || []).filter((index) => state.constituencies[index]?.legislature_type === 'ASSEMBLY');
  const constituencies = indices.map((index) => state.constituencies[index]).filter(Boolean);
  if (!constituencies.length) return null;

  const seatsByParty = Object.fromEntries(state.parties.map((party) => [party.party_id, 0]));
  const aggregateVoteShares = Object.fromEntries(state.parties.map((party) => [party.party_id, 0]));
  const winners = [];
  const baseScoreCache = new Map();
  for (const constituency of constituencies) {
    if (!baseScoreCache.has(constituency.state_ut_id)) {
      baseScoreCache.set(constituency.state_ut_id, state.parties.map((party) => ({
        id: party.party_id,
        score: partyBaseScore(state, party, constituency.state_ut_id, election),
      })));
    }
    const baseScores = baseScoreCache.get(constituency.state_ut_id);
    const stateSwing = randomBetween(state, -balance.constituencyStateVariationRange, balance.constituencyStateVariationRange);
    const localScores = baseScores.map((item) => ({
      id: item.id,
      score: item.score + stateSwing + randomBetween(state, -balance.constituencySwingRange, balance.constituencySwingRange),
    }));
    const shares = sharesFromScores(localScores, balance.voteShareTemperature, balance.minimumVoteShare);
    for (const [partyId, share] of Object.entries(shares)) aggregateVoteShares[partyId] += share;
    const allianceMemberIds = new Set();
    const winningGroups = localScores.filter((item) => !state.world.alliances.some((alliance) => alliance.partyIds.includes(item.id)))
      .map((item) => ({ score: item.score, winnerPartyId: item.id }));
    for (const alliance of state.world.alliances) {
      const members = localScores.filter((item) => alliance.partyIds.includes(item.id)).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
      if (!members.length) continue;
      for (const member of members) allianceMemberIds.add(member.id);
      const maxScore = members[0].score;
      const pooledScore = maxScore + balance.voteShareTemperature * Math.log(members.reduce((sum, member) => sum + Math.exp((member.score - maxScore) / balance.voteShareTemperature), 0));
      winningGroups.push({ score: pooledScore, winnerPartyId: members[0].id });
    }
    winningGroups.sort((a, b) => b.score - a.score || a.winnerPartyId.localeCompare(b.winnerPartyId));
    const winnerPartyId = winningGroups[0].winnerPartyId;
    seatsByParty[winnerPartyId] += 1;
    winners.push({ constituencyId: constituency.constituency_id, stateId: constituency.state_ut_id, winnerPartyId });
  }
  const count = constituencies.length;
  const voteShareByParty = Object.fromEntries(Object.entries(aggregateVoteShares).map(([id, share]) => [id, share / count]));
  const result = {
    electionId: election.id,
    type: election.type,
    legislatureType: election.type === 'BY_ELECTION' ? election.legislatureType : election.type,
    stateId: election.stateId || null,
    constituencyId: election.constituencyId || null,
    monthIndex: state.calendar.monthIndex,
    totalSeats: constituencies.length,
    seatsByParty,
    voteShareByParty,
    winners,
  };
  if (Object.values(seatsByParty).reduce((sum, value) => sum + value, 0) !== result.totalSeats) {
    throw new Error(`Seat allocation invariant failed for ${election.id}`);
  }
  return result;
}

export function getSeatTotals(state, type, stateId = null) {
  const total = Object.fromEntries(state.parties.map((party) => [party.party_id, 0]));
  for (const constituency of state.constituencies) {
    if (type === 'LOK_SABHA' && constituency.legislature_type !== 'LOK_SABHA') continue;
    if (type === 'ASSEMBLY' && (constituency.legislature_type !== 'ASSEMBLY' || constituency.state_ut_id !== stateId)) continue;
    if (constituency.winnerPartyId && Object.hasOwn(total, constituency.winnerPartyId)) total[constituency.winnerPartyId] += 1;
  }
  return total;
}

export function currentVoteShare(state, stateId = null) {
  const totals = Object.fromEntries(state.parties.map((party) => [party.party_id, 0]));
  for (const constituency of state.constituencies) {
    if (stateId && constituency.state_ut_id !== stateId) continue;
    const result = constituency.lastVoteShares;
    if (!result) continue;
    for (const [partyId, share] of Object.entries(result)) if (Object.hasOwn(totals, partyId)) totals[partyId] += numeric(share);
  }
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  return total ? Object.fromEntries(Object.entries(totals).map(([id, value]) => [id, value / total])) : totals;
}

export function constituencySwingForTest(state, stateId) {
  return randomBetween(state, -state.rules.balance.election.constituencySwingRange, state.rules.balance.election.constituencySwingRange);
}

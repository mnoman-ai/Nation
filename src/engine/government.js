const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function ideologyCompatibility(left = '', right = '', bonus = 14) {
  const a = String(left).toLowerCase();
  const b = String(right).toLowerCase();
  const leftTokens = new Set(a.split(/[^a-z]+/).filter(Boolean));
  const rightTokens = new Set(b.split(/[^a-z]+/).filter(Boolean));
  const overlap = [...leftTokens].some((token) => rightTokens.has(token));
  const broadLeft = /left|social|progressive|green|reform/.test(a);
  const broadRight = /left|social|progressive|green|reform/.test(b);
  const conservativeLeft = /right|nationalist|cultural|agrarian/.test(a);
  const conservativeRight = /right|nationalist|cultural|agrarian/.test(b);
  if (overlap || (broadLeft && broadRight) || (conservativeLeft && conservativeRight)) return bonus;
  return 0;
}

function compatibility(state, partyA, partyB) {
  const configured = state.rules.balance.government;
  const a = state.parties.find((party) => party.party_id === partyA);
  const b = state.parties.find((party) => party.party_id === partyB);
  if (!a || !b) return 0;
  return (numeric(a.coalition_compatibility, state.rules.balance.simulation.defaultPartyStat) + numeric(b.coalition_compatibility, state.rules.balance.simulation.defaultPartyStat)) / 2
    + ideologyCompatibility(a.ideology, b.ideology, configured.ideologyCompatibilityBonus);
}

export function formGovernment(state, electionResult) {
  const seatCounts = electionResult.seatsByParty || {};
  const parties = [...state.parties].sort((a, b) => numeric(seatCounts[b.party_id]) - numeric(seatCounts[a.party_id]) || a.party_id.localeCompare(b.party_id));
  const totalSeats = numeric(electionResult.totalSeats, Object.values(seatCounts).reduce((sum, seats) => sum + numeric(seats), 0));
  const majority = Math.floor(totalSeats / 2) + state.rules.balance.government.majorityBuffer;
  const first = parties[0];
  if (!first || totalSeats <= 0) return null;
  const coalition = [first.party_id];
  let coalitionSeats = numeric(seatCounts[first.party_id]);
  const remaining = parties.slice(1).sort((a, b) => {
    const scoreA = compatibility(state, first.party_id, a.party_id) + numeric(seatCounts[a.party_id]) / Math.max(1, totalSeats) * 100;
    const scoreB = compatibility(state, first.party_id, b.party_id) + numeric(seatCounts[b.party_id]) / Math.max(1, totalSeats) * 100;
    return scoreB - scoreA || a.party_id.localeCompare(b.party_id);
  });
  for (const candidate of remaining) {
    if (coalitionSeats >= majority) break;
    const score = compatibility(state, coalition[0], candidate.party_id);
    if (score >= state.rules.balance.government.coalitionCompatibilityMinimum || coalitionSeats + numeric(seatCounts[candidate.party_id]) >= majority) {
      coalition.push(candidate.party_id);
      coalitionSeats += numeric(seatCounts[candidate.party_id]);
    }
  }
  // If no viable coalition can cross the majority line, the largest party forms a minority government.
  const rulingPartyIds = coalitionSeats >= majority ? coalition : [first.party_id];
  coalitionSeats = rulingPartyIds.reduce((sum, id) => sum + numeric(seatCounts[id]), 0);
  const oppositionPartyIds = parties.map((party) => party.party_id).filter((id) => !rulingPartyIds.includes(id) && numeric(seatCounts[id]) > 0);
  const leaderParty = state.parties.find((party) => party.party_id === rulingPartyIds[0]);
  const playerLeadsRulingParty = state.player.isPartyLeader && state.player.partyId === rulingPartyIds[0];
  return {
    formed: true,
    jurisdiction: electionResult.type === 'LOK_SABHA' ? 'NATIONAL' : electionResult.type === 'BY_ELECTION' ? (electionResult.legislatureType === 'LOK_SABHA' ? 'NATIONAL' : 'STATE') : 'STATE',
    stateId: electionResult.stateId || null,
    electionId: electionResult.electionId,
    formedMonth: state.calendar.monthIndex,
    totalSeats,
    majorityMark: majority,
    rulingPartyIds,
    coalitionSeats,
    majorityAchieved: coalitionSeats >= majority,
    leaderPartyId: rulingPartyIds[0],
    leaderCandidateId: playerLeadsRulingParty ? 'PLAYER' : leaderParty?.initial_leader_id || null,
    primeMinister: electionResult.type === 'LOK_SABHA' || (electionResult.type === 'BY_ELECTION' && electionResult.legislatureType === 'LOK_SABHA')
      ? { partyId: rulingPartyIds[0], candidateId: playerLeadsRulingParty ? 'PLAYER' : leaderParty?.initial_leader_id || null, title: 'Prime Minister' }
      : null,
    chiefMinister: electionResult.type === 'ASSEMBLY' || (electionResult.type === 'BY_ELECTION' && electionResult.legislatureType === 'ASSEMBLY')
      ? { partyId: rulingPartyIds[0], candidateId: playerLeadsRulingParty ? 'PLAYER' : leaderParty?.initial_leader_id || null, title: 'Chief Minister' }
      : null,
    oppositionPartyIds,
    confidence: coalitionSeats / totalSeats,
    dissolved: false,
  };
}

export function applyGovernmentResult(state, electionResult) {
  const government = formGovernment(state, electionResult);
  if (!government) return state;
  if (government.jurisdiction === 'NATIONAL') state.government.national = government;
  else state.government.states[electionResult.stateId] = government;
  return government;
}

export function queueConfidenceMotion(state, { stateId = null, votesFor = 0 } = {}) {
  state.government.pendingConfidenceMotions.push({ stateId, votesFor: numeric(votesFor), requestedMonth: state.calendar.monthIndex });
  return state;
}

export function resolveConfidenceMotions(state) {
  const pending = state.government.pendingConfidenceMotions.splice(0);
  const dissolved = [];
  for (const motion of pending) {
    const government = motion.stateId ? state.government.states[motion.stateId] : state.government.national;
    if (!government || government.dissolved) continue;
    const required = Math.floor(government.totalSeats * state.rules.balance.government.confidenceMotionThreshold) + state.rules.balance.government.majorityBuffer;
    if (motion.votesFor < required) {
      government.dissolved = true;
      government.dissolvedMonth = state.calendar.monthIndex;
      government.dissolutionReason = 'Lost confidence motion';
      const target = motion.stateId
        ? state.elections.find((election) => election.type === 'ASSEMBLY' && election.stateId === motion.stateId)
        : state.elections.find((election) => election.type === 'LOK_SABHA');
      if (target) {
        target.status = 'scheduled';
        target.phase = 'schedule';
        target.scheduledMonth = state.calendar.monthIndex + 1;
        target.snapElection = true;
      }
      dissolved.push({ stateId: motion.stateId, electionId: target?.id || null });
      state.historyLog.unshift({ monthIndex: state.calendar.monthIndex, type: 'government_dissolved', stateId: motion.stateId, message: `${motion.stateId ? 'State' : 'National'} government lost a confidence motion.` });
    }
  }
  return dissolved;
}

export function setAlliance(state, { id, partyIds }) {
  const uniquePartyIds = [...new Set(partyIds || [])];
  if (!id || uniquePartyIds.length < 2) throw new Error('An alliance needs an id and at least two parties');
  if (uniquePartyIds.some((partyId) => !state.parties.some((party) => party.party_id === partyId))) throw new Error('Alliance contains an unknown party');
  state.world.alliances = state.world.alliances.filter((alliance) => !alliance.partyIds.some((partyId) => uniquePartyIds.includes(partyId)));
  state.world.alliances.push({ id, partyIds: uniquePartyIds });
  state.historyLog.unshift({ monthIndex: state.calendar.monthIndex, type: 'alliance_registered', message: `Alliance ${id} registered.` });
  return state;
}

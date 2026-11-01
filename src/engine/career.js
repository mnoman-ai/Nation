const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function recordCampaignAction(state, { type, stateId = null, partyId = state.player.partyId } = {}) {
  if (type === 'fundraise' || type === 'donate' || type === 'sponsor') throw new Error('Donations, donor deals and fundraising are disabled by the v1.3.0 finance rules');
  const action = state.rules.balance.election.campaignActions[type];
  if (!action) throw new Error(`Unknown campaign action: ${type}`);
  if (!partyId || !state.parties.some((party) => party.party_id === partyId)) throw new Error('A valid party membership is required for campaign actions');
  const cost = Math.max(0, Number(action.money) || 0);
  if (cost > state.player.money) throw new Error('Insufficient campaign funds');
  state.player.money -= cost;
  const effect = {
    id: `CA-${state.calendar.monthIndex}-${state.player.campaignActions.length + 1}`,
    type,
    partyId,
    stateId,
    month: state.calendar.monthIndex,
    support: Number(action.support) || 0,
    media: Number(action.media) || 0,
    organisation: Number(action.organisation) || 0,
    financial: Number(action.financial) || 0,
    moneySpent: cost,
  };
  state.player.campaignActions.push(effect);
  state.historyLog.unshift({ monthIndex: state.calendar.monthIndex, type: 'campaign_action', message: `${type} campaign action recorded for ${partyId}.` });
  return state;
}

export function nominatePlayer(state, { electionId, constituencyId }) {
  const election = state.elections.find((item) => item.id === electionId && item.status !== 'completed');
  const constituency = state.constituencies.find((item) => item.constituency_id === constituencyId);
  if (!election || !constituency) throw new Error('Election or constituency not found');
  if (!state.player.partyId) throw new Error('Join a party before nomination');
  if (election.type === 'LOK_SABHA' && constituency.legislature_type !== 'LOK_SABHA') throw new Error('Select a Lok Sabha constituency');
  if (election.type === 'ASSEMBLY' && (constituency.legislature_type !== 'ASSEMBLY' || constituency.state_ut_id !== election.stateId)) throw new Error('Select a constituency in the scheduled state');
  state.player.candidacy = { electionId, constituencyId, partyId: state.player.partyId, nominatedMonth: state.calendar.monthIndex };
  state.player.careerStage = 'candidate';
  state.player.status = 'Candidate';
  state.historyLog.unshift({ monthIndex: state.calendar.monthIndex, type: 'player_nominated', message: `${state.player.name} nominated for ${constituency.constituency_name}.` });
  return state;
}

export function evaluateCareer(state, electionResult = null) {
  const player = state.player;
  const rules = state.rules.balance.career;
  if (!player.partyId) {
    player.careerStage = 'citizen';
    player.status = 'Citizen';
    return player.careerStage;
  }
  if (player.careerStage === 'citizen' || !player.careerStage) {
    player.careerStage = 'party_worker';
    player.status = 'Party Worker';
  }
  if (Number(player.influence) >= rules.candidateInfluence && player.candidacy) {
    player.careerStage = 'candidate';
    player.status = 'Candidate';
  }
  if (electionResult && player.candidacy?.electionId === electionResult.electionId) {
    const won = electionResult.winners?.some((winner) => winner.constituencyId === player.candidacy.constituencyId && winner.winnerPartyId === player.partyId);
    if (won) {
      const constituency = state.constituencies.find((item) => item.constituency_id === player.candidacy.constituencyId);
      player.careerStage = constituency?.legislature_type === 'LOK_SABHA' ? 'mp' : 'mla';
      player.status = player.careerStage === 'mp' ? 'MP' : 'MLA';
      player.electedTerms = (player.electedTerms || 0) + 1;
      player.reputation = clamp(Number(player.reputation) + rules.electionWinReputationBonus, rules.attributeMinimum, rules.attributeMaximum);
      player.influence = clamp(Number(player.influence) + rules.electionWinInfluenceBonus, rules.attributeMinimum, rules.attributeMaximum);
    }
    player.candidacy = null;
  }
  const national = state.government.national;
  const stateGovernment = state.government.states[player.homeStateId];
  const elected = ['mp', 'mla', 'minister', 'chief_minister', 'prime_minister'].includes(player.careerStage);
  const hasExecutivePath = player.careerStage === 'mp' ? national?.rulingPartyIds?.includes(player.partyId) : stateGovernment?.rulingPartyIds?.includes(player.partyId);
  if (elected && hasExecutivePath && Number(player.reputation) >= rules.ministerReputation && Number(player.support) >= rules.ministerSupport) {
    player.careerStage = 'minister';
    player.status = 'Minister';
  }
  if (national?.leaderCandidateId && national.leaderCandidateId === player.candidateId && Number(player.reputation) >= rules.executiveReputation && Number(player.support) >= rules.executiveSupport) {
    player.careerStage = 'prime_minister';
    player.status = 'Prime Minister';
  } else if (stateGovernment?.leaderCandidateId && stateGovernment.leaderCandidateId === player.candidateId && Number(player.reputation) >= rules.executiveReputation && Number(player.support) >= rules.executiveSupport) {
    player.careerStage = 'chief_minister';
    player.status = 'Chief Minister';
  }
  return player.careerStage;
}

export function setPlayerPartyLeadership(state, partyId = state.player.partyId) {
  if (!partyId || partyId !== state.player.partyId) throw new Error('Player must be a member of the selected party');
  if (Number(state.player.influence) < state.rules.balance.career.candidateInfluence) throw new Error('Insufficient influence to lead a party');
  state.player.isPartyLeader = true;
  state.player.candidateId = 'PLAYER';
  state.historyLog.unshift({ monthIndex: state.calendar.monthIndex, type: 'player_party_leader', message: `${state.player.name} became the recognised leader of ${partyId}.` });
  return state;
}

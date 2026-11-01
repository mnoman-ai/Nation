import { addNotification, ensureV130, nextId, addDays } from './shared.js';

export function issueElectionNotice(world, notice) {
  const record = { id: nextId(world, 'EC-NOTICE'), title: String(notice.title || '').trim(), body: String(notice.body || '').trim(), electionId: notice.electionId || null, issuedAt: world.time.date, priority: notice.priority || 'normal' };
  if (!record.title || !record.body) throw new Error('Notice title and body are required');
  ensureV130(world).electionNotices.unshift(record);
  addNotification(world, { id: record.id, title: record.title, body: record.body, type: 'Election Commission', priority: record.priority, target: 'Elections' });
  return record;
}

export function submitCandidateNomination(world, payload) {
  const election = world.elections?.find((item) => item.id === payload.electionId);
  if (!election) throw new Error('Election not found');
  if (!payload.constituencyId || !payload.candidateId) throw new Error('Constituency and candidate are required');
  const today = world.time.date.slice(0, 10);
  if (election.nominationOpenDate && today < election.nominationOpenDate) throw new Error(`Nomination filing opens on ${election.nominationOpenDate}`);
  if (election.nominationCloseDate && today > election.nominationCloseDate) throw new Error('The Election Commission nomination deadline has passed');
  const partyId = payload.partyId || world.player.partyId;
  if (!partyId || partyId === 'NONE' || partyId !== world.player.partyId) throw new Error('You may file nominations only for your own political party');
  const party = world.parties.find((item) => item.party_id === partyId);
  const isLeader = party?.leaderId === 'PLAYER' || world.player.partyOffice === 'Party President' || world.player.partyPresident === true;
  if (!isLeader) throw new Error('Only the party president or authorised party leader may select candidates');
  if (payload.candidateId !== 'PLAYER') {
    const candidate = (world.partyMembers || []).find((item) => item.candidate_id === payload.candidateId);
    if (!candidate || candidate.initial_party_id !== partyId) throw new Error('Candidate must be recruited into your own party from the People register');
    if (Number(candidate.age) < Number(world.rules?.minCandidateAge || 25)) throw new Error('Candidate does not meet the minimum age requirement');
  }
  const existing = ensureV130(world).candidateNominations.find((item) => item.electionId === payload.electionId && item.constituencyId === payload.constituencyId && item.partyId === partyId && item.status !== 'Withdrawn');
  if (existing) throw new Error('This party already has a nomination in the selected constituency');
  const fee = Number(world.balance?.v130?.candidateNominationFee || 5000);
  const partyFunded = true;
  const available = Number(world.partyFunds || 0);
  if (available < fee) throw new Error('Candidate nomination filing fee is ₹5,000');
  if (partyFunded) world.partyFunds -= fee; else world.player.money -= fee;
  const nomination = { id: nextId(world, 'NOM'), electionId: election.id, constituencyId: payload.constituencyId, candidateId: payload.candidateId, partyId, submittedAt: world.time.date, scrutinyDate: payload.scrutinyDate || election.scrutinyDate || addDays(world.time.date, 2), withdrawalDeadline: payload.withdrawalDeadline || election.withdrawalDeadline || addDays(world.time.date, 5), status: 'Submitted', scrutinyReason: '' };
  ensureV130(world).candidateNominations.push(nomination);
  return nomination;
}

export function scrutiniseNomination(world, nominationId, decision, reason = '') {
  const nomination = ensureV130(world).candidateNominations.find((item) => item.id === nominationId);
  if (!nomination || nomination.status !== 'Submitted') throw new Error('Submitted nomination not found');
  if (world.time.date.slice(0, 10) < nomination.scrutinyDate) throw new Error(`Nomination scrutiny is scheduled for ${nomination.scrutinyDate}`);
  if (!['Approved', 'Rejected'].includes(decision)) throw new Error('Nomination decision must be Approved or Rejected');
  nomination.status = decision;
  nomination.scrutinyReason = reason;
  if (decision === 'Approved') {
    world.nominations ??= [];
    const duplicate = world.nominations.some((item) => item.contestId === nomination.electionId && item.seatId === nomination.constituencyId && item.partyId === nomination.partyId);
    if (!duplicate) world.nominations.push({ seatId: nomination.constituencyId, candidateId: nomination.candidateId, partyId: nomination.partyId, contestId: nomination.electionId, status: 'Approved', nominationId: nomination.id });
  }
  nomination.decidedAt = world.time.date;
  return nomination;
}

export function withdrawNomination(world, nominationId) {
  const nomination = ensureV130(world).candidateNominations.find((item) => item.id === nominationId);
  if (!nomination || !['Submitted', 'Approved'].includes(nomination.status)) throw new Error('Nomination cannot be withdrawn');
  if (world.time.date.slice(0, 10) > nomination.withdrawalDeadline) throw new Error('Nomination withdrawal deadline has passed');
  nomination.status = 'Withdrawn';
  nomination.withdrawnAt = world.time.date;
  world.nominations = (world.nominations || []).filter((item) => item.nominationId !== nomination.id);
  return nomination;
}

export function certifyElectionResult(world, electionId) {
  const election = world.elections?.find((item) => item.id === electionId);
  if (!election || !election.resultPublished || !election.result) throw new Error('Published election result is required for certification');
  if (election.certifiedAt) throw new Error('Election result has already been certified');
  election.certifiedAt = world.time.date;
  election.certificationStatus = 'Certified';
  const tally = Object.entries(election.result.seatTally || {}).sort((a, b) => b[1] - a[1]);
  const top = tally[0];
  addNotification(world, { id: `EC-CERT-${election.id}`, title: 'Election result certified', body: `${election.stateName || 'Lok Sabha'} result certified. Leading party: ${top?.[0] || 'No party'} (${top?.[1] || 0} seats).`, type: 'Election Commission', priority: 'high', target: 'Elections' });
  return { electionId, certifiedAt: election.certifiedAt, seatTally: election.result.seatTally };
}

export function processCandidateNominationDeadlines(world) {
  const today = world.time.date.slice(0, 10);
  const institutions = ensureV130(world);
  let processed = 0;
  for (const nomination of institutions.candidateNominations) {
    if (nomination.status !== 'Submitted' || nomination.scrutinyDate > today) continue;
    const candidate = nomination.candidateId === 'PLAYER' ? world.player : (world.partyMembers || []).find((item) => item.candidate_id === nomination.candidateId);
    const party = world.parties.find((item) => item.party_id === nomination.partyId);
    const valid = !!candidate && !!party && (nomination.candidateId === 'PLAYER' || candidate.initial_party_id === nomination.partyId) && Number(candidate.age ?? 25) >= Number(world.rules?.minCandidateAge || 25);
    scrutiniseNomination(world, nomination.id, valid ? 'Approved' : 'Rejected', valid ? 'Candidate identity, party affiliation and eligibility verified by the Election Commission.' : 'Candidate eligibility or party affiliation could not be verified.');
    processed += 1;
  }
  for (const election of world.elections || []) {
    if (election.withdrawalDeadline && today >= election.withdrawalDeadline && !election.finalCandidateListPublishedAt) {
      election.finalCandidateList = institutions.candidateNominations.filter((item) => item.electionId === election.id && item.status === 'Approved').map((item) => ({ nominationId: item.id, constituencyId: item.constituencyId, candidateId: item.candidateId, partyId: item.partyId }));
      election.finalCandidateListPublishedAt = world.time.date;
      addNotification(world, { id: `EC-FINAL-LIST-${election.id}`, title: 'Final candidate list published', body: `${election.finalCandidateList.length} approved party nominations appear on the final candidate list for ${election.stateName || 'Lok Sabha'}.`, type: 'Election Commission', priority: 'high', target: 'Elections' });
      processed += 1;
    }
  }
  return processed;
}

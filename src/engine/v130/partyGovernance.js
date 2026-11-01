import { addNotification, ensureV130, nextId, requireParty, clamp } from './shared.js';

export function startLeadershipElection(world, partyId = world.player.partyId) {
  const party = requireParty(world, partyId);
  const election = { id: nextId(world, 'INTERNAL-ELECTION'), partyId, type: 'President', openedAt: world.time.date, status: 'Open', candidates: [{ candidateId: 'PLAYER', score: Number(world.player.influence || 0) + Number(world.player.reputation || 0) + Number(world.player.attributes?.leadership || 0) }], result: null };
  ensureV130(world).internalElections.push(election);
  party.internalElectionActive = election.id;
  addNotification(world, { id: `PARTY-ELECTION-${election.id}`, title: 'Internal party election opened', body: `${party.party_name} has opened an internal leadership election.`, type: 'Party', target: 'Party HQ' });
  return election;
}

export function nominateInternalCandidate(world, electionId, candidate) {
  const election = ensureV130(world).internalElections.find((item) => item.id === electionId && item.status === 'Open');
  if (!election) throw new Error('Open internal election not found');
  const id = String(candidate?.candidateId || '').trim();
  if (!id || election.candidates.some((item) => item.candidateId === id)) throw new Error('Candidate ID is missing or already nominated');
  if (id !== 'PLAYER' && !(world.partyMembers || []).some((member) => member.candidate_id === id && member.initial_party_id === election.partyId)) throw new Error('Leadership candidate must be a recruited member of this party');
  election.candidates.push({ candidateId: id, score: clamp(candidate.score), loyalty: clamp(candidate.loyalty ?? 50), support: clamp(candidate.support ?? 50) });
  return election;
}

export function resolveInternalElection(world, electionId) {
  const election = ensureV130(world).internalElections.find((item) => item.id === electionId && item.status === 'Open');
  if (!election || election.candidates.length < 1) throw new Error('Internal election cannot be resolved');
  const winner = [...election.candidates].sort((a, b) => (b.score + (b.loyalty || 0) * 0.2 + (b.support || 0) * 0.2) - (a.score + (a.loyalty || 0) * 0.2 + (a.support || 0) * 0.2))[0];
  election.status = 'Completed';
  election.result = { winnerId: winner.candidateId, resolvedAt: world.time.date, tally: election.candidates.map((item) => ({ candidateId: item.candidateId, score: item.score, loyalty: item.loyalty || 0, support: item.support || 0 })) };
  const party = requireParty(world, election.partyId);
  party.leaderId = winner.candidateId;
  party.leadership_strength = winner.score;
  if (winner.candidateId === 'PLAYER') {
    world.player.partyPresident = true;
    world.player.partyOffice = 'Party President';
    world.player.status = 'Party President';
    party.officeBearers ??= {}; party.officeBearers['Party President'] = 'PLAYER';
  } else if (world.player.partyId === election.partyId && world.player.partyPresident) {
    world.player.partyPresident = false;
    world.player.partyOffice = 'Party Member';
    world.player.status = 'Party Member';
  }
  return election.result;
}

export function formPartyFaction(world, { name, partyId = world.player.partyId, platform }) {
  const party = requireParty(world, partyId);
  const factionName = String(name || '').trim();
  if (!factionName) throw new Error('Faction name is required');
  const institutions = ensureV130(world);
  if (institutions.partyFactions.some((item) => item.partyId === partyId && item.name.toLowerCase() === factionName.toLowerCase() && item.status === 'Active')) throw new Error('An active faction with this name already exists');
  const faction = { id: nextId(world, 'FACTION'), partyId, name: factionName, platform: String(platform || '').trim(), foundedAt: world.time.date, founder: world.player.name, status: 'Active', members: [world.player.name] };
  institutions.partyFactions.push(faction);
  party.factional_conflict = clamp((party.factional_conflict || 0) + 3);
  return faction;
}

export function recordPartyDiscipline(world, { partyId = world.player.partyId, memberId, action, reason }) {
  const party = requireParty(world, partyId);
  if (!(party.leaderId === 'PLAYER' || world.player.partyOffice === 'Party President' || world.player.partyPresident === true)) throw new Error('Only the party president may issue disciplinary action');
  if (!memberId || !['Warning', 'Suspension', 'Expulsion'].includes(action) || !String(reason || '').trim()) throw new Error('Member, disciplinary action and reason are required');
  const record = { id: nextId(world, 'DISCIPLINE'), partyId, memberId, action, reason: String(reason).trim(), issuedAt: world.time.date, status: 'Active' };
  ensureV130(world).disciplinaryRecords.push(record);
  if (action === 'Expulsion' && memberId === 'PLAYER') {
    world.player.partyId = 'NONE';
    world.player.partyOffice = null;
    world.player.partyPresident = false;
    world.player.status = 'Citizen';
    world.player.reputation = Math.max(0, Number(world.player.reputation || 0) - 8);
  }
  if (action === 'Suspension') party.internal_unity = clamp((party.internal_unity || 50) - 3);
  if (action === 'Expulsion' && memberId !== 'PLAYER') { world.partyMembers = (world.partyMembers || []).filter((member) => member.candidate_id !== memberId); party.members = Math.max(0, Number(party.members || 0) - 1); delete party.memberLoyalty?.[memberId]; }
  return record;
}

export function appointPartyOfficeBearer(world, { partyId = world.player.partyId, office, memberId }) {
  const party = requireParty(world, partyId);
  if (!(party.leaderId === 'PLAYER' || world.player.partyOffice === 'Party President' || world.player.partyPresident === true)) throw new Error('Only the party president may appoint office-bearers');
  const title = String(office || '').trim();
  if (!title || !memberId) throw new Error('Office and member are required');
  if (memberId !== 'PLAYER' && !(world.partyMembers || []).some((item) => item.candidate_id === memberId && item.initial_party_id === partyId)) throw new Error('Office-bearer must be recruited from the People register into this party');
  const institutions = ensureV130(world);
  const existing = institutions.partyOfficeBearers.find((item) => item.partyId === partyId && item.office === title && item.status === 'Active');
  if (existing) existing.status = 'Replaced';
  const appointment = { id: nextId(world, 'OFFICE'), partyId, office: title, memberId, appointedAt: world.time.date, status: 'Active' };
  institutions.partyOfficeBearers.push(appointment);
  if (memberId === 'PLAYER') {
    world.player.partyOffice = title;
    world.player.status = title;
  }
  party.officeBearers ??= {};
  party.officeBearers[title] = memberId;
  if (title === 'Party President') {
    party.leaderId = memberId;
    if (memberId === 'PLAYER') world.player.partyPresident = true;
    else if (world.player.partyId === partyId) { world.player.partyPresident = false; if (world.player.partyOffice === 'Party President') world.player.partyOffice = 'Party Member'; }
  }
  return appointment;
}

export function updateMemberLoyalty(world, partyId, memberId, delta) {
  const party = requireParty(world, partyId);
  party.memberLoyalty ??= {};
  party.memberLoyalty[memberId] = clamp((party.memberLoyalty[memberId] ?? 50) + Number(delta || 0));
  return party.memberLoyalty[memberId];
}

export function defectPartyMember(world, memberId, destinationPartyId = null) {
  if (!memberId || memberId === 'PLAYER') throw new Error('The player must use the resignation process');
  const member = (world.partyMembers || []).find((item) => item.candidate_id === memberId);
  if (!member) throw new Error('Party member was not found in the recruited register');
  const sourceParty = requireParty(world, member.initial_party_id);
  const loyalty = Number(sourceParty.memberLoyalty?.[memberId] ?? member.loyalty ?? 50);
  if (loyalty > 25) throw new Error(`Defection threshold not met: loyalty is ${loyalty}/100; it must be 25 or lower`);
  const destination = destinationPartyId ? world.parties.find((item) => item.party_id === destinationPartyId) : null;
  if (destinationPartyId && (!destination || destinationPartyId === sourceParty.party_id)) throw new Error('Select a different registered destination party');
  sourceParty.members = Math.max(0, Number(sourceParty.members || 0) - 1);
  if (sourceParty.leaderId === memberId) {
    const successor = (world.partyMembers || []).filter((item) => item.candidate_id !== memberId && item.initial_party_id === sourceParty.party_id).sort((a, b) => Number(sourceParty.memberLoyalty?.[b.candidate_id] ?? b.loyalty ?? 50) - Number(sourceParty.memberLoyalty?.[a.candidate_id] ?? a.loyalty ?? 50))[0];
    sourceParty.leaderId = successor?.candidate_id || null;
    if (sourceParty.officeBearers?.['Party President'] === memberId) sourceParty.officeBearers['Party President'] = sourceParty.leaderId;
  }
  sourceParty.factional_conflict = clamp(Number(sourceParty.factional_conflict || 0) + 2);
  world.partyMembers = world.partyMembers.filter((item) => item.candidate_id !== memberId);
  member.initial_party_id = destination?.party_id || 'NONE';
  member.initial_membership_status = destination ? 'MEMBER' : 'INDEPENDENT';
  if (destination) { destination.members = Number(destination.members || 0) + 1; world.partyMembers.push(member); }
  if (sourceParty.officeBearers) for (const [office, holder] of Object.entries(sourceParty.officeBearers)) if (holder === memberId) delete sourceParty.officeBearers[office];
  const record = { id: nextId(world, 'DEFECTION'), memberId, memberName: member.full_name, fromPartyId: sourceParty.party_id, toPartyId: destination?.party_id || 'NONE', loyaltyAtDeparture: loyalty, date: world.time.date, status: 'Completed' };
  ensureV130(world).partyDefections.push(record);
  addNotification(world, { id: `PARTY-DEFECT-${record.id}`, title: 'Party defection recorded', body: `${record.memberName || memberId} left ${sourceParty.party_name}${destination ? ` and joined ${destination.party_name}` : ' and became independent'}. Recorded loyalty: ${loyalty}/100.`, type: 'Party', target: 'Party HQ' });
  return record;
}

export function processPartyLoyalty(world) {
  let updated = 0;
  for (const party of world.parties || []) {
    party.memberLoyalty ??= {};
    const organisationalBalance = Number(party.internal_unity ?? 50) - Number(party.factional_conflict ?? 0) - 50;
    const delta = Math.max(-3, Math.min(3, Math.trunc(organisationalBalance / 20)));
    for (const member of (world.partyMembers || []).filter((item) => item.initial_party_id === party.party_id)) {
      const id = member.candidate_id;
      const previous = Number(party.memberLoyalty[id] ?? member.loyalty ?? 50);
      const next = clamp(previous + delta);
      party.memberLoyalty[id] = next;
      member.loyalty = next;
      member.defectionEligible = next <= 25;
      updated += 1;
    }
  }
  return updated;
}

export function establishPartyStateUnit(world, stateId) {
  const party = requireParty(world, world.player.partyId);
  if (!(party.leaderId === 'PLAYER' || world.player.partyOffice === 'Party President' || world.player.partyPresident === true)) throw new Error('Only the party president may establish a state unit');
  const state = (world.states || []).find((item) => (item.state_ut_id || item.state_id) === stateId);
  if (!state) throw new Error('Select a valid state or Union Territory');
  party.stateUnits ??= [];
  if (party.stateUnits.some((unit) => unit.stateId === stateId)) throw new Error('This party already has an established unit in that state');
  const unit = { id: nextId(world, 'STATE-UNIT'), partyId: party.party_id, stateId, stateName: state.state_ut_name || state.state_name, presidentId: null, members: 0, establishedAt: world.time.date, status: 'Active' };
  party.stateUnits.push(unit);
  addNotification(world, { id: `PARTY-STATE-UNIT-${unit.id}`, title: 'Party state unit established', body: `${party.party_name} established a state unit in ${unit.stateName}.`, type: 'Party', target: 'Party HQ' });
  return unit;
}

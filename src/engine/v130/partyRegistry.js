import { addNotification, ensureV130, nextId, addDays } from './shared.js';


const normalizeName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}
export function validatePartyRegistration(world, application) {
  const issues = [];
  const name = normalizeName(application.name);
  const abbreviation = normalizeName(application.abbreviation);
  for (const party of world.parties || []) {
    const existingName = normalizeName(party.party_name);
    const existingShort = normalizeName(party.short_name);
    const compare = (left, right) => left && right && editDistance(left, right) / Math.max(left.length, right.length) <= 0.18;
    if (compare(name, existingName) || compare(abbreviation, existingShort) || name === existingShort || abbreviation === existingName) {
      issues.push(`Party name or abbreviation is confusingly similar to ${party.party_name} (${party.short_name}).`);
    }
  }
  const others = (world.institutions?.partyApplications || []).filter((item) => item.id !== application.id && ['Pending', 'Approved'].includes(item.status));
  if (others.some((item) => normalizeName(item.name) === name || normalizeName(item.abbreviation) === abbreviation)) issues.push('Party name or abbreviation is already reserved by another application.');
  if (!String(application.constitution || '').trim()) issues.push('A party constitution is required.');
  const manifesto = application.manifesto || {};
  if (!String(manifesto.initialText || manifesto.text || '').trim() && !Object.keys(manifesto.categories || {}).length && !(manifesto.promises || []).length) issues.push('An initial manifesto is required.');
  const states = (world.states || []).map((state) => state.state_ut_name || state.state_name).filter(Boolean);
  if (!states.some((state) => state.toLowerCase() === String(application.headquarters || '').toLowerCase()) && String(application.headquarters || '').toLowerCase() !== 'new delhi') issues.push('Headquarters must be a recognised state or the national capital, New Delhi.');
  if (Object.values(world.institutions?.symbols?.allocated || {}).includes(application.flag)) issues.push('The selected flag design is already allocated.');
  if ((world.parties || []).some((party) => party.playerCreated && (party.emblem === application.logo || party.flag === application.flag))) issues.push('The selected logo or flag is already allocated.');
  if (Number(application.fee) !== 10000) issues.push('The ₹10,000 registration fee is not recorded as paid.');
  return { valid: issues.length === 0, issues };
}

const clean = (value, label, max = 120) => {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${label} is required`);
  if (text.length > max) throw new Error(`${label} must be ${max} characters or fewer`);
  return text;
};

export function submitPartyRegistration(world, details) {
  const institutions = ensureV130(world);
  const config = world.balance?.v130 || {};
  const fee = Number(config.partyRegistrationFee || 10000);
  if (Number(world.player.money) < fee) throw new Error(`Party registration requires ₹${fee.toLocaleString('en-IN')} in personal funds`);
  const name = clean(details.name, 'Official party name', 80);
  const abbreviation = clean(details.abbreviation, 'Party abbreviation', 12).toUpperCase();
  if (world.parties.some((party) => party.party_name?.toLowerCase() === name.toLowerCase())) throw new Error('A party with this official name already exists');
  if (world.parties.some((party) => party.short_name?.toLowerCase() === abbreviation.toLowerCase())) throw new Error('This party abbreviation is already in use');
  if (institutions.partyApplications.some((item) => item.status === 'Pending' && (item.name.toLowerCase() === name.toLowerCase() || item.abbreviation.toLowerCase() === abbreviation.toLowerCase()))) throw new Error('A pending application already uses this party name or abbreviation');
  const application = {
    id: nextId(world, 'REG'), name, abbreviation,
    logo: details.logo || details.emblem || 'sun', flag: details.flag || 'horizontal-tricolour',
    primaryColour: details.primaryColour || details.colour || '#b88a32',
    secondaryColour: details.secondaryColour || '#173d35',
    ideology: clean(details.ideology, 'Ideology', 80), politicalPosition: details.politicalPosition || 'Centre',
    headquarters: clean(details.headquarters, 'Headquarters', 100), founder: world.player.name,
    constitution: clean(details.constitution || 'Interim constitution', 'Party constitution', 4000),
    leadership: details.leadership || [{ title: 'Founder-President', holder: world.player.name }],
    manifesto: details.manifesto || { published: false, initialText: '', policies: [], promises: [] },
    fee, submittedAt: world.time.date, decisionDate: addDays(world.time.date, Number(config.partyRegistrationDecisionDays || 7)),
    status: 'Pending', reviewCount: 0, correctionNotes: '', partyId: null,
  };
  world.player.money -= fee;
  institutions.partyApplications.push(application);
  addNotification(world, { id: `REG-SUBMITTED-${application.id}`, title: 'Party registration submitted', body: `${name} has been submitted to the Election Commission. A decision is due in seven in-game days.`, type: 'Election Commission', priority: 'high', target: 'Election Commission' });
  return application;
}

export function requestPartyCorrections(world, applicationId, notes) {
  const application = ensureV130(world).partyApplications.find((item) => item.id === applicationId);
  if (!application || !['Pending', 'Changes Required'].includes(application.status)) throw new Error('Registration application cannot be amended');
  application.status = 'Changes Required';
  application.correctionNotes = clean(notes, 'Correction notes', 1000);
  application.decisionDate = null;
  addNotification(world, { id: `REG-CHANGES-${application.id}-${application.reviewCount}`, title: 'Party registration changes required', body: application.correctionNotes, type: 'Election Commission', priority: 'high', target: 'Party HQ' });
  return application;
}

export function resubmitPartyCorrections(world, applicationId, changes = {}) {
  const application = ensureV130(world).partyApplications.find((item) => item.id === applicationId);
  if (!application || application.status !== 'Changes Required') throw new Error('No correction request is pending');
  if (changes.name) application.name = clean(changes.name, 'Official party name', 80);
  if (changes.abbreviation) application.abbreviation = clean(changes.abbreviation, 'Party abbreviation', 12).toUpperCase();
  if (changes.constitution) application.constitution = clean(changes.constitution, 'Party constitution', 4000);
  if (changes.manifesto) application.manifesto = changes.manifesto;
  if (changes.headquarters) application.headquarters = clean(changes.headquarters, 'Headquarters', 100);
  if (changes.logo) application.logo = String(changes.logo);
  if (changes.flag) application.flag = String(changes.flag);
  if (changes.primaryColour) application.primaryColour = String(changes.primaryColour);
  if (changes.secondaryColour) application.secondaryColour = String(changes.secondaryColour);
  if (changes.ideology) application.ideology = clean(changes.ideology, 'Ideology', 60);
  if (changes.politicalPosition) application.politicalPosition = clean(changes.politicalPosition, 'Political position', 60);
  application.status = 'Pending';
  application.reviewCount += 1;
  application.submittedAt = world.time.date;
  application.decisionDate = addDays(world.time.date, Number(world.balance?.v130?.partyRegistrationDecisionDays || 7));
  application.correctionNotes = '';
  return application;
}

export function decidePartyRegistration(world, applicationId, decision, reason = '') {
  const institutions = ensureV130(world);
  const application = institutions.partyApplications.find((item) => item.id === applicationId);
  if (!application || application.status !== 'Pending') throw new Error('Pending registration application not found');
  if (!['Approved', 'Rejected', 'Changes Required'].includes(decision)) throw new Error('Invalid Election Commission decision');
  if (decision === 'Changes Required') return requestPartyCorrections(world, applicationId, reason || 'Further information is required.');
  if (decision === 'Approved') {
    const validation = validatePartyRegistration(world, application);
    if (!validation.valid) return requestPartyCorrections(world, applicationId, validation.issues.join(' '));
    if (!institutions.symbols.available.length) throw new Error('No unallocated election symbol is available');
  }
  application.status = decision;
  application.decisionReason = reason;
  application.decidedAt = world.time.date;
  if (decision === 'Approved') {
    const symbol = institutions.symbols.available.shift();
    if (!symbol) throw new Error('No unallocated election symbol is available');
    institutions.symbols.allocated[symbol] = application.id;
    const party = {
      party_id: `PLAYER-${application.id}`, party_name: application.name, short_name: application.abbreviation,
      party_type: 'NATIONAL', ideology: application.ideology, political_position: application.politicalPosition,
      headquarters: application.headquarters, founder: application.founder, colour: application.primaryColour,
      secondaryColour: application.secondaryColour, emblem: application.logo, flag: application.flag,
      electionSymbol: symbol, constitution: application.constitution, manifesto: application.manifesto,
      members: 1, public_support: 5, organisation_strength: 5, national_strength: 2,
      leadership_strength: 35, financial_strength: 0, candidate_quality: 45,
      coalition_compatibility: 50, internal_unity: 90, factional_conflict: 0,
      playerCreated: true, registrationStatus: 'Registered', registrationApplicationId: application.id,
      leaderId: 'PLAYER',
    };
    world.parties.push(party);
    world.player.partyId = party.party_id;
    world.player.status = 'Party President';
    world.player.partyOffice = 'Party President';
    world.player.partyPresident = true;
    world.player.members = Math.max(1, Number(world.player.members) || 0);
    application.partyId = party.party_id;
  }
  addNotification(world, { id: `REG-DECISION-${application.id}`, title: `Party registration ${decision.toLowerCase()}`, body: reason || `${application.name}: ${decision}.`, type: 'Election Commission', priority: 'high', target: 'Party HQ' });
  return application;
}

export function processPartyRegistrationDeadlines(world) {
  const due = ensureV130(world).partyApplications.filter((item) => item.status === 'Pending' && item.decisionDate <= world.time.date.slice(0, 10));
  for (const application of due) {
    const validation = validatePartyRegistration(world, application);
    decidePartyRegistration(world, application.id, validation.valid ? 'Approved' : 'Changes Required', validation.valid ? 'Registration requirements have been verified.' : validation.issues.join(' '));
  }
  return due.length;
}

export function submitPartyMembership(world, partyId, details = {}) {
  const party = world.parties.find((item) => item.party_id === partyId);
  if (!party) throw new Error('Selected political party was not found');
  if (world.player.partyId === partyId) throw new Error('You are already a member of this party');
  const institutions = ensureV130(world);
  institutions.partyMembershipApplications ??= [];
  const pending = institutions.partyMembershipApplications.find((item) => item.partyId === partyId && item.status === 'Pending');
  if (pending) throw new Error('A membership application is already pending with this party');
  const application = {
    id: nextId(world, 'MEM'), partyId, applicant: world.player.name,
    politicalBackground: String(details.politicalBackground || '').trim(),
    experience: String(details.experience || '').trim(), statement: String(details.statement || '').trim(),
    submittedAt: world.time.date, decisionDate: addDays(world.time.date, Number(world.balance?.v130?.partyMembershipDecisionDays || 7)), status: 'Pending', decision: null,
  };
  institutions.partyMembershipApplications.push(application);
  addNotification(world, { id: `MEM-SUBMITTED-${application.id}`, title: 'Party membership application submitted', body: `Your application to ${party.party_name} is awaiting the party organisation's response.`, type: 'Party', target: 'Parties' });
  return application;
}

export function decidePartyMembership(world, applicationId, decision, assignedOffice = 'Ordinary Member', reason = '') {
  const institutions = ensureV130(world);
  institutions.partyMembershipApplications ??= [];
  const application = institutions.partyMembershipApplications.find((item) => item.id === applicationId);
  if (!application || application.status !== 'Pending') throw new Error('Pending membership application not found');
  if (!['Accepted', 'Rejected'].includes(decision)) throw new Error('Invalid party membership decision');
  application.status = decision;
  application.decision = { date: world.time.date, reason: String(reason || ''), assignedOffice: decision === 'Accepted' ? assignedOffice : null };
  if (decision === 'Accepted') {
    const party = world.parties.find((item) => item.party_id === application.partyId);
    if (!party) throw new Error('Party no longer exists');
    if (world.player.partyId && world.player.partyId !== 'NONE') {
      const previousParty = world.parties.find((item) => item.party_id === world.player.partyId);
      if (previousParty) previousParty.members = Math.max(0, Number(previousParty.members || 0) - 1);
      world.player.reputation = Math.max(0, Number(world.player.reputation || 0) - 5);
    }
    world.player.partyId = party.party_id;
    world.player.partyOffice = assignedOffice;
    world.player.status = assignedOffice;
    world.player.members = (world.player.members || 0) + 1;
    party.members = (party.members || 0) + 1;
    world.partyMembershipSince = world.time.date;
  }
  addNotification(world, { id: `MEM-DECISION-${application.id}`, title: `Party membership ${decision.toLowerCase()}`, body: reason || `Your membership application was ${decision.toLowerCase()}.`, type: 'Party', priority: 'high', target: 'Party HQ' });
  return application;
}


export function processPartyMembershipDeadlines(world) {
  const institutions = ensureV130(world);
  const due = (institutions.partyMembershipApplications || []).filter((item) => item.status === 'Pending' && item.decisionDate <= world.time.date.slice(0, 10));
  for (const application of due) {
    const party = world.parties.find((item) => item.party_id === application.partyId);
    const score = Number(party?.organisation_strength || 0) + Number(world.player.reputation || 0) / 2 + Math.min(15, Math.floor(application.statement.length / 20));
    decidePartyMembership(world, application.id, party && score >= 30 ? 'Accepted' : 'Rejected', 'Ordinary Member', party ? `Party review score: ${Math.round(score)}.` : 'The party is no longer registered.');
  }
  return due.length;
}

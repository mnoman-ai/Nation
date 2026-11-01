import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createWorld, createTimeEngine,
} from '../src/engine/GameEngine.js';
import { prepareScenario } from '../src/engine/scenario.js';
import { CandidateRepository, makeElectionSeats } from '../src/engine/candidates.js';
import { recruitPlayerPoolCandidates, setMembershipFee, collectMembershipFees, manageFunding } from '../src/engine/party.js';
import { payMonthlySalary, payOtherPartyElectedSalaries, requestPartyLoan, startCampaign, tickCampaigns, processCampaignDeadlines, processPartyLoanDeadlines } from '../src/engine/finance.js';
import { formGovernment } from '../src/engine/coalitions.js';
import { createSession, startSession, introduceBill, voteBill } from '../src/engine/legislature.js';
import { runContest } from '../src/engine/electionLifecycle.js';
import { SAVE_VERSION, serializeWorld, deserializeWorld } from '../src/engine/save.js';
import {
  submitPartyRegistration, processPartyRegistrationDeadlines, validatePartyRegistration,
  submitCandidateNomination, processCandidateNominationDeadlines, certifyElectionResult,
  sendMeetingInvitations, processMeetingDeadlines, attendMeeting, recordMeetingDiscussion, concludeMeeting,
  fileCourtCase, recordCourtHearing, issueCourtVerdict, ensureV130,
  PARTY_LOGO_CHOICES, PARTY_FLAG_CHOICES, renderPartyLogoSVG, renderPartyFlagSVG,
  processPartyLoyalty, defectPartyMember,
} from '../src/engine/v130/index.js';

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
function fullData() {
  return {
    balance: read('../data/balance.json'), rules: read('../data/rules.json'),
    parties: read('../public/data/parties.json'), states: read('../public/data/states.json'),
    seatCounts: read('../public/data/seat-counts.json'), actions: read('../data/actions.json'),
    events: read('../data/events.json'), bills: read('../data/bills.json'),
    policies: read('../data/policies.json'), projects: read('../data/projects.json'),
    economy: read('../data/economy.json'), shocks: read('../data/shocks.json'),
    finance: read('../data/finance.json'), 'voter-priorities': read('../data/voter-priorities.json'),
    'ideology-fit': read('../data/ideology-fit.json'), constituencies: read('../public/data/constituencies.json'),
    media: read('../data/media.json'),
  };
}
function compactWorld() {
  return {
    time: { date: '2025-01-01T08:00:00.000Z' },
    player: { name: 'Test Player', partyId: 'P1', partyOffice: 'Party President', partyPresident: true, money: 100000, reputation: 60, influence: 40 },
    parties: [
      { party_id: 'P1', party_name: 'Civic Party', short_name: 'CIV', members: 10, public_support: 40, leaderId: 'PLAYER', internal_unity: 70, factional_conflict: 10 },
      { party_id: 'P2', party_name: 'People Party', short_name: 'PEO', members: 20, public_support: 35, coalition_compatibility: 50, internal_unity: 50 },
      { party_id: 'P3', party_name: 'National Reform Front', short_name: 'NRF', members: 12, public_support: 95, coalition_compatibility: 0, internal_unity: 0 },
    ],
    states: [], elections: [], notifications: [], partyFunds: 0, partyLoans: [], activeCampaigns: [],
    finance: read('../data/finance.json'), rules: read('../data/rules.json'), balance: read('../data/balance.json'),
    policies: [{ id: 'EDU-1', name: 'School renewal', cost: 100000, status: 'Proposed' }],
    bills: [], sessions: [], economy: { budget: { reserveFund: 500000 } }, publicMood: 50,
  };
}

test('strict party registration rejects confusing names and requires all EC documents', () => {
  const world = compactWorld();
  const invalid = { id: 'APP-1', name: 'Civic Partyy', abbreviation: 'CIVX', constitution: '', manifesto: {}, headquarters: 'New Delhi', fee: 10000 };
  const result = validatePartyRegistration(world, invalid);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.includes('confusingly similar')));
  assert.ok(result.issues.some((issue) => issue.includes('constitution')));
  assert.ok(result.issues.some((issue) => issue.includes('manifesto')));
});

test('generated party artwork exposes 24 distinct logo shapes and 12 flag layouts', () => {
  assert.equal(PARTY_LOGO_CHOICES.length, 24);
  assert.equal(new Set(PARTY_LOGO_CHOICES.map((choice) => renderPartyLogoSVG(choice.id))).size, 24);
  assert.equal(PARTY_FLAG_CHOICES.length, 12);
  assert.equal(new Set(PARTY_FLAG_CHOICES.map((choice) => renderPartyFlagSVG(choice.id))).size, 12);
});

test('seven campaign definitions and all campaign charges match the approved schedule', () => {
  const finance = read('../data/finance.json');
  const byId = Object.fromEntries(finance.campaigns.map((campaign) => [campaign.id, campaign]));
  assert.deepEqual(finance.campaigns.map((campaign) => campaign.label), ['Door-to-door Rally','Political Program','Social Media','Media Interview','Media Broadcasting','Public Meeting','Booth Volunteer Network']);
  assert.deepEqual([byId.doorToDoor.fee, byId.politicalProgram.fee, byId.socialMedia.fee, byId.mediaInterview.fee, byId.mediaBroadcasting.fee, byId.publicMeeting.fee, byId.boothVolunteerNetwork.fee], [100000,400000,20000,50000,100000,200000,30000]);
  assert.equal(byId.mediaBroadcasting.minMonths, 1);
  assert.equal(byId.mediaBroadcasting.maxMonths, 6);
  assert.equal(byId.doorToDoor.maxUsesPerElection, 1);
});

test('monthly campaign billing happens on the first of the month and grants paid-month benefit', () => {
  const world = compactWorld();
  world.time.date = '2025-01-08T08:00:00.000Z';
  world.partyFunds = 1000000;
  world.elections = [{ id: 'E1', pollDate: '2025-03-01', campaignStartDate: '2025-01-02', campaignEndDate: '2025-02-26' }];
  const campaign = startCampaign(world, 'socialMedia');
  assert.equal(campaign.prepaid, 0);
  assert.equal(world.partyFunds, 1000000);
  assert.equal(world.partyCampaigns?.P1, undefined);
  world.time.date = '2025-02-01T08:00:00.000Z';
  tickCampaigns(world);
  assert.equal(world.partyFunds, 980000);
  assert.equal(world.partyCampaigns.P1, 3);
  world.time.date = '2025-02-27T08:00:00.000Z';
  assert.equal(processCampaignDeadlines(world), 1);
  assert.equal(campaign.active, false);
});

test('party salary share includes every elected MP and MLA, while personal salary remains full', () => {
  const world = compactWorld();
  world.player.office = 'Citizen';
  world.player.money = 0;
  world.parties[0].electedOfficials = [{ memberId: 'MP-1', office: 'MP' }, { memberId: 'MLA-1', office: 'MLA' }];
  world.partyFunds = 0;
  const result = payMonthlySalary(world);
  assert.equal(result.salary, 55000);
  assert.equal(world.player.money, 55000);
  assert.equal(world.partyFunds, 650000);
  assert.equal(world.parties[0].funds, 650000);
  world.player.office = 'MP';
  world.player.status = 'MP';
  const second = payMonthlySalary(world);
  assert.equal(second.salary, 700000);
  assert.equal(world.player.money, 755000);
  assert.equal(world.partyFunds, 1755000);
});

test('member fee collection debits player member and creates only recorded membership income', () => {
  const world = compactWorld();
  world.player.money = 100000;
  world.parties[0].membershipFee = 50000;
  world.parties[0].members = 10;
  world.partyFunds = 0;
  const income = collectMembershipFees(world);
  assert.equal(income, 500000);
  assert.equal(world.player.money, 50000);
  assert.equal(world.partyFunds, 500000);
  assert.equal(world.parties[0].lastMembershipFeeCollection.membersCharged, 10);
  assert.throws(() => manageFunding(world, 'donation', 100000), /not permitted/i);
  assert.throws(() => manageFunding(world, 'sponsor', 100000), /not permitted/i);
});

test('loan hearing date is enforced daily with a fine and a funding freeze, exactly once', () => {
  const world = compactWorld();
  world.partyFunds = 300000;
  world.partyLoans = [{ id: 'LOAN-X', principal: 1000000, dueAmount: 1500000, warnings: 3, status: 'Court Notice', hearingDate: '2025-02-01', lastChanceDate: '2025-02-08', courtCaseId: 'CASE-LOAN-LOAN-X' }];
  ensureV130(world).courtCases.push({ id: 'CASE-LOAN-LOAN-X', status: 'Filed', hearingDate: '2025-02-01' });
  world.time.date = '2025-02-01T08:00:00.000Z';
  assert.equal(processPartyLoanDeadlines(world), 1);
  assert.equal(world.partyLoans[0].hearingHeldAt.slice(0,10), '2025-02-01');
  assert.equal(world.partyFundingFrozen, undefined);
  world.time.date = '2025-02-08T08:00:00.000Z';
  assert.equal(processPartyLoanDeadlines(world), 1);
  assert.equal(world.partyFundingFrozen, true);
  assert.equal(world.partyFunds, 0);
  assert.equal(world.partyFine, 200000);
  assert.equal(world.partyLoans[0].status, 'Election Commission Action');
  assert.equal(processPartyLoanDeadlines(world), 0);
});

test('multi-party invitations receive deterministic AI responses and schedule three days after acceptance', () => {
  const world = compactWorld();
  const invitations = sendMeetingInvitations(world, { partyIds: ['P2', 'P3'], purpose: 'Coalition cooperation and seat-sharing', agenda: 'Negotiation terms' });
  assert.equal(invitations.length, 2);
  world.time.date = '2025-01-02T08:00:00.000Z';
  processMeetingDeadlines(world);
  const accepted = invitations.find((item) => item.toPartyId === 'P2');
  const rejected = invitations.find((item) => item.toPartyId === 'P3');
  assert.equal(accepted.status, 'Accepted');
  assert.equal(rejected.status, 'Rejected');
  assert.equal(ensureV130(world).meetings[0].scheduledDate, '2025-01-05');
});

test('party loyalty responds to unity/conflict and defection is gated by measurable loyalty', () => {
  const world = compactWorld();
  world.partyMembers = [{ candidate_id: 'MEM-1', full_name: 'Member One', initial_party_id: 'P1', loyalty: 26 }];
  world.parties[0].internal_unity = 20;
  world.parties[0].factional_conflict = 80;
  processPartyLoyalty(world);
  assert.equal(world.partyMembers[0].loyalty, 23);
  assert.equal(world.partyMembers[0].defectionEligible, true);
  const defection = defectPartyMember(world, 'MEM-1', 'P2');
  assert.equal(defection.fromPartyId, 'P1');
  assert.equal(defection.toPartyId, 'P2');
  assert.equal(world.parties[0].members, 9);
  assert.equal(world.parties[1].members, 21);
});

test('headless acceptance: party registration through election, governance, alliance, court, loan and save migration', async () => {
  const data = fullData();
  const world = createWorld(data, { player: { name: 'Acceptance Player', money: 50000, reputation: 60 } });
  prepareScenario(world, data.constituencies);
  const application = submitPartyRegistration(world, {
    name: 'United Future Alliance', abbreviation: 'UFA', ideology: 'Centrist', politicalPosition: 'Centre', headquarters: 'New Delhi',
    constitution: 'The party elects its leadership, publishes accounts and follows internal democratic rules.',
    manifesto: { status: 'Draft', initialText: 'A published programme of accountable public service, jobs and transparent governance.', categories: {}, promises: [] },
    logo: 'shield', flag: 'central-disc', primaryColour: '#b88a32', secondaryColour: '#173d35',
  });
  assert.equal(world.player.money, 40000);
  world.time.date = '2025-01-08T08:00:00.000Z';
  processPartyRegistrationDeadlines(world);
  assert.equal(application.status, 'Approved');
  const partyId = world.player.partyId;
  assert.equal(world.player.partyOffice, 'Party President');
  const pool = read('../public/data/player-candidates.json');
  const candidate = pool.find((item) => item.state_id === 'ST23' && Number(item.age) >= 25);
  const recruited = recruitPlayerPoolCandidates(world, [candidate], 1)[0];
  world.partyFunds = 0;
  world.player.money += 20000;
  const { transferPersonalToParty } = await import('../src/engine/finance.js');
  transferPersonalToParty(world, 20000);
  const loan = requestPartyLoan(world, 1000000);
  assert.equal(loan.status, 'Active');
  const seat = data.constituencies.find((item) => item.state_ut_id === 'ST23' && item.legislature_type === 'ASSEMBLY');
  assert.ok(seat);
  world.elections = [{ id: 'ASM-HEADLESS', type: 'assembly', stateId: 'ST23', stateName: 'Test State', pollDate: '2025-02-01', resultsDate: '2025-02-06', campaignStartDate: '2025-01-02', nominationOpenDate: '2025-01-02', nominationCloseDate: '2025-01-20', scrutinyDate: '2025-01-21', withdrawalDeadline: '2025-01-23', campaignEndDate: '2025-01-30', status: 'Scheduled', totalSeats: 1 }];
  const nomination = submitCandidateNomination(world, { electionId: 'ASM-HEADLESS', constituencyId: seat.constituency_id, candidateId: recruited.candidate_id, partyId });
  world.time.date = '2025-01-21T08:00:00.000Z';
  processCandidateNominationDeadlines(world);
  assert.equal(nomination.status, 'Approved');
  const campaign = startCampaign(world, 'doorToDoor');
  assert.equal(campaign.prepaid, 100000);
  world.time.date = '2025-01-30T08:00:00.000Z';
  processCampaignDeadlines(world);
  assert.equal(campaign.active, false);
  world.time.date = '2025-02-01T08:00:00.000Z';
  const stateCandidates = read('../public/data/candidates-ST23.json');
  const result = await runContest(world, world.elections[0], { constituencies: [seat], candidateLoader: { forState: async () => stateCandidates } });
  assert.equal(result.results.length, 1);
  assert.ok(result.results[0].rounds.some((round) => round.candidate_id === recruited.candidate_id), 'approved nominated candidate must be present in the counted ballot');
  world.time.date = '2025-02-06T08:00:00.000Z';
  world.elections[0].status = 'Results'; world.elections[0].resultPublished = true;
  certifyElectionResult(world, 'ASM-HEADLESS');
  const government = formGovernment(result.seatTally, 1, []);
  world.government = { ...world.government, ...government, status: government.majority ? 'Formed' : 'Minority trial' };
  assert.equal(world.government.status, 'Formed');
  const session = createSession('2025-02-06', 'Special');
  world.sessions.push(session); startSession(world, session.id); introduceBill(world, 'BL01'); voteBill(world, 'BL01', 'yes');
  const invites = sendMeetingInvitations(world, { partyIds: ['NDP'], purpose: 'Post-election coalition government', agenda: 'Leadership and ministry-sharing terms' });
  const { respondToMeetingInvitation } = await import('../src/engine/v130/meetings.js');
  const meeting = respondToMeetingInvitation(world, invites[0].id, 'Accepted');
  world.time.date = `${meeting.scheduledDate}T08:00:00.000Z`;
  attendMeeting(world, meeting.id); recordMeetingDiscussion(world, meeting.id, { topic: 'Coalition programme', position: 'Support a common governance agenda.' });
  concludeMeeting(world, meeting.id, { outcome: 'Coalition terms accepted', agreementType: 'Coalition government', terms: { ministries: 10, commonProgramme: true } });
  assert.equal(world.alliances.length, 1);
  const caseRecord = fileCourtCase(world, { category: 'Election Petition', title: 'Documented constituency petition', facts: 'The petitioner submits a complete record of the polling and counting discrepancy, including the certified station return.', evidence: ['Certified Form 17C', 'Returning officer record', 'Observer affidavit'], court: 'Lower Court', electionId: 'ASM-HEADLESS' });
  world.time.date = `${caseRecord.hearingDate}T08:00:00.000Z`;
  recordCourtHearing(world, caseRecord.id, { summary: 'The court reviewed the certified record and heard both parties.', evidenceReviewed: caseRecord.evidence });
  issueCourtVerdict(world, caseRecord.id, { outcome: 'Petition Dismissed', rationale: 'The submitted certified records are internally consistent and do not establish a material counting error.', remedy: 'No change to the certified result.' });
  assert.equal(caseRecord.status, 'Decided');
  for (let month = 1; month <= 33; month += 1) {
    world.time.date = new Date(Date.UTC(2025, 2 + month - 1, 1, 8)).toISOString();
    const { tickPartyLoans } = await import('../src/engine/finance.js');
    tickPartyLoans(world);
  }
  world.time.date = `${loan.hearingDate}T08:00:00.000Z`;
  processPartyLoanDeadlines(world);
  world.time.date = loan.lastChanceDate;
  processPartyLoanDeadlines(world);
  assert.equal(loan.warnings, 3);
  assert.equal(loan.status, 'Election Commission Action');
  assert.equal(world.partyFundingFrozen, true);
  const reloaded = deserializeWorld(serializeWorld(world));
  assert.equal(reloaded.player.partyId, partyId);
  assert.equal(reloaded.elections[0].certificationStatus, 'Certified');
  assert.equal(reloaded.alliances.length, 1);
  assert.equal(reloaded.institutions.courtCases.some((item) => item.id === caseRecord.id), true);
  assert.equal(reloaded.partyFundingFrozen, true);
  assert.equal(SAVE_VERSION, reloaded.saveVersion);
});

test('party loan interest keeps growing after three warnings without issuing a fourth warning', async () => {
  const { tickPartyLoans } = await import('../src/engine/finance.js');
  const finance = read('../data/finance.json');
  const world = {
    finance,
    time: { date: '2025-01-01T00:00:00.000Z' },
    player: { partyId: 'NDP', money: 0, partyOffice: 'Party President' },
    partyFunds: 0,
    partyLoans: [],
    notifications: [],
    parties: [{ party_id: 'NDP', leaderId: 'PLAYER' }],
  };
  const { requestPartyLoan } = await import('../src/engine/finance.js');
  const loan = requestPartyLoan(world, 1000000);
  for (let month = 1; month <= 36; month += 1) {
    world.time.date = new Date(Date.UTC(2025, month, 1)).toISOString();
    tickPartyLoans(world);
  }
  assert.equal(loan.warnings, 3);
  assert.equal(loan.status, 'Court Notice');
  const balanceAfterThreeWarnings = loan.dueAmount;
  for (let month = 37; month <= 39; month += 1) {
    world.time.date = new Date(Date.UTC(2025, month, 1)).toISOString();
    tickPartyLoans(world);
  }
  assert.equal(loan.warnings, 3);
  assert.ok(loan.dueAmount > balanceAfterThreeWarnings);
  assert.equal(world.notifications.filter((item) => /repayment warning/.test(item.title)).length, 3);
});

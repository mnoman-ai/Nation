import test from 'node:test';
import assert from 'node:assert/strict';
import { TIME_CONFIG, TimeEngine } from '../src/engine/TimeEngine.js';
import { SAVE_VERSION, migrateSave, serializeWorld, deserializeWorld } from '../src/engine/save.js';
import {
  submitPartyRegistration, processPartyRegistrationDeadlines,
  setManifestoPolicy, addManifestoPromise, publishManifesto,
  sendMeetingInvitation, respondToMeetingInvitation, attendMeeting, concludeMeeting,
  fileCourtCase, recordCourtHearing, issueCourtVerdict,
  publishMediaReport, ensureV130, submitCandidateNomination, scrutiniseNomination,
} from '../src/engine/v130/index.js';

function makeWorld() {
  return {
    saveVersion: 3,
    seed: 12345,
    time: { date: '2025-01-01T08:00:00.000Z' },
    player: { name: 'Test Player', partyId: 'P1', partyOffice: 'Party President', money: 25000, influence: 1, reputation: 50, media: 30 },
    parties: [
      { party_id: 'P1', party_name: 'Civic Party', short_name: 'CIV', members: 1, public_support: 40 },
      { party_id: 'P2', party_name: 'People Party', short_name: 'PEO', members: 10, public_support: 35 },
    ],
    elections: [{ id: 'LS-TEST', type: 'LOK_SABHA', pollDate: '2025-04-01', resultsDate: '2025-04-06', resultPublished: false, result: null }],
    notifications: [],
    publicMood: 50,
    player: { name: 'Test Player', partyId: 'P1', partyOffice: 'Party President', money: 25000, influence: 1, reputation: 50, media: 30 },
    partyFunds: 0,
    policies: [{ id: 'EDU-1', name: 'School renewal', cost: 100000, durationMonths: 3, status: 'Proposed' }],
    activePolicies: [],
    economy: { budget: { reserveFund: 500000 } },
    bills: [],
    sessions: [],
  };
}

test('v1.3 uses 30 real seconds per game day', () => {
  assert.equal(TIME_CONFIG.secondsPerGameDay, 30);
  const clock = new TimeEngine({ date: '2025-01-01T00:00:00Z', mode: 'real-time' });
  clock.resume();
  assert.equal(clock.consumeRealSeconds(29.9).advanced, 0);
  assert.equal(clock.consumeRealSeconds(0.1).advanced, 1);
});

test('party registration charges exactly ₹10,000 and resolves after seven in-game days', () => {
  const world = makeWorld();
  const app = submitPartyRegistration(world, { name: 'New Civic Movement', abbreviation: 'NCM', ideology: 'Centrist', headquarters: 'New Delhi', constitution: 'A written democratic constitution.', manifesto: { status: 'Draft', initialText: 'A public manifesto with accountable policy commitments.', categories: {}, promises: [] } });
  assert.equal(world.player.money, 15000);
  assert.equal(world.parties.length, 2, 'party must not be active before EC approval');
  assert.equal(app.decisionDate, '2025-01-08');
  world.time.date = '2025-01-07T08:00:00.000Z';
  assert.equal(processPartyRegistrationDeadlines(world), 0);
  world.time.date = '2025-01-08T08:00:00.000Z';
  assert.equal(processPartyRegistrationDeadlines(world), 1);
  assert.equal(app.status, 'Approved');
  assert.equal(world.player.partyId, app.partyId);
  assert.equal(world.parties.length, 3);
  assert.ok(world.notifications.some((n) => n.id === `REG-DECISION-${app.id}`));
});

test('party registration has no influence or membership gate', () => {
  const world = makeWorld();
  world.player.money = 10000;
  world.player.influence = 0;
  world.player.members = 0;
  assert.doesNotThrow(() => submitPartyRegistration(world, { name: 'Open Party', abbreviation: 'OP', ideology: 'Centre', headquarters: 'Pune', constitution: 'Open membership.' }));
});

test('manifesto policies and promises publish with a calculated fiscal estimate', async () => {
  const world = makeWorld();
  setManifestoPolicy(world, 'Education', { title: 'School renewal', fiscalCost: 125000, priority: 5, policyId: 'EDU-1' });
  addManifestoPromise(world, { title: 'Publish school quality data', category: 'Education', estimatedCost: 25000, linkedPolicyId: 'EDU-1', voterGroups: ['Youth', 'Women'] });
  const result = publishManifesto(world);
  assert.equal(result.totalCost, 150000);
  assert.equal(world.parties[0].manifesto.status, 'Published');
  assert.equal(world.parties[0].manifesto.estimatedTotalCost, 150000);
  const { implementManifestoPolicy } = await import('../src/engine/v130/manifesto.js');
  implementManifestoPolicy(world, 'Education');
  assert.equal(world.policies[0].status, 'Funded');
  assert.deepEqual(world.activePolicies, ['EDU-1']);
});

test('accepted meeting is scheduled three in-game days later; rejected invite creates no meeting', () => {
  const world = makeWorld();
  const accepted = sendMeetingInvitation(world, { partyId: 'P2', purpose: 'Seat-sharing discussion', agenda: 'Constituency arrangements' });
  const meeting = respondToMeetingInvitation(world, accepted.id, 'Accepted');
  assert.equal(meeting.scheduledDate, '2025-01-04');
  const rejected = sendMeetingInvitation(world, { partyId: 'P2', purpose: 'Policy dialogue' });
  respondToMeetingInvitation(world, rejected.id, 'Rejected');
  assert.equal(ensureV130(world).meetings.length, 1);
  assert.equal(rejected.meetingId, null);
});

test('meeting attendance and agreement update the alliance register', () => {
  const world = makeWorld();
  const invite = sendMeetingInvitation(world, { partyId: 'P2', purpose: 'Coalition talks' });
  const meeting = respondToMeetingInvitation(world, invite.id, 'Accepted');
  world.time.date = '2025-01-04T08:00:00.000Z';
  attendMeeting(world, meeting.id);
  concludeMeeting(world, meeting.id, { outcome: 'Agreement reached', agreementType: 'Pre-election alliance', terms: { seatSharing: true } });
  assert.equal(world.alliances.length, 1);
  assert.equal(world.alliances[0].type, 'Pre-election alliance');
});

test('court case requires evidence facts and reasoned verdict', () => {
  const world = makeWorld();
  const record = fileCourtCase(world, { category: 'Election Petition', title: 'Constituency challenge', facts: 'Documented irregularities are alleged in the constituency count.', court: 'High Court' });
  world.time.date = '2025-01-15T08:00:00.000Z';
  recordCourtHearing(world, record.id, { summary: 'The court reviewed the filed records and heard both sides.' });
  const verdict = issueCourtVerdict(world, record.id, { outcome: 'Petition Dismissed', rationale: 'The evidence submitted does not establish a material breach of election procedure.' });
  assert.equal(verdict.outcome, 'Petition Dismissed');
  assert.equal(record.status, 'Decided');
});

test('media report affects public mood and party support through reach, credibility and sentiment', () => {
  const world = makeWorld();
  const { report, impact } = publishMediaReport(world, { houseId: 'NNN', headline: 'Budget debate begins', body: 'The national budget debate opened today.', targetPartyId: 'P1', sentiment: 10, factuality: 100 });
  assert.ok(impact > 0);
  assert.ok(world.publicMood > 50);
  assert.ok(world.parties[0].public_support > 40);
  assert.equal(report.houseId, 'NNN');
});

test('candidate nomination charges filing fee and supports scrutiny decision', () => {
  const world = makeWorld();
  world.partyFunds = 5000;
  const nomination = submitCandidateNomination(world, { electionId: 'LS-TEST', constituencyId: 'C-1', candidateId: 'PLAYER', partyId: 'P1' });
  assert.equal(world.partyFunds, 0);
  assert.equal(world.player.money, 25000);
  world.time.date = `${nomination.scrutinyDate}T08:00:00.000Z`;
  scrutiniseNomination(world, nomination.id, 'Approved', 'Eligibility and documents verified.');
  assert.equal(nomination.status, 'Approved');
});

test('v1.0-v1.3 save migrations preserve player data and add institution containers', () => {
  const old = { saveVersion: 3, world: { seed: 9, player: { name: 'Legacy Player' }, notifications: [] } };
  const migrated = migrateSave(old);
  assert.equal(SAVE_VERSION, 4);
  assert.equal(migrated.world.player.name, 'Legacy Player');
  assert.ok(migrated.world.institutions);
  const raw = serializeWorld(migrated.world);
  const restored = deserializeWorld(raw);
  assert.equal(restored.player.name, 'Legacy Player');
  assert.ok(restored.institutions);
});

test('party membership is a pending application until party organisation responds', async () => {
  const world = makeWorld();
  const { submitPartyMembership, decidePartyMembership } = await import('../src/engine/v130/partyRegistry.js');
  const application = submitPartyMembership(world, 'P2', { politicalBackground: 'Community organiser', statement: 'I want to work on local public services and member outreach.' });
  assert.equal(world.player.partyId, 'P1');
  assert.equal(application.status, 'Pending');
  decidePartyMembership(world, application.id, 'Accepted', 'Ordinary Member', 'The local party committee approved the application.');
  assert.equal(world.player.partyId, 'P2');
  assert.equal(world.player.partyOffice, 'Ordinary Member');
});

test('internal party governance records leadership elections and faction formation', async () => {
  const world = makeWorld();
  const { startLeadershipElection, nominateInternalCandidate, resolveInternalElection, formPartyFaction } = await import('../src/engine/v130/partyGovernance.js');
  world.partyMembers = [{ candidate_id: 'MEMBER-2', initial_party_id: 'P1', full_name: 'Member Two', loyalty: 90 }];
  const election = startLeadershipElection(world, 'P1');
  nominateInternalCandidate(world, election.id, { candidateId: 'MEMBER-2', score: 20, loyalty: 90, support: 80 });
  const result = resolveInternalElection(world, election.id);
  assert.equal(election.status, 'Completed');
  assert.ok(result.winnerId);
  const faction = formPartyFaction(world, { name: 'Reform Group', partyId: 'P1', platform: 'Internal transparency' });
  assert.equal(faction.status, 'Active');
  assert.equal(world.institutions.partyFactions.length, 1);
});

test('independent court adjudication is evidence-weighted, not selected by player preference', async () => {
  const world = makeWorld();
  const { adjudicateCourtCase } = await import('../src/engine/v130/judiciary.js');
  const record = fileCourtCase(world, { category: 'Election Petition', title: 'Documented count dispute', facts: 'The petitioner submits a detailed record and three independently verifiable documents.', evidence: ['Form 17C', 'Counting agent affidavit', 'Returning officer record', 'Observer report'] });
  const result = adjudicateCourtCase(world, record.id);
  assert.equal(result.outcome, 'Petition Allowed');
  assert.equal(record.verdict.outcome, 'Petition Allowed');
  assert.match(record.verdict.rationale, /not party affiliation/i);
});

test('multi-day time advance executes each intermediate day and stops at an auto-pause', () => {
  let ticks = 0;
  const clock = new TimeEngine({ date: '2025-01-01T00:00:00Z', onTick: () => { ticks += 1; }, autoPause: (date) => date.toISOString().slice(0, 10) === '2025-01-03' ? 'Scheduled institution event' : null });
  const result = clock.tick(7);
  assert.equal(result.advanced, 2);
  assert.equal(ticks, 2);
  assert.equal(result.pauseReason, 'Scheduled institution event');
});

test('real-time auto-pause preserves unprocessed elapsed game days', () => {
  const clock = new TimeEngine({ date: '2025-01-01T00:00:00Z', mode: 'real-time', autoPause: (date) => date.toISOString().slice(0, 10) === '2025-01-02' ? 'Decision due' : null });
  clock.resume();
  const result = clock.consumeRealSeconds(90);
  assert.equal(result.advanced, 1);
  assert.equal(clock.elapsedReal, 60);
  assert.equal(clock.paused, true);
});

test('institution notifications are deduplicated by stable ID', async () => {
  const world = makeWorld();
  const { addNotification } = await import('../src/engine/v130/shared.js');
  addNotification(world, { id: 'UNIQUE-1', title: 'Notice', body: 'First' });
  addNotification(world, { id: 'UNIQUE-1', title: 'Notice duplicate', body: 'Second' });
  assert.equal(world.notifications.filter((item) => item.id === 'UNIQUE-1').length, 1);
});

test('migrated legacy saves initialize all institution records and seven media houses', () => {
  const migrated = migrateSave({ saveVersion: 3, world: { player: { name: 'Legacy' }, time: { date: '2025-01-01T08:00:00.000Z' }, notifications: [] } });
  assert.equal(migrated.world.institutions.mediaHouses.length, 7);
  assert.ok(Array.isArray(migrated.world.institutions.partyMembershipApplications));
  assert.ok(Array.isArray(migrated.world.institutions.internalElections));
});

test('clock snapshot preserves speed, pause state and fractional elapsed time', () => {
  const original = new TimeEngine({ date: '2025-01-01T00:00:00Z', mode: 'real-time' });
  original.setSpeed(4);
  original.resume();
  original.consumeRealSeconds(2);
  const restored = new TimeEngine();
  restored.restore(original.snapshot());
  assert.equal(restored.speed, 4);
  assert.equal(restored.mode, 'real-time');
  assert.equal(restored.elapsedReal, 8);
  assert.equal(restored.paused, false);
});

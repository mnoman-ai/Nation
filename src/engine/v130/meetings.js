import { addDays, addNotification, ensureV130, nextId } from './shared.js';

export function sendMeetingInvitation(world, { partyId, purpose, agenda = '', proposedTerms = {} }) {
  const party = world.parties.find((item) => item.party_id === partyId);
  if (!party) throw new Error('Invited party was not found');
  if (partyId === world.player.partyId) throw new Error('You cannot invite your own party');
  if (!String(purpose || '').trim()) throw new Error('Meeting purpose is required');
  const institutions = ensureV130(world);
  const invitation = { id: nextId(world, 'INVITE'), fromPartyId: world.player.partyId || 'INDEPENDENT', toPartyId: partyId, purpose: String(purpose).trim(), agenda: String(agenda).trim(), proposedTerms: structuredClone(proposedTerms), sentAt: world.time.date, status: 'Pending', respondedAt: null, meetingId: null };
  institutions.meetingInvitations.push(invitation);
  addNotification(world, { id: `MEETING-INVITE-${invitation.id}`, title: 'Political meeting invitation sent', body: `Invitation sent to ${party.party_name}: ${invitation.purpose}.`, type: 'Meeting', target: 'Meetings' });
  return invitation;
}

export function sendMeetingInvitations(world, { partyIds, ...details }) {
  if (!Array.isArray(partyIds) || !partyIds.length) throw new Error('Select at least one political party');
  const unique = [...new Set(partyIds)];
  return unique.map((partyId) => sendMeetingInvitation(world, { ...details, partyId }));
}

export function respondToMeetingInvitation(world, invitationId, response) {
  const invitation = ensureV130(world).meetingInvitations.find((item) => item.id === invitationId);
  if (!invitation || invitation.status !== 'Pending') throw new Error('Pending invitation not found');
  if (!['Accepted', 'Rejected'].includes(response)) throw new Error('Response must be Accepted or Rejected');
  invitation.status = response;
  invitation.respondedAt = world.time.date;
  if (response === 'Accepted') {
    const meeting = { id: nextId(world, 'MEETING'), invitationId, partyIds: [invitation.fromPartyId, invitation.toPartyId], purpose: invitation.purpose, agenda: invitation.agenda, proposedTerms: invitation.proposedTerms, acceptedAt: world.time.date, scheduledDate: addDays(world.time.date, Number(world.balance?.v130?.meetingScheduleDays || 3)), status: 'Scheduled', discussion: [], decisions: [], agreement: null };
    ensureV130(world).meetings.push(meeting);
    invitation.meetingId = meeting.id;
    addNotification(world, { id: `MEETING-SCHEDULED-${meeting.id}`, title: 'Political meeting scheduled', body: `Meeting accepted. It is scheduled for ${meeting.scheduledDate}, three in-game days after acceptance.`, type: 'Meeting', priority: 'high', target: 'Meetings' });
    return meeting;
  }
  addNotification(world, { id: `MEETING-REJECTED-${invitation.id}`, title: 'Meeting invitation declined', body: `The invitation concerning ${invitation.purpose} was rejected.`, type: 'Meeting', target: 'Meetings' });
  return invitation;
}

export function attendMeeting(world, meetingId) {
  const meeting = ensureV130(world).meetings.find((item) => item.id === meetingId);
  if (!meeting || meeting.status !== 'Scheduled') throw new Error('Scheduled meeting not found');
  const today = world.time.date.slice(0, 10);
  if (today < meeting.scheduledDate) throw new Error(`Meeting is scheduled for ${meeting.scheduledDate}`);
  meeting.status = 'In Progress';
  meeting.attendedAt = world.time.date;
  return meeting;
}

export function recordMeetingDiscussion(world, meetingId, entry) {
  const meeting = ensureV130(world).meetings.find((item) => item.id === meetingId);
  if (!meeting || meeting.status !== 'In Progress') throw new Error('Meeting must be in progress');
  if (!String(entry?.topic || '').trim()) throw new Error('Discussion topic is required');
  const record = { topic: String(entry.topic).trim(), position: String(entry.position || '').trim(), recordedAt: world.time.date };
  meeting.discussion.push(record);
  return record;
}

export function concludeMeeting(world, meetingId, { outcome, terms = {}, agreementType = null }) {
  const meeting = ensureV130(world).meetings.find((item) => item.id === meetingId);
  if (!meeting || meeting.status !== 'In Progress') throw new Error('Meeting must be in progress');
  meeting.status = 'Completed';
  meeting.concludedAt = world.time.date;
  meeting.outcome = String(outcome || 'No agreement reached');
  if (agreementType) {
    meeting.agreement = { id: nextId(world, 'AGREEMENT'), type: agreementType, partyIds: [...meeting.partyIds], terms: structuredClone(terms), signedAt: world.time.date, status: 'Active' };
    world.alliances ??= [];
    world.alliances.push({ id: meeting.agreement.id, partyIds: [...meeting.partyIds], members: [...meeting.partyIds], type: agreementType, terms: structuredClone(terms), status: 'Active', createdAt: world.time.date });
  }
  return meeting;
}

export function processMeetingDeadlines(world) {
  const today = world.time.date.slice(0, 10);
  let count = 0;
  for (const invitation of ensureV130(world).meetingInvitations) {
    if (invitation.status !== 'Pending' || invitation.fromPartyId === 'INDEPENDENT') continue;
    const sentDay = invitation.sentAt.slice(0, 10);
    if (addDays(sentDay, 1) > today) continue;
    const inviting = world.parties.find((party) => party.party_id === invitation.fromPartyId);
    const invited = world.parties.find((party) => party.party_id === invitation.toPartyId);
    const compatibility = Number(invited?.coalition_compatibility ?? 50);
    const unity = Number(invited?.internal_unity ?? 50);
    const supportGap = Math.abs(Number(invited?.public_support || 0) - Number(inviting?.public_support || 0));
    const purpose = invitation.purpose.toLowerCase();
    const strategicFit = purpose.includes('seat') || purpose.includes('coalition') || purpose.includes('cooperation') ? 8 : 0;
    const decisionScore = compatibility * 0.55 + unity * 0.25 + (100 - supportGap) * 0.12 + strategicFit;
    respondToMeetingInvitation(world, invitation.id, decisionScore >= 48 ? 'Accepted' : 'Rejected');
    count += 1;
  }
  for (const meeting of ensureV130(world).meetings) {
    if (meeting.status === 'Scheduled' && meeting.scheduledDate <= today) {
      addNotification(world, { id: `MEETING-DUE-${meeting.id}`, title: 'Political meeting is due', body: `${meeting.purpose} meeting is scheduled for ${meeting.scheduledDate}.`, type: 'Meeting', priority: 'high', target: 'Meetings' });
      count += 1;
    }
  }
  return count;
}

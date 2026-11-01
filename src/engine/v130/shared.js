import mediaCatalog from '../../../data/media.json' with { type: 'json' };
export function ensureV130(world) {
  world.institutions ??= {};
  const i = world.institutions;
  i.partyApplications ??= [];
  i.partyMembershipApplications ??= [];
  i.partyFactions ??= [];
  i.internalElections ??= [];
  i.disciplinaryRecords ??= [];
  i.partyOfficeBearers ??= [];
  i.partyDefections ??= [];
  i.meetings ??= [];
  i.meetingInvitations ??= [];
  i.courtCases ??= [];
  i.mediaHouses ??= defaultMediaHouses();
  i.mediaReports ??= [];
  i.symbols ??= { available: ['Rising Sun', 'Open Book', 'Harvest', 'Water Wheel', 'Mountain', 'Torch', 'Tree', 'Lion', 'Peacock', 'Bridge'], allocated: {} };
  i.electionNotices ??= [];
  i.candidateNominations ??= [];
  i.eventQueue ??= [];
  i.sequence ??= 1;
  world.notifications ??= [];
  return i;
}

export function nextId(world, prefix) {
  const i = ensureV130(world);
  const id = `${prefix}-${String(i.sequence++).padStart(6, '0')}`;
  return id;
}

export function addNotification(world, { id, title, body, type = 'Important', priority = 'normal', target = null }) {
  ensureV130(world);
  const key = String(id);
  if (world.notifications.some((item) => item.id === key)) return null;
  const notification = { id: key, title, body, type, priority, target, date: world.time?.date || null, read: false };
  world.notifications.unshift(notification);
  return notification;
}

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function requireParty(world, partyId = world.player?.partyId) {
  const party = world.parties?.find((item) => item.party_id === partyId);
  if (!party) throw new Error('A valid political party is required');
  return party;
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function defaultMediaHouses() { return structuredClone(mediaCatalog); }

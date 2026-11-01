import { ensureV130 } from './v130/shared.js';
export const SAVE_VERSION = 4;

export function migrateSave(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid save data');
  const save = structuredClone(input);
  let version = Number(save.saveVersion || 1);
  if (!Number.isInteger(version) || version < 1) throw new Error('Invalid save version');
  if (version > SAVE_VERSION) throw new Error('Save is from a newer game version');
  while (version < SAVE_VERSION) {
    if (version === 1) {
      save.world ??= { player: save.player || {}, notifications: save.notifications || [] };
      save.settings ??= { volume: 65, timeMode: 'turn-based' };
      version = 2;
    } else if (version === 2) {
      save.world ??= {};
      save.world.seed ??= 241024;
      save.world.rngState ??= save.world.seed;
      save.world.notifications ??= save.notifications || [];
    ensureV130(save.world);
      version = 3;
    } else if (version === 3) {
      save.world ??= {};
      save.world.institutions ??= {};
      save.world.institutions.partyApplications ??= [];
      save.world.institutions.partyMembershipApplications ??= [];
      save.world.institutions.partyFactions ??= [];
      save.world.institutions.internalElections ??= [];
      save.world.institutions.disciplinaryRecords ??= [];
      save.world.institutions.partyOfficeBearers ??= [];
      save.world.institutions.meetings ??= [];
      save.world.institutions.meetingInvitations ??= [];
      save.world.institutions.courtCases ??= [];
      save.world.institutions.mediaReports ??= [];
      
      save.world.institutions.electionNotices ??= [];
      save.world.institutions.candidateNominations ??= [];
      save.world.institutions.eventQueue ??= [];
      save.world.institutions.sequence ??= 1;
      version = 4;
    }
    save.saveVersion = version;
  }
  save.saveVersion = SAVE_VERSION;
  if (save.world) {
    save.world.saveVersion = SAVE_VERSION;
    save.world.notifications ??= save.notifications || [];
    ensureV130(save.world);
  }
  return save;
}

export function serializeGame(state) {
  if (!state || typeof state !== 'object') throw new Error('Cannot serialize an empty game state');
  return JSON.stringify({ ...state, saveVersion: SAVE_VERSION });
}

export function deserializeGame(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return migrateSave(parsed);
}

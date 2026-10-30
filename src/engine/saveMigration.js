export const SAVE_VERSION = 2;

export function migrateSave(save) {
  if (!save || typeof save !== 'object' || Array.isArray(save)) throw new Error('Invalid save');
  let migrated = { ...save };
  let version = Number(migrated.saveVersion || 0);
  if (!Number.isFinite(version) || version < 0) throw new Error('Invalid save version');
  if (version > SAVE_VERSION) throw new Error('Save is from a newer version');
  while (version < SAVE_VERSION) {
    if (version === 0) {
      migrated = {
        ...migrated,
        saveVersion: 1,
        settings: { volume: 0.7, ...(migrated.settings || {}) },
        notifications: migrated.notifications || [],
      };
      version = 1;
    } else if (version === 1) {
      migrated = {
        ...migrated,
        saveVersion: 2,
        calendar: migrated.calendar || { monthIndex: Number(migrated.month) || 0, year: 2026, month: 1, dateLabel: '2026-01', timeMode: 'turn-based' },
        historyLog: migrated.historyLog || [],
        electionResults: migrated.electionResults || [],
        lastElectionResult: migrated.lastElectionResult || null,
        latestResults: migrated.latestResults || { LOK_SABHA: null, ASSEMBLY: {}, BY_ELECTION: null },
      };
      version = 2;
    } else {
      throw new Error(`No migration available from save version ${version}`);
    }
  }
  return migrated;
}

export function serializeGame(state) {
  if (!state || typeof state !== 'object') throw new Error('Cannot serialize an empty game state');
  return JSON.stringify(state);
}

export function deserializeGame(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return migrateSave(parsed);
}

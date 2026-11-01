import { SAVE_VERSION, migrateSave } from './saveMigration.js';
export { SAVE_VERSION, migrateSave };

export function serializeWorld(world) {
  if (!world || typeof world !== 'object') throw new Error('Cannot serialize an empty world');
  return JSON.stringify({ saveVersion: SAVE_VERSION, world: { ...world, saveVersion: SAVE_VERSION } });
}

export function deserializeWorld(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return migrateSave(parsed).world;
}

export function stableWorld(world) {
  return JSON.stringify(world);
}

import Dexie from 'dexie';
import { serializeWorld, deserializeWorld } from './save.js';

const db = new Dexie('NationV110');
db.version(1).stores({ saves: 'slot,updatedAt' });

export async function saveSlot(slot, world) {
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error('Save slot must be 1, 2 or 3');
  const payload = serializeWorld(world);
  const record = { slot, updatedAt: new Date().toISOString(), payload };
  try { await db.saves.put(record); } catch { /* local fallback below */ }
  try { localStorage.setItem(`nation-slot-${slot}`, payload); } catch { /* storage may be unavailable */ }
  return record;
}

export async function loadSlot(slot) {
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error('Save slot must be 1, 2 or 3');
  let payload = null;
  try {
    const record = await db.saves.get(slot);
    payload = record?.payload || null;
  } catch { /* use local fallback below */ }
  if (!payload) {
    try { payload = localStorage.getItem(`nation-slot-${slot}`); } catch { payload = null; }
  }
  return payload ? deserializeWorld(payload) : null;
}

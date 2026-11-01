import Dexie from 'dexie';
import { serializeWorld, deserializeWorld } from './save.js';

const db = new Dexie('NationV110');
db.version(1).stores({ saves: 'slot,updatedAt' });
db.version(2).stores({ saves: 'slot,updatedAt', backups: '++id,slot,createdAt' });

export async function saveSlot(slot, world) {
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error('Save slot must be 1, 2 or 3');
  const payload = serializeWorld(world);
  try { const previous = await db.saves.get(slot); if (previous?.payload) await db.backups.add({ slot, createdAt: new Date().toISOString(), payload: previous.payload }); } catch { /* local snapshot remains available */ }
  try { const previous = localStorage.getItem(`nation-slot-${slot}`); if (previous) localStorage.setItem(`nation-slot-${slot}-backup`, previous); } catch { /* storage may be unavailable */ }
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

export async function deleteSlot(slot) {
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error('Save slot must be 1, 2 or 3');
  try { await db.saves.delete(slot); } catch { /* local snapshot removal still applies */ }
  try { localStorage.removeItem(`nation-slot-${slot}`); localStorage.removeItem(`nation-save-${slot}`); } catch { /* storage may be unavailable */ }
  return true;
}

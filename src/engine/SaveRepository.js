import Dexie from 'dexie';
const db = new Dexie('nation-v110');
db.version(1).stores({ saves: 'slot,updatedAt' });
db.version(2).stores({ saves: 'slot,updatedAt', backups: '++id,slot,createdAt' });
export class SaveRepository {
  async save(slot, state) {
    const payload = JSON.parse(JSON.stringify(state)); payload.saveVersion = 4;
    const previous = await db.saves.get(slot);
    if (previous?.payload) await db.backups.add({ slot, createdAt: new Date().toISOString(), payload: previous.payload });
    await db.saves.put({ slot, updatedAt: new Date().toISOString(), payload }); return true;
  }
  async load(slot) { const row = await db.saves.get(slot); return row?.payload || null; }
  async list() { return db.saves.toArray(); }
  async listBackups(slot) { return db.backups.where('slot').equals(slot).reverse().toArray(); }
  async remove(slot) { return db.saves.delete(slot); }
}

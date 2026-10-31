import Dexie from 'dexie';
const db=new Dexie('nation-v110');db.version(1).stores({saves:'slot,updatedAt'});
export class SaveRepository{
 async save(slot,state){const payload=JSON.parse(JSON.stringify(state));payload.saveVersion=2;await db.saves.put({slot,updatedAt:new Date().toISOString(),payload});return true;}
 async load(slot){const row=await db.saves.get(slot);return row?.payload||null;}
 async list(){return db.saves.toArray();}
 async remove(slot){return db.saves.delete(slot);}
}

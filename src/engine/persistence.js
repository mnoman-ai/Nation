import Dexie from'dexie';import{serializeWorld,deserializeWorld}from'./save.js';
const db=new Dexie('NationV110');db.version(1).stores({saves:'slot,updatedAt'});export async function saveSlot(slot,world){if(!Number.isInteger(slot)||slot<1||slot>3)throw new Error('Save slot must be 1, 2 or 3');const record={slot,updatedAt:new Date().toISOString(),payload:serializeWorld(world)};try{await db.saves.put(record);}catch{}try{localStorage.setItem(`nation-save-${slot}`,record.payload);}catch{}return record;}
export async function loadSlot(slot){try{const record=await db.saves.get(slot);if(record?.payload)return deserializeWorld(record.payload);}catch{}try{const raw=localStorage.getItem(`nation-save-${slot}`);return raw?deserializeWorld(raw):null;}catch{return null;}}
export async function listSaveSlots(){try{const rows=await db.saves.toArray();return[1,2,3].map(slot=>rows.find(x=>x.slot===slot)||null);}catch{return[1,2,3].map(slot=>({slot,updatedAt:null}));}}
export async function deleteSlot(slot){try{await db.saves.delete(slot);}catch{}try{localStorage.removeItem(`nation-save-${slot}`);}catch{}}
export{db as saveDatabase};

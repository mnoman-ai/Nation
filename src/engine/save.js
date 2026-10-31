export const SAVE_VERSION=3;
export function migrateSave(input){let s=structuredClone(input);const v=s.saveVersion||1;if(v> SAVE_VERSION)throw new Error('Save version is newer than this game');if(v<2){s.world=s.world||{player:s.player||{},notifications:s.notifications||[]};s.saveVersion=2;}if((s.saveVersion||1)<3){s.world.seed=s.world.seed||241024;s.world.rngState=s.world.rngState||s.world.seed;s.saveVersion=3;}return s;}
export function serializeWorld(world){return JSON.stringify({saveVersion:SAVE_VERSION,world});}
export function deserializeWorld(raw){const parsed=typeof raw==='string'?JSON.parse(raw):raw;return migrateSave(parsed).world;}
export function stableWorld(world){return JSON.stringify(world,Object.keys(world).sort());}

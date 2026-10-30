import test from 'node:test';import assert from 'node:assert/strict';import{tick,seededRandom}from'../src/engine/timeEngine.js';
test('time engine advances exactly the requested months',()=>{assert.equal(tick({turn:4},1).turn,5);assert.equal(tick({turn:4},3).turn,7);});
test('time engine rejects invalid month delta',()=>{assert.throws(()=>tick({turn:1},-1),RangeError);});
test('seeded RNG is deterministic',()=>{const a=seededRandom(42),b=seededRandom(42);assert.deepEqual([a(),a(),a()],[b(),b(),b()]);});

import test from 'node:test';import assert from 'node:assert/strict';import{TimeEngine}from'../src/engine/TimeEngine.js';
test('TimeEngine advances deterministic month ticks',()=>{const e=new TimeEngine();assert.equal(e.tick(1),1);assert.equal(e.tick(3),4);});
test('TimeEngine rejects invalid deltas',()=>{const e=new TimeEngine();assert.throws(()=>e.tick(0));assert.throws(()=>e.tick(-1));assert.throws(()=>e.tick(1.5));});

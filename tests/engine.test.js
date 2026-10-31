import test from'node:test';import assert from'node:assert/strict';import{TimeEngine}from'../src/engine/TimeEngine.js';
test('TimeEngine advances calendar days',()=>{const e=new TimeEngine();assert.equal(e.tick(1).date,'2025-01-02T08:00:00.000Z');assert.equal(e.tick(3).date,'2025-01-05T08:00:00.000Z');});
test('TimeEngine rejects invalid deltas',()=>{const e=new TimeEngine();assert.throws(()=>e.tick(0));assert.throws(()=>e.tick(-1));assert.throws(()=>e.tick(1.5));});

import test from 'node:test';
import assert from 'node:assert/strict';
import { TimeEngine } from '../src/engine/TimeEngine.js';
import { createRng } from '../src/engine/rng.js';

test('TimeEngine advances exactly the requested number of days', () => {
  const clock = new TimeEngine({ date: '2025-01-01T08:00:00Z' });
  assert.equal(clock.tick(1).advanced, 1);
  assert.equal(clock.iso.slice(0, 10), '2025-01-02');
  assert.equal(clock.tick(3).advanced, 3);
  assert.equal(clock.iso.slice(0, 10), '2025-01-05');
});

test('TimeEngine rejects invalid day delta', () => {
  const clock = new TimeEngine();
  assert.throws(() => clock.tick(-1), /positive integer/);
});

test('seeded RNG is deterministic', () => {
  const a = createRng(42);
  const b = createRng(42);
  assert.deepEqual([a.next(), a.next(), a.next()], [b.next(), b.next(), b.next()]);
});

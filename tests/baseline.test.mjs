import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('fictional party dataset contains 34 parties', () => {
  const rows = JSON.parse(fs.readFileSync('data/parties.json', 'utf8'));
  assert.equal(rows.length, 34);
});

test('state reference contains 36 jurisdictions', () => {
  const rows = JSON.parse(fs.readFileSync('data/states.json', 'utf8'));
  assert.equal(rows.length, 36);
});

test('strict art registry has ten supplied banners, reserved A11-A13/D12-D16 fallbacks and 34 emblems', () => {
  const manifest = JSON.parse(fs.readFileSync('assets/manifest.json', 'utf8'));
  assert.equal(new Set(Object.values(manifest.banners).filter(Boolean)).size, 10);
  assert.equal(Object.keys(manifest.banners).length, 23);
  assert.equal(manifest.banners.courts, null);
  assert.equal(manifest.banners.meetings, null);
  assert.equal(manifest.banners.electionCommission, null);
  assert.deepEqual(manifest.reservedSlots, { A11: null, A12: null, A13: null, D12: null, D13: null, D14: null, D15: null, D16: null });
  assert.equal(Object.keys(manifest.emblems).length, 34);
});

test('event art is explicitly empty and all event slots use safe fallbacks', () => {
  const manifest = JSON.parse(fs.readFileSync('assets/manifest.json', 'utf8'));
  assert.equal(Object.keys(manifest.events).length, 12);
  assert.equal(Object.values(manifest.events).filter(Boolean).length, 0);
  assert.equal(manifest.events.festivalUnity, null);
});

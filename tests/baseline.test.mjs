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

test('strict art registry has ten banner assets, twenty screen slots and 34 emblems', () => {
  const manifest = JSON.parse(fs.readFileSync('assets/manifest.json', 'utf8'));
  assert.equal(new Set(Object.values(manifest.banners)).size, 10);
  assert.equal(Object.keys(manifest.banners).length, 20);
  assert.equal(Object.keys(manifest.emblems).length, 34);
});

test('event art has eleven supplied files and G12 remains an explicit gold-icon fallback', () => {
  const manifest = JSON.parse(fs.readFileSync('assets/manifest.json', 'utf8'));
  assert.equal(Object.keys(manifest.events).length, 12);
  assert.equal(Object.values(manifest.events).filter(Boolean).length, 11);
  assert.equal(manifest.events.festivalUnity, null);
});

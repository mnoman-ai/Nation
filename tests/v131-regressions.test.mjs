import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Android navigation and game controls expose independent touch-scroll regions', () => {
  const app = read('../src/main.jsx');
  const css = read('../src/styles/v130.css');
  assert.match(app, /className="primary-nav-scroll" aria-label="Main navigation"/);
  assert.match(app, /className="time-controls game-controls-scroll"/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /touch-action:\s*pan-x pan-y/);
  assert.match(css, /\.topbar\s*>\s*\.primary-nav-scroll/);
  assert.match(css, /\.topbar\s*>\s*\.game-controls-scroll/);
});

test('world deadline updates synchronize authoritative player affiliation into UI state', () => {
  const store = read('../src/state/store.js');
  assert.match(store, /player:\{\.\.\.world\.player\}/);
  const engine = read('../src/engine/GameEngine.js');
  assert.match(engine, /processV130Deadlines\(world\)/);
});

test('Election Commission UI distinguishes application decision from active party affiliation', () => {
  const panel = read('../src/components/EnginePanel.jsx');
  assert.match(panel, /Application: \{application\.status\}/);
  assert.match(panel, /Party status: \{registeredParty\.registrationStatus\}/);
  assert.match(panel, /Player affiliation:/);
});

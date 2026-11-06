import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import registry from '../src/assets/registry.json' with { type: 'json' };

const root = process.cwd();

test('v1.4.0 registers every S01-S10 scene and local fallback file', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/manifest.json'), 'utf8'));
  const offline = JSON.parse(fs.readFileSync(path.join(root, 'public/offline-assets.json'), 'utf8'));
  for (let n = 1; n <= 10; n++) {
    const id = `S${String(n).padStart(2, '0')}`;
    const slot = `scene.${id}`;
    assert.equal(registry[slot], `/assets/scenes/${id}.svg`);
    assert.ok(fs.existsSync(path.join(root, 'assets/scenes', `${id}.svg`)));
    assert.equal(manifest.scenes[id], `scenes/${id}.svg`);
    assert.ok(offline.includes(`./assets/scenes/${id}.svg`));
  }
});

test('main menu waits for boot and uses the classic layout', () => {
  const source = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
  assert.match(source, /function LoadingScreen/);
  assert.match(source, /if \(!bootReady\) return <LoadingScreen/);
  assert.match(source, /menu-classic-panel/);
  assert.match(source, /menu-classic-hero/);
});

test('only manual day advances remain in the top bar; time controls are in Settings', () => {
  const source = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
  const header = source.slice(source.indexOf('function Header()'), source.indexOf('function Dashboard()'));
  assert.match(header, /\+1 Day/);
  assert.match(header, /\+7 Days/);
  assert.doesNotMatch(header, />Save</);
  assert.doesNotMatch(header, />Pause</);
  assert.doesNotMatch(header, />1×</);
  assert.match(source, /Pause Time/);
  assert.match(source, /1× Speed/);
  assert.match(source, /2× Speed/);
  assert.match(source, /4× Speed/);
});

test('portrait rotate instruction has been removed from the launch document', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles/responsive.css'), 'utf8');
  assert.doesNotMatch(html, /portrait-rotate-overlay|Please rotate your device/);
  assert.doesNotMatch(css, /portrait-rotate-overlay/);
});

test('manifesto preview is a user-facing visual summary, not raw JSON', () => {
  const source = fs.readFileSync(path.join(root, 'src/components/EnginePanel.jsx'), 'utf8');
  assert.doesNotMatch(source, /JSON\.stringify\(/);
  assert.match(source, /manifesto-visual-preview/);
});

import fs from 'node:fs';
import path from 'node:path';
import registry from '../src/assets/registry.json' with { type: 'json' };
const root = process.cwd();
const errors = [];
const documentedFallbacks = new Set([
  'player.B03','player.B05','player.B11',
  ...Array.from({length:12},(_,index)=>`event.G${String(index+1).padStart(2,'0')}`),
  'banner.courts','banner.meetings','banner.electionCommission',
  'thumb.courts.supreme','thumb.courts.high','thumb.courts.lower','thumb.party.registration','thumb.alliance.meeting',
  'banner.A11','banner.A12','banner.A13','thumb.D12','thumb.D13','thumb.D14','thumb.D15','thumb.D16',
]);
for (const [key, value] of Object.entries(registry)) {
  if (!value) { if (!documentedFallbacks.has(key)) errors.push(`${key}: undocumented empty asset slot`); continue; }
  const file = path.join(root, value.replace(/^\//, ''));
  if (!fs.existsSync(file)) errors.push(`${key}: missing ${value}`);
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      const source = fs.readFileSync(file, 'utf8');
      if (/(?:src|url)\s*=\s*["'`]\/?assets\//.test(source)) errors.push(`${path.relative(root,file)}: image path outside registry`);
    }
  }
}
walk(path.join(root,'src'));
// v1.4.0 strict S01–S10 scene registry contract.
const sceneManifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/manifest.json'), 'utf8')).scenes || {};
for (let index = 1; index <= 10; index++) {
  const id = `S${String(index).padStart(2, '0')}`;
  const key = `scene.${id}`;
  const manifestPath = sceneManifest[id];
  const expected = manifestPath ? `/assets/${manifestPath}` : '';
  if (!expected || !/\.(webp|svg)$/.test(manifestPath)) errors.push(`assets/manifest.json scenes.${id}: invalid scene path ${manifestPath}`);
  if (registry[key] !== expected) errors.push(`${key}: expected ${expected}, received ${registry[key]}`);
  if (expected && !fs.existsSync(path.join(root, expected.slice(1)))) errors.push(`${key}: missing scene file ${expected}`);
}

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Asset registry OK (${Object.keys(registry).length} slots; ${documentedFallbacks.size} explicit fallbacks; S01–S10 contract verified).`);

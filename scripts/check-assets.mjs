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
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Asset registry OK (${Object.keys(registry).length} slots; ${documentedFallbacks.size} explicit fallbacks).`);

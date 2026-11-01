import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const roots = ['src', 'scripts', 'tests'];
const sourceFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:js|mjs|cjs)$/.test(entry.name)) sourceFiles.push(file);
  }
}
for (const dir of roots) walk(dir);
for (const file of sourceFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/check-ui.mjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/check-assets.mjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/check-project.mjs'], { stdio: 'inherit' });
console.log(`JavaScript syntax check passed (${sourceFiles.length} JS/MJS/CJS files).`);

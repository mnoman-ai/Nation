import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(jsx|js)$/.test(entry.name)) files.push(file);
  }
}
walk(path.join(root, 'src'));
const failures = [];
const forbidden = [
  /information architecture/i,
  /Open Section/,
  /Explore the systems/,
  /fictional credits/i,
  /\bsupplied\b/i,
  /not present/i,
  /\bfallback\b/i,
  /Arjun Verma/,
];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const isVisibleSource = file.endsWith('.jsx') || file.endsWith('src/content/strings.en.js');
  if (isVisibleSource) for (const pattern of forbidden) if (pattern.test(source)) failures.push(`${path.relative(root, file)} contains forbidden UI text: ${pattern}`);
  if (/Arjun Verma/.test(source)) failures.push(`${path.relative(root, file)} contains the removed player identity`);
  if (/\.(jsx)$/.test(file)) {
    const tags = source.match(/<button\b[^>]*>/g) || [];
    for (const tag of tags) {
      if (!/\bonClick\s*=/.test(tag) && !/\bdisabled\b/.test(tag)) {
        failures.push(`${path.relative(root, file)} has a button without an action or disabled state: ${tag.slice(0, 140)}`);
      }
    }
  }
}
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log(`UI contract scan passed for ${files.length} source files.`);

import fs from 'node:fs';import path from 'node:path';
const required=['index.html','package.json','src/main.jsx','src/styles.css','assets/manifest.json','data-source/CANDIDATES.csv','data-source/POLITICAL_PARTIES.csv','docs/ARCHITECTURE.md'];
const missing=required.filter(x=>!fs.existsSync(x));if(missing.length){console.error('Missing:',missing.join(', '));process.exit(1);}
const manifest=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));
for(const group of ['banners','players','cards','thumbnails','emblems'])for(const [id,v] of Object.entries(manifest[group]))if(v.file&&!fs.existsSync('.'+v.file))console.error(`Missing asset ${id}: ${v.file}`);
console.log('Project structure and asset manifest checked.');

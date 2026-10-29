import fs from 'node:fs/promises';
import path from 'node:path';
const sourceDir=path.resolve('data-source'), outDir=path.resolve('data');
const specs=[
 {names:['POLITICAL_PARTIES_1.csv','POLITICAL_PARTIES.csv'],out:'political-parties.json',key:'party_id'},
 {names:['PARTY_LEADERSHIP.csv'],out:'party-leadership.json'},
 {names:['PARTY_STATE_UNITS.csv'],out:'party-state-units.json'},
 {names:['STATES_REFERENCE.csv'],out:'states-reference.json',key:'state_id'},
 {names:['CONSTITUENCIES.csv'],out:'constituencies.json',key:'constituency_id'},
 {names:['CONSTITUENCY_SEAT_COUNTS.csv'],out:'constituency-seat-counts.json'},
 {names:['DATA_DICTIONARY.csv'],out:'data-dictionary.json'},
 {names:['VALIDATION_REPORT.csv'],out:'validation-report.json'},
 {names:['CANDIDATE_AFFILIATIONS.csv'],out:'candidate-affiliations.json'},
 {names:['ELECTION_CANDIDATURES.csv'],out:'election-candidatures.json'},
 {names:['CANDIDATES.csv'],out:'candidates.json',key:'candidate_id',large:true}
];
export function parseCsv(text){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];
  if(quoted){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++;}else quoted=false;}else field+=ch;}
  else if(ch==='"'&&field.length===0)quoted=true;
  else if(ch===','){row.push(field);field='';}
  else if(ch==='\n'){row.push(field.replace(/\r$/,''));if(row.some(v=>v.length))rows.push(row);row=[];field='';}
  else field+=ch;
 }
 if(field.length||row.length){row.push(field.replace(/\r$/,''));if(row.some(v=>v.length))rows.push(row);}
 if(!rows.length)return [];
 const headers=rows.shift().map(v=>v.replace(/^\uFEFF/,'').trim());
 return rows.map(cells=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??''])));
}
async function main(){
 await fs.mkdir(outDir,{recursive:true});
 const manifest={generatedAt:new Date().toISOString(),generatedFiles:[],missingSources:[],notes:['Source CSV/XLSX files are user-provided.','Constituency seed names and boundaries are fictional, not official geography.','Financial capacity values are fictional game credits, not INR.','Large candidate lists should be queried on demand.']};
 for(const spec of specs){
  let source=null;
  for(const name of spec.names){try{await fs.access(path.join(sourceDir,name));source=path.join(sourceDir,name);break;}catch{}}
  if(!source){manifest.missingSources.push(spec.names[0]);continue;}
  const rows=parseCsv(await fs.readFile(source,'utf8'));
  if(spec.key){const seen=new Set();for(const r of rows){const id=r[spec.key];if(id&&seen.has(id))throw new Error(`Duplicate ${spec.key} "${id}" in ${path.basename(source)}`);if(id)seen.add(id);}}
  await fs.writeFile(path.join(outDir,spec.out),JSON.stringify(rows)+'\n');
  manifest.generatedFiles.push({file:spec.out,source:path.basename(source),records:rows.length,large:!!spec.large});
  console.log(`${path.basename(source)} -> data/${spec.out} (${rows.length} records)`);
 }
 const workbook=path.join(sourceDir,'NATION_CANDIDATES_AND_PARTIES.xlsx');
 try{await fs.access(workbook);try{const XLSX=await import('xlsx');const wb=XLSX.readFile(workbook);for(const name of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});const safe=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');const file=`workbook-${safe}.json`;await fs.writeFile(path.join(outDir,file),JSON.stringify(rows)+'\n');manifest.generatedFiles.push({file,source:path.basename(workbook),sheet:name,records:rows.length});}}catch(e){console.warn('Workbook present but xlsx package unavailable. CSV conversion continued. To enable: npm install --save-dev xlsx');}}
 catch{}
 await fs.writeFile(path.join(outDir,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(`Data build done. Generated ${manifest.generatedFiles.length} JSON files.`);
 if(manifest.missingSources.length)console.log('Not present yet: '+manifest.missingSources.join(', '));
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) main().catch(e=>{console.error('Data build failed:',e.message);process.exitCode=1;});

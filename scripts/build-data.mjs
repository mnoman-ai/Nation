import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),src=path.join(root,'data-source'),out=path.join(root,'public','data');
fs.mkdirSync(out,{recursive:true});
function parseCSV(s){const rows=[];let row=[],v='',q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'&&s[i+1]==='"'){v+='"';i++;}else if(c==='"')q=false;else v+=c;}else if(c==='"')q=true;else if(c===','){row.push(v);v='';}else if(c==='\n'){row.push(v.replace(/\r$/,''));rows.push(row);row=[];v='';}else v+=c;}if(v.length||row.length){row.push(v.replace(/\r$/,''));rows.push(row);}const h=rows.shift()||[];return rows.filter(r=>r.length>1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])));}
const states=parseCSV(fs.readFileSync(path.join(src,'STATES_REFERENCE.csv'),'utf8'));
const parties=parseCSV(fs.readFileSync(path.join(src,'POLITICAL_PARTIES.csv'),'utf8'));
fs.writeFileSync(path.join(out,'states.json'),JSON.stringify(states));fs.writeFileSync(path.join(out,'parties.json'),JSON.stringify(parties));
const candidates=parseCSV(fs.readFileSync(path.join(src,'CANDIDATES.csv'),'utf8'));
const byState=new Map();for(const c of candidates){const k=c.state_id||'UNASSIGNED';if(!byState.has(k))byState.set(k,[]);byState.get(k).push(c);}
const dir=path.join(out,'candidates');fs.mkdirSync(dir,{recursive:true});for(const [k,v] of byState)fs.writeFileSync(path.join(dir,`${k}.json`),JSON.stringify(v));
console.log(`Built ${states.length} states, ${parties.length} parties and ${candidates.length} candidates across ${byState.size} state files.`);

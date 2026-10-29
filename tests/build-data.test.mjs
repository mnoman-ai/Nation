import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseCsv} from '../scripts/build-data.mjs';
test('CSV parser preserves commas and escaped quotes inside cells',()=>{
 const rows=parseCsv('id,name,note\n1,"Verma, Arjun","Said ""hello"""\n');
 assert.equal(rows.length,1);assert.equal(rows[0].name,'Verma, Arjun');assert.equal(rows[0].note,'Said "hello"');
});
test('economy shares total 100 and budget balances',async()=>{
 const e=JSON.parse(await readFile(new URL('../data/economy.json',import.meta.url),'utf8'));const b=e.baseline;
 assert.equal(b.defenceSharePercent+b.healthSharePercent+b.educationSharePercent+b.infrastructureSharePercent+b.socialWelfareSharePercent+b.otherSharePercent,100);
 assert.equal(b.annualRevenue,b.annualExpenditure);
});

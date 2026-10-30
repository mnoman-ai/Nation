import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('fictional party dataset contains 34 parties',()=>{const x=JSON.parse(fs.readFileSync('data/parties.json','utf8'));assert.equal(x.length,34);});
test('state reference contains 36 jurisdictions',()=>{const x=JSON.parse(fs.readFileSync('data/states.json','utf8'));assert.equal(x.length,36);});
test('art manifest contains 10 banners and 34 emblems',()=>{const x=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));assert.equal(Object.keys(x.banners).length,10);assert.equal(Object.keys(x.emblems).length,34);});
test('event art gaps are explicitly recorded',()=>{const x=JSON.parse(fs.readFileSync('assets/manifest.json','utf8'));assert.equal(Object.keys(x.events).length,12);assert.ok(Object.values(x.events).every(v=>v.status==='missing'));});

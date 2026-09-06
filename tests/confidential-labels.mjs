import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const forbidden = ['i','m','s','w','e','b'].join('');
const allowedExtensions = new Set(['.js','.mjs','.html','.md','.json','.css','.yml','.yaml','.txt']);
const ignoredDirs = new Set(['.git','node_modules']);
const hits = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (text.toLowerCase().includes(forbidden)) hits.push(full.replaceAll('\\','/'));
  }
}

walk('.');
assert.deepEqual(hits, [], `Referință internă interzisă în: ${hits.join(', ')}`);
console.log('Confidențialitate: nicio referință la denumirea internă în fișierele publice.');

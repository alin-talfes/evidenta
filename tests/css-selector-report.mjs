import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'tests', 'docs']);
const sourceExt = new Set(['.html', '.js', '.mjs', '.json']);

function walk(dir, includeIgnored = false) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (!includeIgnored && ignoredDirs.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full, includeIgnored) : [full];
  });
}

const allRuntime = walk(root).filter(file => sourceExt.has(path.extname(file)));
const corpus = allRuntime.map(file => {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}).join('\n');
const cssFiles = walk(root, true).filter(file => file.endsWith('.css') && !file.includes(`${path.sep}node_modules${path.sep}`));

const tokenUsed = token => {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9_-])${escaped}([^A-Za-z0-9_-]|$)`).test(corpus);
};

const candidates = [];
for (const file of cssFiles) {
  let css;
  try { css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); } catch { continue; }
  for (const match of css.matchAll(/([^{}]+)\{/g)) {
    const prelude = match[1].trim();
    if (!prelude || prelude.startsWith('@') || /^(?:from|to|\d+(?:\.\d+)?%)$/i.test(prelude)) continue;
    if (/:is\(|:where\(|:not\(|:has\(/.test(prelude)) continue;
    for (const selector of prelude.split(',')) {
      const tokens = [
        ...selector.matchAll(/\.([A-Za-z_][\w-]*)/g),
        ...selector.matchAll(/#([A-Za-z_][\w-]*)/g)
      ].map(item => item[1]);
      if (!tokens.length) continue;
      const missing = [...new Set(tokens.filter(token => !tokenUsed(token)))];
      if (missing.length) {
        candidates.push({
          file: path.relative(root, file).replaceAll('\\', '/'),
          selector: selector.trim().replace(/\s+/g, ' '),
          missing
        });
      }
    }
  }
}

const grouped = new Map();
for (const item of candidates) {
  if (!grouped.has(item.file)) grouped.set(item.file, []);
  grouped.get(item.file).push(item);
}

console.log(`CSS selector audit: ${candidates.length} selectori candidați pentru verificare manuală în ${grouped.size} fișiere.`);
for (const [file, items] of [...grouped.entries()].sort()) {
  console.log(`\n[${file}] ${items.length}`);
  for (const item of items.slice(0, 80)) console.log(`- ${item.selector} | lipsă: ${item.missing.join(', ')}`);
  if (items.length > 80) console.log(`- ... încă ${items.length - 80}`);
}

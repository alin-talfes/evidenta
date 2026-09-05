import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules']);
const sourceExtensions = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.yml', '.yaml']);
const ignoredReferenceFiles = new Set([
  'tests/css-ghosts.mjs',
  'ofiter/scripts/audit-css.mjs'
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (ignoredDirs.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const normalize = value => path.relative(root, value).replaceAll('\\', '/');
const allFiles = walk(root);
const cssFiles = allFiles.filter(file => file.endsWith('.css')).map(normalize).sort();
const references = new Map(cssFiles.map(file => [file, new Set()]));

function resolveCssReference(sourceFile, raw) {
  const clean = raw.trim().split(/[?#]/, 1)[0];
  if (!clean || /^(?:https?:|data:|blob:|\/\/)/i.test(clean)) return null;
  const sourceDir = path.dirname(sourceFile);
  const absolute = clean.startsWith('/')
    ? path.join(root, clean.replace(/^\/+/, ''))
    : path.resolve(sourceDir, clean);
  const relative = normalize(absolute);
  return references.has(relative) ? relative : null;
}

for (const sourceFile of allFiles) {
  const relativeSource = normalize(sourceFile);
  if (ignoredReferenceFiles.has(relativeSource)) continue;
  if (!sourceExtensions.has(path.extname(sourceFile))) continue;

  let text;
  try { text = fs.readFileSync(sourceFile, 'utf8'); } catch { continue; }

  // Captures stylesheet paths in HTML, JS loaders, CSS @import/url and build scripts.
  const candidates = new Set();
  for (const match of text.matchAll(/["'`](?!https?:|data:|blob:)([^"'`\n]*?\.css(?:\?[^"'`\n]*)?)["'`]/gi)) {
    candidates.add(match[1]);
  }
  for (const match of text.matchAll(/url\(\s*["']?([^"')\s]+\.css(?:\?[^"')\s]*)?)["']?\s*\)/gi)) {
    candidates.add(match[1]);
  }

  for (const raw of candidates) {
    const target = resolveCssReference(sourceFile, raw);
    if (target && target !== relativeSource) references.get(target).add(relativeSource);
  }
}

const ghosts = cssFiles.filter(file => references.get(file).size === 0);
if (ghosts.length) {
  console.error(`CSS ghost audit FAILED (${ghosts.length} fișiere fără traseu de încărcare):`);
  for (const file of ghosts) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`CSS ghost audit OK: ${cssFiles.length} fișiere CSS, toate au un traseu de încărcare sau build declarat.`);

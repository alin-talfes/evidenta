import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('transfer/rules/index.html', 'utf8');
const js = fs.readFileSync('transfer/rules-page.js', 'utf8');
const css = fs.readFileSync('css/transfer-rules.css', 'utf8');

assert(html.includes('transfer-rules.css?v=3'), 'Annex page must load its dedicated unified stylesheet');
assert(html.includes('type="search"') && html.includes('aria-label="Caută în toate anexele"'), 'Global search must be accessible and use search semantics');
assert(html.includes('id="filterEmpty"') && html.includes('aria-live="polite"'), 'Search must expose an accessible empty state and live status');
assert(html.includes('rules-page.js?v=20261030-3'), 'Annex runtime must load the corrected cache-busted script');
assert(js.includes('normalizeSearch'), 'Search must normalize Romanian diacritics');
assert(js.includes("querySelectorAll('.card[id^=\"anexa\"][id$=\"Card\"]')"), 'Filter must target all eight annex cards with a syntactically valid selector');
assert(js.includes("!el.querySelector('.rules-table')"), 'Static annex text must be searched separately from generated table rows');
assert(js.includes('row.hidden = !matches'), 'Non-matching rows must be hidden without removing their annex');
assert(js.includes('filterEmpty.hidden = query === \'\' || visibleAnnexes > 0'), 'No-results message must reflect actual annex matches');
assert(css.includes('var(--ev-surface)'), 'Annex styles must use shared PWA design tokens');
assert(css.includes('overflow-x: auto'), 'Wide annex tables must scroll horizontally on small screens');
assert(css.includes('@media (max-width: 640px)'), 'Annex layout must include mobile-specific rules');

console.log('Transfer annex search and responsive UI regression checks passed.');

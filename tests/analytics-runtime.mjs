import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const runtime = read('js/analytics.js');
const consentCss = read('css/analytics-consent.css');
const dashboard = read('analytics/index.html');
const dashboardJs = read('analytics/app.js');
const aiHtml = read('ai/index.html');
const sw = read('sw.js');
const aiSw = read('ai/security-sw.js');
const theme = read('js/theme.js');

for (const marker of [
  "const CONSENT_KEY = 'ev_analytics_consent_v1'",
  "consent() !== 'accepted'",
  "storageSet(CONSENT_KEY, 'accepted')",
  "storageSet(CONSENT_KEY, 'declined')",
  "storageRemove(DEVICE_KEY)",
  "crypto.randomUUID",
  "event_type: eventType",
  "credentials: 'omit'",
  "referrerPolicy: 'no-referrer'",
  "Prefer: 'return=minimal'"
]) assert.ok(runtime.includes(marker), `Analytics runtime trebuie să păstreze ${marker}`);

for (const forbidden of [
  'navigator.userAgent',
  'userAgent',
  'document.cookie',
  'geolocation',
  'nume_complet',
  'camera',
  'situatie_juridica',
  'rawText',
  'fileInput'
]) assert.ok(!runtime.includes(forbidden), `Analytics nu trebuie să colecteze ${forbidden}`);

assert.ok(runtime.includes("if (route === '/analytics/') return;"), 'Dashboard-ul admin nu trebuie să se auto-contorizeze.');
assert.ok(runtime.includes("['app_open', 'page_view']"), 'Tipurile de evenimente trebuie să rămână limitate.');
assert.ok(runtime.includes("routeName()"), 'Analytics trebuie să trimită doar ruta normalizată.');
assert.ok(consentCss.includes('.ev-analytics-consent'));
assert.ok(consentCss.includes('.ev-analytics-settings'));

for (const marker of [
  'noindex,nofollow,noarchive,nosnippet',
  '../css/design-system.css?v=4',
  'Autentificare administrator',
  'Dispozitive totale',
  'Dispozitive active',
  'Evoluție zilnică',
  'Module accesate',
  'Tipuri de dispozitive'
]) assert.ok(dashboard.includes(marker), `Dashboard-ul analytics trebuie să includă ${marker}`);

for (const marker of [
  "profile.role !== 'admin'",
  "profile.active !== true",
  "rpc('analytics_summary'",
  "rpc('analytics_daily'",
  "rpc('analytics_modules'",
  "sessionStorage.setItem",
  "credentials: 'omit'"
]) assert.ok(dashboardJs.includes(marker), `Dashboard-ul analytics trebuie să includă ${marker}`);

assert.ok(aiHtml.includes("connect-src 'self' https://pqydyzrtlfvtxldmcdzs.supabase.co"), 'CSP AI trebuie să permită exclusiv endpoint-ul Supabase folosit de analytics, în plus față de self.');
assert.ok(theme.includes('ensureAnalyticsRuntime()'));
assert.ok(theme.includes('../js/analytics.js?v=1'));
assert.ok(theme.includes('../css/analytics-consent.css?v=1'));

for (const marker of ['./analytics/', './analytics/index.html', './analytics/styles.css', './analytics/app.js', './js/analytics.js', './css/analytics-consent.css']) {
  assert.ok(sw.includes(marker), `Root SW trebuie să includă ${marker}`);
}
for (const marker of ['../js/analytics.js', '../css/analytics-consent.css']) {
  assert.ok(aiSw.includes(marker), `AI SW trebuie să includă ${marker}`);
}

console.log('Analytics: consimțământ explicit, identificator aleatoriu, fără date PPL/fingerprinting și dashboard limitat la admin.');

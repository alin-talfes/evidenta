/* Evidență PPL — root PWA service worker */
'use strict';

const VERSION = 'v1';
const STATIC_CACHE = `evidenta-static-${VERSION}`;
const RUNTIME_CACHE = `evidenta-runtime-${VERSION}`;
const PREFIXES = ['evidenta-static-', 'evidenta-runtime-'];
const SCOPE = new URL(self.registration.scope);

const CORE_PATHS = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
  './favicon-ev-2.svg',
  './contopiri/',
  './transfer/',
  './transfer/rules/',
  './instructaj/',
  './semnalmente/',
  './ai/',
  './css/style.css',
  './css/design-system.css',
  './css/operational-upgrades.css',
  './css/mobile-operational-v2.css',
  './css/pwa-mobile.css',
  './js/theme.js',
  './js/version.js',
  './js/utils.js',
  './js/rules.js',
  './js/legal.js',
  './js/storage.js',
  './js/export.js',
  './js/ui.js',
  './js/app.js',
  './js/deduction-ui.js',
  './js/contopiri-core.js',
  './js/contopiri.js',
  './js/operational-upgrades.js',
  './js/operational-corrections.js',
  './js/operational-finalize.js',
  './js/mobile-operational-v2.js',
  './js/pwa-register.js',
  './transfer/app.js',
  './transfer/rules.js',
  './instructaj/styles.css',
  './instructaj/audit-enhancements.css',
  './instructaj/data.js',
  './instructaj/app.js',
  './instructaj/omj2188-completari.js',
  './instructaj/verificare-dosar-transfer.js',
  './semnalmente/enhancements.js',
  './ai/index.html',
  './ai/styles.css',
  './ai/security.css',
  './ai/source-preview.css',
  './ai/core.js',
  './ai/safety.js',
  './ai/ocr-ro.js',
  './ai/real-doc-deductions.js',
  './ai/real-doc-hardening.js',
  './ai/beta-lot2-hardening.js',
  './ai/beta-lot2-postprocess.js',
  './ai/beta-lot3-hardening.js',
  './ai/beta-lot3-postprocess.js',
  './ai/beta-lot3-metadata.js',
  './ai/beta-lot3-measures.js',
  './ai/beta-lot4-hardening.js',
  './ai/beta-lot5-hardening.js',
  './ai/beta-lot7-start-date.js',
  './ai/contopire-audit.js',
  './ai/dependencies.js',
  './ai/security-runtime.js',
  './ai/date-mask.js',
  './ai/deduction-rules.js',
  './ai/file-dedup.js',
  './ai/file-dedup-runtime.js',
  './ai/app.js',
  './ai/source-preview.js',
  './ai/result-pedepse.js'
];

function absolute(path) { return new URL(path, SCOPE).href; }

async function warm(cache, paths) {
  await Promise.allSettled(paths.map(async path => {
    const request = new Request(absolute(path), { cache:'reload', credentials:'same-origin' });
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response);
  }));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await warm(cache, CORE_PATHS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => PREFIXES.some(prefix => name.startsWith(prefix)) && ![STATIC_CACHE, RUNTIME_CACHE].includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request, { ignoreSearch:true });
    if (cached) return cached;
    const url = new URL(request.url);
    const candidates = [
      url.pathname.endsWith('/ai/') ? './ai/index.html' : null,
      url.pathname.endsWith('/contopiri/') ? './contopiri/' : null,
      url.pathname.endsWith('/transfer/') ? './transfer/' : null,
      url.pathname.includes('/transfer/rules') ? './transfer/rules/' : null,
      url.pathname.endsWith('/instructaj/') ? './instructaj/' : null,
      url.pathname.endsWith('/semnalmente/') ? './semnalmente/' : null,
      './index.html',
      './'
    ].filter(Boolean);
    for (const candidate of candidates) {
      const hit = await caches.match(absolute(candidate), { ignoreSearch:true });
      if (hit) return hit;
    }
    return new Response('Aplicația nu este disponibilă offline încă. Deschide modulul o dată când ai conexiune.', {
      status:503,
      headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
    });
  }
}

async function staticResponse(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request, { ignoreSearch:true });
  const update = fetch(request).then(async response => {
    if (response.ok && response.type !== 'opaque') await cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  if (cached) {
    void update;
    return cached;
  }
  return (await update) || new Response('', { status:504, statusText:'Offline' });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/ai/_secure/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }
  const destination = request.destination;
  if (['script','style','image','font','manifest','worker'].includes(destination) || /\.(?:js|css|json|svg|png|webp|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staticResponse(request));
  }
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'PRECACHE_OPTIONAL' && Array.isArray(data.paths)) {
    event.waitUntil((async () => {
      const cache = await caches.open(STATIC_CACHE);
      await warm(cache, data.paths.filter(path => typeof path === 'string').slice(0, 100));
    })());
  }
});

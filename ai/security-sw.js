/* Evidență AI — secure dependency proxy + offline shell (scope: /ai/) */
'use strict';

const SECURE_CACHE = 'evidenta-ai-secure-deps-v5';
const SHELL_CACHE = 'evidenta-ai-shell-v22';
const RUNTIME_CACHE = 'evidenta-ai-runtime-v22';
const PREFIX = '/_secure/';
const SCOPE = new URL(self.registration.scope);

const RESOURCES = {
  'pdf/pdf.min.mjs': {
    url: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/legacy/build/pdf.min.mjs',
    sha256: '9fab0c910bf1484835c5c2aeb68f7eb3dfce7f9eb435a004526c5af86d70890c',
    bytes: 512483,
    type: 'text/javascript; charset=utf-8'
  },
  'pdf/pdf.worker.min.mjs': {
    url: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/legacy/build/pdf.worker.min.mjs',
    sha256: 'bc0d1b88ea0b66196b1d36a58ac243c6d92adfe725624e2a9fdd381bdf8ef434',
    bytes: 1312452,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract/tesseract.min.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js',
    sha256: '10fff78484067759c43028a02a72d76d0b90eb17302bb23b58a9ec5410bc928b',
    bytes: 62961,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract/worker.min.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
    sha256: '38645599043239c0eb6db08a6504a92dcdc292200535f3e9339cd77c4443b842',
    bytes: 111162,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core-lstm.wasm.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/tesseract-core-lstm.wasm.js',
    sha256: '775a35df6f2ae100e02609443e6bd5cafcd07983dd6175454ca4a432a7730687',
    bytes: 3954181,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core-lstm.wasm': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/tesseract-core-lstm.wasm',
    sha256: '220e2e87551edccb85519796a170469f8ab2a8055216789e3b8b1ada18b7bc2b',
    bytes: 2871085,
    type: 'application/wasm'
  },
  'tessdata-best/ron.traineddata.gz': {
    url: 'https://tessdata.projectnaptha.com/4.0.0_best/ron.traineddata.gz',
    sha256: 'df2a1d0084f58da0fc6f08831e86fcac28f8995213e081331d06c3b0cab6b596',
    bytes: 8029921,
    type: 'application/gzip'
  }
};

const SHELL_PATHS = [
  './', './index.html', './styles.css', './security.css', './source-preview.css',
  './core.js', './safety.js', './ocr-ro.js', './real-doc-deductions.js', './real-doc-hardening.js',
  './beta-lot2-hardening.js', './beta-lot2-postprocess.js', './beta-lot3-hardening.js', './beta-lot3-postprocess.js',
  './beta-lot3-metadata.js', './beta-lot3-measures.js', './beta-lot4-hardening.js', './beta-lot5-hardening.js',
  './beta-lot7-start-date.js', './beta-lot7-duration.js', './contopire-audit.js', './dependencies.js', './security-runtime.js',
  './date-mask.js', './deduction-rules.js', './file-dedup.js', './file-dedup-runtime.js', './app.js', './source-preview.js', './result-pedepse.js',
  '../manifest.json', '../version.json', '../favicon-ev-2.svg',
  '../css/style.css', '../css/design-system.css', '../css/operational-upgrades.css', '../css/mobile.css', '../css/mobile-modules.css', '../css/disclosure-hardening.css', '../css/analytics-consent.css',
  '../js/theme.js', '../js/version.js', '../js/ux-upgrades.js', '../js/analytics.js', '../js/utils.js', '../js/rules.js', '../js/contopiri-core.js',
  '../js/operational-navigation.js', '../js/operational-ai.js', '../js/no-nonoptional-disclosures-v1.js', '../js/disclosure-hardening-v2.js',
  '../js/pwa-register.js'
];

function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function resourceKey(url) {
  const marker = '/ai/_secure/';
  const i = url.pathname.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.pathname.slice(i + marker.length)) : '';
}

async function verifiedResponse(request, resource) {
  const cache = await caches.open(SECURE_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(resource.url, {
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer'
  });
  if (!response.ok) throw new Error(`Dependency fetch failed: ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== resource.bytes) throw new Error('Dependency length mismatch');
  const digest = hex(await crypto.subtle.digest('SHA-256', bytes));
  if (digest !== resource.sha256) throw new Error('Dependency SHA-256 mismatch');

  const safe = new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': resource.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin'
    }
  });
  await cache.put(request, safe.clone());
  return safe;
}

function scoped(path) { return new URL(path, SCOPE).href; }

async function warmShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.allSettled(SHELL_PATHS.map(async path => {
    const request = new Request(scoped(path), { cache:'reload', credentials:'same-origin' });
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response);
  }));
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request, { cache:'no-store' });
    if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone()).catch(() => {});
    return response;
  } catch (_) {
    return (await caches.match(request, { ignoreSearch:true }))
      || (await caches.match(scoped('./index.html'), { ignoreSearch:true }))
      || (await caches.match(scoped('./'), { ignoreSearch:true }))
      || new Response('Modulul AI nu este disponibil offline încă. Deschide-l o dată cu internet pentru inițializare.', {
        status:503,
        headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
      });
  }
}

async function networkFirstStatic(request) {
  try {
    const response = await fetch(request, { cache:'no-store' });
    if (response.ok && response.type !== 'opaque') {
      await (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    }
    return response;
  } catch (_) {
    return (await caches.match(request, { ignoreSearch:true })) || new Response('', { status:504, statusText:'Offline' });
  }
}

async function staticResponse(request) {
  const cached = await caches.match(request, { ignoreSearch:true });
  const refresh = fetch(request).then(async response => {
    if (response.ok && response.type !== 'opaque') await (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    return response;
  }).catch(() => null);
  if (cached) {
    void refresh;
    return cached;
  }
  return (await refresh) || new Response('', { status:504, statusText:'Offline' });
}

function isCriticalSharedRuntime(url) {
  return /\/js\/(?:version|ux-upgrades|analytics|operational-navigation|operational-ai|no-nonoptional-disclosures-v1|disclosure-hardening-v2|pwa-register)\.js$/i.test(url.pathname)
    || /\/css\/(?:mobile|mobile-modules|operational-upgrades|disclosure-hardening|analytics-consent)\.css$/i.test(url.pathname);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await warmShell();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const current = new Set([SECURE_CACHE, SHELL_CACHE, RUNTIME_CACHE]);
    await Promise.all(names.filter(name => (name.startsWith('evidenta-ai-secure-deps-') || name.startsWith('evidenta-ai-shell-') || name.startsWith('evidenta-ai-runtime-')) && !current.has(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const key = resourceKey(url);
  if (key) {
    const resource = RESOURCES[key];
    if (!resource) {
      event.respondWith(new Response('Not allowed', { status:404, headers:{'Content-Type':'text/plain'} }));
      return;
    }
    event.respondWith(verifiedResponse(request, resource).catch(() => new Response('Integrity check failed', {
      status:502,
      headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}
    })));
    return;
  }

  if (url.origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (isCriticalSharedRuntime(url)) {
    event.respondWith(networkFirstStatic(request));
    return;
  }
  if (['script','style','image','font','manifest','worker'].includes(request.destination) || /\.(?:js|mjs|css|json|svg|png|webp|wasm|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staticResponse(request));
  }
});
/* Evidență AI — secure dependency proxy (scope: /ai/) */
'use strict';

const CACHE_NAME = 'evidenta-ai-secure-deps-v2';
const PREFIX = '/_secure/';

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
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js',
    sha256: '000c27d9cd0def655f77b36c72a389c0ab13793aa31cb4d7aab56d09c0afbc7e',
    bytes: 62961,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract/worker.min.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
    sha256: '576b7df7e3393e137e51849357c9adb53fe7ac1bb69bfa06cf3d61520f182c6d',
    bytes: 111307,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core.wasm.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core.wasm.js',
    sha256: '0bc6ce3e5fbbd0cd89706cf2fd70960e3372f4f01ee24265b26990808aaeb286',
    bytes: 4687944,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core.wasm': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core.wasm',
    sha256: 'c7f5ace62ac0ad065e71e9c6725f1d7cdf82e7eda8fba532cbb9563964da7098',
    bytes: 3449168,
    type: 'application/wasm'
  },
  'tesseract-core/tesseract-core-simd.wasm.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-simd.wasm.js',
    sha256: '6b61ef4e911b5cf57e656bbfe983d6e2b3711a02dd164154ddda064566e8e09d',
    bytes: 4690932,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core-simd.wasm': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-simd.wasm',
    sha256: '7d237a13edfeb0fa2f104744fccde0a00e0c076c3e23b7a8fc7af75ec9af2c3e',
    bytes: 3451410,
    type: 'application/wasm'
  },
  'tesseract-core/tesseract-core-lstm.wasm.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-lstm.wasm.js',
    sha256: 'eef5f8b2f8e20e150680b20adaec4a60babafee3adbe8a94583c81fee46e8680',
    bytes: 3896484,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core-lstm.wasm': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-lstm.wasm',
    sha256: '66b17df6e20c5329a17ffa9c202a47eaa3e32500b253d4c7f38e7f2bc01457c3',
    bytes: 2855361,
    type: 'application/wasm'
  },
  'tesseract-core/tesseract-core-simd-lstm.wasm.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-simd-lstm.wasm.js',
    sha256: 'c58b46a4c796c0b8afccf77591d5b875b6896b45d402bbce8caa6f5362447b38',
    bytes: 3899472,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core-simd-lstm.wasm': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-simd-lstm.wasm',
    sha256: '34e8d50cac216427d86bf397d610fdd9f49492539bbcdfbfccc4eda20c810bea',
    bytes: 2857601,
    type: 'application/wasm'
  },
  'tesseract-core/tesseract-core-relaxedsimd.wasm.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-relaxedsimd.wasm.js',
    sha256: '843074aa5bad1cc6421b74a86201768ced9f244795e4d81435435a61a40ce535',
    bytes: 4697227,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core-relaxedsimd.wasm': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-relaxedsimd.wasm',
    sha256: '45f8c9b516df326b6ae6b493ed3a6289df5cbd10490e7b6ff8bf5b12ea42d1da',
    bytes: 3456075,
    type: 'application/wasm'
  },
  'tesseract-core/tesseract-core-relaxedsimd-lstm.wasm.js': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-relaxedsimd-lstm.wasm.js',
    sha256: '861a536cf9ef8e63cb644d57bab39c388f37f7d6b6f60024b741c5f6b39a59b3',
    bytes: 3905767,
    type: 'text/javascript; charset=utf-8'
  },
  'tesseract-core/tesseract-core-relaxedsimd-lstm.wasm': {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-relaxedsimd-lstm.wasm',
    sha256: '7985c92d4c64e7267d24cadffe1b2a1da6bf8aa55fdcaf953fe94fe122a24545',
    bytes: 2862266,
    type: 'application/wasm'
  },
  'tessdata-best/ron.traineddata.gz': {
    url: 'https://tessdata.projectnaptha.com/4.0.0_best/ron.traineddata.gz',
    sha256: 'df2a1d0084f58da0fc6f08831e86fcac28f8995213e081331d06c3b0cab6b596',
    bytes: 8029921,
    type: 'application/gzip'
  }
};

function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function resourceKey(url) {
  const marker = '/ai/_secure/';
  const i = url.pathname.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.pathname.slice(i + marker.length)) : '';
}

async function verifiedResponse(request, resource) {
  const cache = await caches.open(CACHE_NAME);
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

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('evidenta-ai-secure-deps-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const key = resourceKey(url);
  if (!key) return;
  const resource = RESOURCES[key];
  if (!resource) {
    event.respondWith(new Response('Not allowed', { status: 404, headers: { 'Content-Type': 'text/plain' } }));
    return;
  }
  event.respondWith(verifiedResponse(event.request, resource).catch(() => new Response('Integrity check failed', { status: 502, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } })));
});

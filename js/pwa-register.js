(() => {
  'use strict';

  if (window.__EVIDENTA_PWA_REGISTER__) return;
  window.__EVIDENTA_PWA_REGISTER__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/pwa-register.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const swUrl = new URL('../sw.js', scriptUrl);

  const LEGACY_MOBILE_STYLE_NAMES = [
    'pwa-mobile.css',
    'mobile-no-floating-v1.css',
    'mobile-no-floating-v2.css',
    'mobile-bottom-nav-clearance-v2.css',
    'mobile-bottom-nav-clearance-v3.css',
    'mobile-bottom-nav-clearance-v4.css',
    'mobile-bottom-nav-clearance-v5.css',
    'mobile-bottom-nav-clearance-v6.css',
    'mobile-runtime-fixes-v2.css'
  ];

  function ensureMeta(name, content, attr = 'name') {
    let meta = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  function ensureLink(rel, href) {
    let link = document.head.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    if (!link.href) link.href = href;
  }

  function ensureViewportFit() {
    let viewport = document.head.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.appendChild(viewport);
      return;
    }
    if (!/\bviewport-fit\s*=\s*cover\b/i.test(viewport.content || '')) {
      const current = String(viewport.content || '').trim().replace(/\s*,\s*$/, '');
      viewport.content = `${current || 'width=device-width, initial-scale=1.0'}, viewport-fit=cover`;
    }
  }

  function removeLegacyMobileStyles() {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      let pathname = '';
      try { pathname = new URL(link.href, document.baseURI).pathname; }
      catch (_) { return; }
      if (LEGACY_MOBILE_STYLE_NAMES.some(name => pathname.endsWith(`/css/${name}`))) link.remove();
    });
  }

  function ensureMobileStyle() {
    removeLegacyMobileStyles();
    let link = document.querySelector('link[data-evidenta-mobile-policy]');
    const href = new URL('../css/mobile.css?v=1', scriptUrl).href;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.evidentaMobilePolicy = 'true';
    }
    if (link.href !== href) link.href = href;
    document.head.appendChild(link);
  }

  function platformClass() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || touchMac;
    const isAndroid = /Android/i.test(ua);
    document.documentElement.classList.toggle('ev-ios', isiOS);
    document.documentElement.classList.toggle('ev-android', isAndroid);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    document.documentElement.classList.toggle('ev-standalone', Boolean(standalone));
  }

  function hardenMobileHead() {
    ensureViewportFit();
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    ensureMeta('apple-mobile-web-app-title', 'Evidență');
    ensureMeta('format-detection', 'telephone=no');
    ensureLink('manifest', new URL('../manifest.json', scriptUrl).href);
    ensureMobileStyle();
  }

  function clearLegacyBottomNavState() {
    const root = document.documentElement;
    root.classList.remove('ev-mobile-nav-inset');
    root.style.removeProperty('--ev-mobile-nav-live-height');
    document.querySelectorAll('.ev-mobile-nav-clearance-spacer').forEach(node => node.remove());
    document.querySelectorAll('[data-ev-bottom-nav-scroll-root]').forEach(node => node.removeAttribute('data-ev-bottom-nav-scroll-root'));
  }

  function syncBottomNavLayout() {
    const root = document.documentElement;
    const mobile = window.matchMedia?.('(max-width: 760px)').matches ?? window.innerWidth <= 760;
    const nav = document.querySelector('.ev-mobile-nav');
    clearLegacyBottomNavState();
    root.classList.toggle('ev-mobile-nav-layout', Boolean(mobile && nav));
    return Boolean(mobile && nav);
  }

  function initBottomNavLayout() {
    syncBottomNavLayout();
    [0, 80, 240, 700, 1600].forEach(delay => window.setTimeout(() => {
      hardenMobileHead();
      syncBottomNavLayout();
    }, delay));
    window.addEventListener('resize', syncBottomNavLayout, { passive:true });
    window.addEventListener('orientationchange', syncBottomNavLayout, { passive:true });
    window.addEventListener('evidenta:shellready', () => {
      hardenMobileHead();
      syncBottomNavLayout();
    });
    window.addEventListener('load', () => {
      hardenMobileHead();
      syncBottomNavLayout();
    }, { once:true });
  }

  function monitorViewport() {
    const viewport = window.visualViewport;
    const update = () => {
      const keyboardOpen = viewport ? window.innerHeight - viewport.height > 150 : false;
      document.documentElement.classList.toggle('ev-virtual-keyboard-open', keyboardOpen);
    };
    if (viewport) viewport.addEventListener('resize', update, { passive:true });
    update();
  }

  async function registerRootWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
    try {
      const registration = await navigator.serviceWorker.register(swUrl.href, {
        scope: rootUrl.href,
        updateViaCache: 'none'
      });
      registration.update().catch(() => {});
      if (registration.waiting) registration.waiting.postMessage({ type:'SKIP_WAITING' });
      return registration;
    } catch (error) {
      console.warn('PWA offline shell indisponibil:', error);
      return null;
    }
  }

  function onlineState() {
    document.documentElement.classList.toggle('ev-offline', !navigator.onLine);
    let badge = document.querySelector('.ev-offline-badge');
    if (navigator.onLine) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'ev-offline-badge';
      badge.setAttribute('role', 'status');
      badge.textContent = 'OFFLINE · calculele locale rămân disponibile';
      document.body.prepend(badge);
    }
  }

  function warmImportantModules(registration) {
    const worker = registration?.active || registration?.waiting || registration?.installing;
    worker?.postMessage?.({
      type:'PRECACHE_OPTIONAL',
      paths:[
        './','./contopiri/','./transfer/','./instructaj/','./semnalmente/','./ai/',
        './css/mobile.css'
      ]
    });
  }

  async function init() {
    hardenMobileHead();
    platformClass();
    monitorViewport();
    initBottomNavLayout();
    onlineState();
    window.addEventListener('online', onlineState);
    window.addEventListener('offline', onlineState);
    window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => {
      platformClass();
      hardenMobileHead();
      syncBottomNavLayout();
    });
    const registration = await registerRootWorker();
    warmImportantModules(registration);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

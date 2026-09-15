(() => {
  'use strict';

  if (window.__EVIDENTA_PWA_REGISTER__) return;
  window.__EVIDENTA_PWA_REGISTER__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/pwa-register.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const swUrl = new URL('../sw.js', scriptUrl);

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

  function ensureStyleSheet() {
    if (document.querySelector('link[data-evidenta-pwa-mobile]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/pwa-mobile.css?v=1', scriptUrl).href;
    link.dataset.evidentaPwaMobile = 'true';
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
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    ensureMeta('apple-mobile-web-app-title', 'Evidență');
    ensureMeta('format-detection', 'telephone=no');
    ensureLink('manifest', new URL('../manifest.json', scriptUrl).href);
    ensureStyleSheet();
  }

  function monitorViewport() {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      document.documentElement.style.setProperty('--ev-visual-height', `${Math.round(viewport.height)}px`);
      const keyboardOpen = window.innerHeight - viewport.height > 150;
      document.documentElement.classList.toggle('ev-virtual-keyboard-open', keyboardOpen);
    };
    viewport.addEventListener('resize', update, { passive:true });
    viewport.addEventListener('scroll', update, { passive:true });
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
      document.body.appendChild(badge);
    }
  }

  function warmImportantModules(registration) {
    const worker = registration?.active || registration?.waiting || registration?.installing;
    worker?.postMessage?.({
      type:'PRECACHE_OPTIONAL',
      paths:['./','./contopiri/','./transfer/','./instructaj/','./semnalmente/','./ai/']
    });
  }

  async function init() {
    hardenMobileHead();
    platformClass();
    monitorViewport();
    onlineState();
    window.addEventListener('online', onlineState);
    window.addEventListener('offline', onlineState);
    window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', platformClass);
    const registration = await registerRootWorker();
    warmImportantModules(registration);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

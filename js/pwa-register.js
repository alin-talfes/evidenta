(() => {
  'use strict';

  if (window.__EVIDENTA_PWA_REGISTER__) return;
  window.__EVIDENTA_PWA_REGISTER__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/pwa-register.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const swUrl = new URL('../sw.js', scriptUrl);
  let navResizeObserver = null;
  let navResizeTarget = null;
  let navMetricRaf = 0;

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

  function ensureStyleSheet() {
    if (document.querySelector('link[data-evidenta-pwa-mobile]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/pwa-mobile.css?v=2', scriptUrl).href;
    link.dataset.evidentaPwaMobile = 'true';
    document.head.appendChild(link);
  }

  function ensureBottomNavClearance() {
    let link = document.querySelector('link[data-evidenta-bottom-nav-clearance]');
    const href = new URL('../css/mobile-bottom-nav-clearance-v4.css?v=1', scriptUrl).href;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.evidentaBottomNavClearance = 'true';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
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
    ensureStyleSheet();
    ensureBottomNavClearance();
  }

  function candidateScrollRoots() {
    return [...document.querySelectorAll([
      'main',
      'body > .container',
      '.ai-page',
      '.app-main',
      '.main-content',
      '.content-area',
      '.dashboard-content',
      '.module-content'
    ].join(','))];
  }

  function syncNestedScrollRoots() {
    candidateScrollRoots().forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      const style = getComputedStyle(node);
      const ownsVerticalScroll = /^(auto|scroll|overlay)$/.test(style.overflowY)
        && node.clientHeight > 0
        && node.scrollHeight > node.clientHeight + 4;
      node.toggleAttribute('data-ev-bottom-nav-scroll-root', ownsVerticalScroll);
    });
  }

  function ensureBottomNavSpacer(nav) {
    let spacer = document.querySelector('.ev-mobile-nav-clearance-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'ev-mobile-nav-clearance-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      spacer.dataset.evBottomNavSpacer = 'true';
    }
    if (nav?.parentElement && spacer.parentElement !== nav.parentElement) {
      nav.insertAdjacentElement('beforebegin', spacer);
    } else if (!spacer.isConnected && document.body) {
      document.body.appendChild(spacer);
    }
    return spacer;
  }

  function syncBottomNavMetricsNow() {
    const root = document.documentElement;
    const mobile = window.matchMedia?.('(max-width: 760px)').matches ?? window.innerWidth <= 760;
    const nav = document.querySelector('.ev-mobile-nav');
    const shouldInset = Boolean(mobile && nav);

    root.classList.toggle('ev-mobile-nav-inset', shouldInset);

    if (!shouldInset) {
      root.style.removeProperty('--ev-mobile-nav-live-height');
      document.querySelectorAll('[data-ev-bottom-nav-scroll-root]').forEach(node => node.removeAttribute('data-ev-bottom-nav-scroll-root'));
      navResizeObserver?.disconnect();
      navResizeObserver = null;
      navResizeTarget = null;
      return false;
    }

    const height = Math.ceil(nav.getBoundingClientRect().height);
    if (height > 0) root.style.setProperty('--ev-mobile-nav-live-height', `${height}px`);
    ensureBottomNavSpacer(nav);
    syncNestedScrollRoots();

    if ('ResizeObserver' in window && navResizeTarget !== nav) {
      navResizeObserver?.disconnect();
      navResizeObserver = new ResizeObserver(() => scheduleBottomNavMetrics());
      navResizeObserver.observe(nav);
      navResizeTarget = nav;
    }
    return height > 0;
  }

  function scheduleBottomNavMetrics() {
    if (navMetricRaf) cancelAnimationFrame(navMetricRaf);
    navMetricRaf = requestAnimationFrame(() => {
      navMetricRaf = 0;
      syncBottomNavMetricsNow();
    });
  }

  function initBottomNavMetrics() {
    scheduleBottomNavMetrics();
    [0, 60, 180, 500, 1200, 2500].forEach(delay => window.setTimeout(scheduleBottomNavMetrics, delay));
    window.addEventListener('resize', scheduleBottomNavMetrics, { passive:true });
    window.addEventListener('orientationchange', scheduleBottomNavMetrics, { passive:true });
    window.addEventListener('evidenta:shellready', scheduleBottomNavMetrics);
    window.addEventListener('load', scheduleBottomNavMetrics, { once:true });
  }

  function monitorViewport() {
    const viewport = window.visualViewport;
    const update = () => {
      if (viewport) document.documentElement.style.setProperty('--ev-visual-height', `${Math.round(viewport.height)}px`);
      else document.documentElement.style.setProperty('--ev-visual-height', `${window.innerHeight}px`);
      const keyboardOpen = viewport ? window.innerHeight - viewport.height > 150 : false;
      document.documentElement.classList.toggle('ev-virtual-keyboard-open', keyboardOpen);
      scheduleBottomNavMetrics();
    };
    if (viewport) {
      viewport.addEventListener('resize', update, { passive:true });
      viewport.addEventListener('scroll', update, { passive:true });
    }
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
    initBottomNavMetrics();
    onlineState();
    window.addEventListener('online', onlineState);
    window.addEventListener('offline', onlineState);
    window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => {
      platformClass();
      scheduleBottomNavMetrics();
    });
    const registration = await registerRootWorker();
    warmImportantModules(registration);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

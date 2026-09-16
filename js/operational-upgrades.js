(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_UPGRADES__) return;
  window.__EVIDENTA_OPERATIONAL_UPGRADES__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-upgrades.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);

  function ensureStyles() {
    if (document.querySelector('link[data-evidenta-operational-upgrades]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/operational-upgrades.css?v=1', scriptUrl).href;
    link.dataset.evidentaOperationalUpgrades = 'true';
    document.head.appendChild(link);
  }

  function ensureController(selector, relativeSrc, datasetKey) {
    if (document.querySelector(selector)) return;
    const script = document.createElement('script');
    script.src = new URL(relativeSrc, scriptUrl).href;
    script.async = false;
    if (datasetKey) script.dataset[datasetKey] = 'true';
    document.head.appendChild(script);
  }

  function page() {
    const fromDataset = document.body?.dataset.evPage || '';
    if (fromDataset) return fromDataset;
    const rootPath = rootUrl.pathname.endsWith('/') ? rootUrl.pathname : `${rootUrl.pathname}/`;
    return location.pathname.startsWith(rootPath)
      ? location.pathname.slice(rootPath.length).replace(/^\/+|\/+$/g, '')
      : '';
  }

  function loadControllers() {
    ensureStyles();
    ensureController(
      'script[data-evidenta-operational-navigation]',
      './operational-navigation.js?v=1',
      'evidentaOperationalNavigation'
    );

    const p = page();
    if (!p || p === 'index.html' || p === 'pedepse') {
      ensureController('script[data-evidenta-operational-pedepse]', './operational-pedepse.js?v=1', 'evidentaOperationalPedepse');
      return;
    }
    if (p.startsWith('ai')) {
      ensureController('script[data-evidenta-operational-ai]', './operational-ai.js?v=1', 'evidentaOperationalAi');
      return;
    }
    if (p.startsWith('contopiri')) {
      ensureController('script[data-evidenta-operational-contopiri]', './operational-contopiri.js?v=1', 'evidentaOperationalContopiri');
      return;
    }
    if (p === 'transfer' || p === 'transfer/index.html') {
      ensureController('script[data-evidenta-operational-transfer]', './operational-transfer.js?v=1', 'evidentaOperationalTransfer');
      return;
    }
    if (p.startsWith('instructaj')) {
      ensureController('script[data-evidenta-operational-instructaj]', './operational-instructaj.js?v=1', 'evidentaOperationalInstructaj');
      return;
    }
    if (p.startsWith('semnalmente')) {
      ensureController('script[data-evidenta-operational-semnalmente]', './operational-semnalmente.js?v=1', 'evidentaOperationalSemnalmente');
    }
  }

  loadControllers();
})();

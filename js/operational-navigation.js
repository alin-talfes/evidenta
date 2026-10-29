(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_NAVIGATION__) return;
  window.__EVIDENTA_OPERATIONAL_NAVIGATION__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-navigation.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);

  function page() {
    const fromDataset = document.body?.dataset.evPage || '';
    if (fromDataset) return fromDataset;
    const rootPath = rootUrl.pathname.endsWith('/') ? rootUrl.pathname : `${rootUrl.pathname}/`;
    return location.pathname.startsWith(rootPath)
      ? location.pathname.slice(rootPath.length).replace(/^\/+|\/+$/g, '')
      : '';
  }

  function isOfficerPage() {
    return String(document.body?.dataset.evPage || '').startsWith('ofiter') || location.pathname.includes('/ofiter/');
  }

  function currentNavKey() {
    const p = page();
    if (!p || p === 'index.html' || p === 'pedepse') return 'pedepse';
    if (p.startsWith('ai')) return 'ai';
    if (p.startsWith('contopiri')) return 'contopiri';
    if (p.startsWith('transfer')) return 'transfer';
    if (p.startsWith('instructaj')) return 'instructaj';
    if (p.startsWith('semnalmente')) return 'semnalmente';
    return '';
  }

  function normalizeTouchInputs() {
    document.querySelectorAll('.date-masked').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });
    document.querySelectorAll('input[type="number"]').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
    });
  }

  function removeOfficerSuiteNav() {
    if (!isOfficerPage()) return false;
    document.querySelector('.ev-mobile-nav')?.remove();
    document.querySelector('.ev-mobile-more-sheet')?.remove();
    document.body.classList.remove('ev-mobile-more-open');
    return true;
  }

  function normalizeGlobalNav() {
    if (isOfficerPage()) return;
    const nav = document.querySelector('.ev-shell__nav');
    if (!nav) return;
    const current = currentNavKey();
    const items = [
      ['pedepse', '⚖', 'Pedepse', './'],
      ['contopiri', '∑', 'Contopiri', 'contopiri/'],
      ['transfer', '⇄', 'Transfer', 'transfer/'],
      ['instructaj', '▤', 'Instructaj', 'instructaj/'],
      ['semnalmente', '◎', 'Semnalmente', 'semnalmente/']
    ];
    const signature = items.map(([key]) => key).join('|');
    if (nav.dataset.evOperationalSignature === signature && nav.children.length === items.length) return;
    nav.innerHTML = items.map(([key, icon, label, href]) =>
      `<a href="${new URL(href, rootUrl).href}"${current === key ? ' aria-current="page"' : ''} aria-label="${label}"><span class="ev-nav-icon" aria-hidden="true">${icon}</span><span class="ev-nav-label">${label}</span></a>`
    ).join('');
    nav.dataset.evOperationalSignature = signature;
  }

  function initMobileNav() {
    if (isOfficerPage() || document.querySelector('.ev-mobile-nav')) return;
    const current = currentNavKey();
    const items = [
      ['pedepse', '⚖', 'Pedepse', './'],
      ['contopiri', '∑', 'Contopiri', 'contopiri/'],
      ['transfer', '⇄', 'Transfer', 'transfer/'],
      ['instructaj', '▤', 'Instructaj', 'instructaj/'],
      ['semnalmente', '◎', 'Semnalmente', 'semnalmente/']
    ];
    const nav = document.createElement('nav');
    nav.className = 'ev-mobile-nav';
    nav.setAttribute('aria-label', 'Navigare principală');
    nav.innerHTML = items.map(([key, icon, label, href]) => `
      <a href="${new URL(href, rootUrl).href}"${current === key ? ' aria-current="page"' : ''} aria-label="${label}">
        <span aria-hidden="true">${icon}</span><small>${label}</small>
      </a>`).join('');

    if (document.body) document.body.append(nav);
    else document.documentElement.appendChild(nav);
    window.dispatchEvent(new CustomEvent('evidenta:mobile-nav-ready'));
  }

  function refresh() {
    normalizeTouchInputs();
    if (removeOfficerSuiteNav()) return;
    normalizeGlobalNav();
    initMobileNav();
  }

  function init() {
    refresh();
    document.addEventListener('click', event => {
      if (event.target.closest?.('#addDeductionBtn, .btn, button')) requestAnimationFrame(normalizeTouchInputs);
    });
    window.addEventListener('evidenta:shellready', refresh);
    window.addEventListener('load', refresh, { once:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
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

  function init() {
    if (document.querySelector('.ev-mobile-nav')) return;
    const current = currentNavKey();
    const direct = [
      ['pedepse', '⌁', 'Pedepse', './'],
      ['ai', '▣', 'AI', 'ai/'],
      ['contopiri', '∑', 'Contopiri', 'contopiri/'],
      ['transfer', '⇄', 'Transfer', 'transfer/']
    ];
    const nav = document.createElement('nav');
    nav.className = 'ev-mobile-nav';
    nav.setAttribute('aria-label', 'Navigare rapidă Evidență PPL');
    nav.innerHTML = direct.map(([key, icon, label, href]) => `
      <a href="${new URL(href, rootUrl).href}"${current === key ? ' aria-current="page"' : ''}>
        <span aria-hidden="true">${icon}</span><small>${label}</small>
      </a>`).join('') + `
      <button type="button" data-ev-more${['instructaj','semnalmente'].includes(current) ? ' class="is-active"' : ''} aria-expanded="false">
        <span aria-hidden="true">•••</span><small>Mai multe</small>
      </button>`;

    const sheet = document.createElement('div');
    sheet.className = 'ev-mobile-more-sheet';
    sheet.setAttribute('aria-label', 'Mai multe module');
    sheet.innerHTML = `
      <div class="ev-mobile-more-sheet__head"><strong>Mai multe module</strong><button type="button" data-ev-more-close aria-label="Închide">×</button></div>
      <a href="${new URL('instructaj/', rootUrl).href}"${current === 'instructaj' ? ' aria-current="page"' : ''}>Instructaj</a>
      <a href="${new URL('semnalmente/', rootUrl).href}"${current === 'semnalmente' ? ' aria-current="page"' : ''}>Semnalmente</a>`;

    const more = nav.querySelector('[data-ev-more]');
    const close = () => {
      document.body.classList.remove('ev-mobile-more-open');
      more?.setAttribute('aria-expanded', 'false');
    };
    more?.addEventListener('click', () => {
      const open = !document.body.classList.contains('ev-mobile-more-open');
      document.body.classList.toggle('ev-mobile-more-open', open);
      more.setAttribute('aria-expanded', String(open));
    });
    sheet.querySelector('[data-ev-more-close]')?.addEventListener('click', close);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    document.body.append(sheet, nav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

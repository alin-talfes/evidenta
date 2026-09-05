(() => {
  'use strict';

  if (window.__EVIDENTA_UX_UPGRADES__) return;
  window.__EVIDENTA_UX_UPGRADES__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/ux-upgrades.js', document.baseURI);
  const stylesheetUrl = new URL('../css/ux-upgrades.css?v=1', scriptUrl).href;

  function loadStylesheet() {
    if ([...document.styleSheets].some(sheet => sheet.href === stylesheetUrl) || document.querySelector('link[data-evidenta-ux]')) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheetUrl;
      link.dataset.evidentaUx = 'true';
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function pageName() {
    return document.body?.dataset.evPage || '';
  }

  function initDateInputs() {
    document.querySelectorAll('input.date-masked').forEach(input => {
      if (!input.hasAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.hasAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
      input.setAttribute('enterkeyhint', 'next');
    });
  }

  function initMobileSuiteMenu() {
    if (pageName().startsWith('ofiter')) return;
    const shell = document.querySelector('.ev-shell');
    const nav = shell?.querySelector('.ev-shell__nav');
    const actions = shell?.querySelector('.ev-shell__actions');
    if (!shell || !nav || !actions || shell.querySelector('#ev-suite-menu-toggle')) return;

    if (!nav.id) nav.id = 'ev-suite-nav';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'ev-suite-menu-toggle';
    button.className = 'ev-shell__menu';
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Deschide meniul modulelor');
    button.innerHTML = '<span aria-hidden="true">☰</span><span>Meniu</span>';
    actions.prepend(button);

    const close = () => {
      document.body.classList.remove('ev-suite-menu-open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Deschide meniul modulelor');
    };

    button.addEventListener('click', () => {
      const open = !document.body.classList.contains('ev-suite-menu-open');
      document.body.classList.toggle('ev-suite-menu-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Închide meniul modulelor' : 'Deschide meniul modulelor');
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
    window.matchMedia('(min-width: 641px)').addEventListener?.('change', event => {
      if (event.matches) close();
    });
  }

  function cardHasMeaningfulValue(card) {
    if (!card) return false;
    return [...card.querySelectorAll('input, select, textarea')].some(control => {
      if (control.type === 'checkbox' || control.type === 'radio') return control.checked;
      if (control.type === 'number') return Number(control.value || 0) !== 0;
      if (control.tagName === 'SELECT') return Boolean(control.value && !['escape', '0'].includes(control.value));
      return Boolean(String(control.value || '').trim());
    });
  }

  function initPedepseDisclosure() {
    if (pageName() !== 'pedepse' || document.querySelector('.ev-optional-tools')) return;

    const items = [
      ['recurs-heading', 'Recurs compensatoriu'],
      ['nonExec-heading', 'Perioade adăugate'],
      ['rest-heading', 'Rest rămas'],
      ['masuri-preventive-heading', 'Măsuri preventive']
    ].map(([headingId, label]) => {
      const heading = document.getElementById(headingId);
      const card = heading?.closest('.card');
      return card ? { headingId, label, card } : null;
    }).filter(Boolean);

    if (!items.length) return;

    const section = document.createElement('section');
    section.className = 'ev-optional-tools card';
    section.setAttribute('aria-labelledby', 'ev-optional-tools-title');
    section.innerHTML = `
      <div class="ev-optional-tools__head">
        <div>
          <h3 id="ev-optional-tools-title">Situații suplimentare</h3>
          <p>Deschide numai elementele aplicabile speței curente.</p>
        </div>
      </div>
      <div class="ev-optional-tools__buttons"></div>`;

    const buttons = section.querySelector('.ev-optional-tools__buttons');
    items[0].card.insertAdjacentElement('beforebegin', section);

    items.forEach(({ headingId, label, card }) => {
      const expandedInitially = cardHasMeaningfulValue(card);
      card.classList.add('ev-optional-card');
      card.hidden = !expandedInitially;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `ev-optional-toggle${expandedInitially ? ' is-active' : ''}`;
      button.setAttribute('aria-controls', card.id || `ev-card-${headingId}`);
      button.setAttribute('aria-expanded', String(expandedInitially));
      if (!card.id) card.id = `ev-card-${headingId}`;

      const renderLabel = open => {
        button.innerHTML = `<span aria-hidden="true">${open ? '−' : '+'}</span><span>${label}</span>`;
      };
      renderLabel(expandedInitially);

      button.addEventListener('click', () => {
        const open = card.hidden;
        card.hidden = !open;
        button.classList.toggle('is-active', open);
        button.setAttribute('aria-expanded', String(open));
        renderLabel(open);
        if (open) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      buttons.appendChild(button);
    });
  }

  function transferCriteriaText() {
    const judet = document.getElementById('judet')?.value;
    const sex = document.querySelector('input[name="sex"]:checked')?.closest('label')?.textContent?.trim();
    const varsta = document.querySelector('input[name="varsta"]:checked')?.closest('label')?.textContent?.trim();
    const regim = document.querySelector('input[name="regim"]:checked')?.closest('label')?.textContent?.trim();
    const mode = document.querySelector('#toggleGroup .toggle-btn.active')?.textContent?.trim();
    return [mode, judet && `județ ${judet}`, sex, varsta, regim].filter(Boolean).join(' · ');
  }

  function normalizeTransferResults() {
    if (pageName() !== 'transfer') return;
    const resultArea = document.getElementById('resultArea');
    if (!resultArea) return;

    const title = resultArea.querySelector('.result-title');
    if (title?.textContent?.trim() === 'Unități recomandate') title.textContent = 'Unități compatibile';

    const criteria = transferCriteriaText();
    resultArea.querySelectorAll('.match-item').forEach((item, index) => {
      const tag = item.querySelector('.tag');
      const reason = item.querySelector('.reason');
      if (index === 0) {
        if (tag) tag.textContent = 'Prima potrivire tehnică';
        if (reason) reason.textContent = 'Prima potrivire după criteriile tehnice';
      } else if (reason?.textContent?.includes('Alternativă')) {
        reason.textContent = 'Potrivire compatibilă';
      }

      if (item.querySelector('.ev-match-why')) return;
      const details = document.createElement('details');
      details.className = 'ev-match-why';
      details.innerHTML = `
        <summary>De ce apare?</summary>
        <p>${criteria ? `Corespunde criteriilor selectate: ${criteria}. ` : ''}Ordinea afișării este tehnică și nu creează o prioritate juridică autonomă. Verifică anexa aplicabilă situației concrete.</p>`;
      item.appendChild(details);
    });
  }

  function initTransferExplainability() {
    if (pageName() !== 'transfer') return;
    const resultArea = document.getElementById('resultArea');
    if (!resultArea || resultArea.dataset.evObserved === 'true') return;
    resultArea.dataset.evObserved = 'true';
    normalizeTransferResults();
    new MutationObserver(normalizeTransferResults).observe(resultArea, { childList: true, subtree: true });
  }

  function initTransferRulesTabs() {
    if (!pageName().startsWith('transfer/rules') || document.querySelector('.ev-anexa-tabs')) return;
    const cards = Array.from({ length: 8 }, (_, index) => document.getElementById(`anexa${index + 1}Card`)).filter(Boolean);
    if (!cards.length) return;

    const toolbar = document.createElement('nav');
    toolbar.className = 'ev-anexa-tabs';
    toolbar.setAttribute('aria-label', 'Navigare între anexele deciziei de transfer');
    toolbar.innerHTML = cards.map((card, index) => `
      <button type="button" data-anexa="${index + 1}" aria-controls="${card.id}">Anexa ${index + 1}</button>`).join('');
    cards[0].insertAdjacentElement('beforebegin', toolbar);

    let active = (() => {
      const match = location.hash.match(/^#anexa([1-8])Card$/i);
      return match ? Number(match[1]) : 1;
    })();
    let searching = false;

    const render = ({ scroll = false } = {}) => {
      cards.forEach((card, index) => {
        card.hidden = !searching && index + 1 !== active;
      });
      toolbar.querySelectorAll('[data-anexa]').forEach(button => {
        const selected = Number(button.dataset.anexa) === active;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-current', selected ? 'page' : 'false');
      });
      if (scroll && !searching) cards[active - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    toolbar.addEventListener('click', event => {
      const button = event.target.closest('[data-anexa]');
      if (!button) return;
      active = Number(button.dataset.anexa);
      searching = false;
      const input = document.getElementById('filterInput');
      if (input?.value) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      history.replaceState(null, '', `${location.pathname}${location.search}#anexa${active}Card`);
      render({ scroll: true });
    });

    const input = document.getElementById('filterInput');
    input?.addEventListener('input', () => {
      searching = Boolean(input.value.trim());
      render();
    });
    document.getElementById('filterClear')?.addEventListener('click', () => {
      setTimeout(() => {
        searching = Boolean(input?.value.trim());
        render();
      }, 0);
    });
    window.addEventListener('hashchange', () => {
      const match = location.hash.match(/^#anexa([1-8])Card$/i);
      if (!match) return;
      active = Number(match[1]);
      searching = false;
      render();
    });

    render();
  }

  function initSemnalmenteUx() {
    if (!pageName().startsWith('semnalmente')) return;
    const legend = document.querySelector('.quality-legend span:first-child');
    if (legend && !legend.textContent.includes('HEIC')) legend.textContent = 'JPG / PNG / WEBP / HEIC / HEIF';

    if (pageName() !== 'semnalmente' && pageName() !== 'semnalmente/index.html') return;
    const results = document.getElementById('results-section');
    const grid = document.getElementById('results-grid');
    if (!results || !grid || results.querySelector('.ev-verification-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'ev-verification-banner';
    banner.innerHTML = '<strong>Pasul 3 · Verificare umană</strong><span>Controlează și, unde este posibil, corectează valorile generate înainte de salvare sau export.</span>';
    grid.insertAdjacentElement('beforebegin', banner);
  }

  function officerGo(view) {
    const target = document.querySelector(`.sidebar .nav-item[data-view="${CSS.escape(view)}"]`);
    target?.click();
  }

  function initOfficerMobileNav() {
    if (!pageName().startsWith('ofiter') || document.querySelector('.ev-officer-mobile-nav')) return;

    const directItems = [
      ['dashboard', '⌂', 'Acasă'],
      ['quiz', '✓', 'Grile'],
      ['mistakes', '↻', 'Repetare'],
      ['exam', '◷', 'Simulare']
    ];
    const moreItems = [
      ['synthesis', 'Sinteză'],
      ['calculations', 'Calcule'],
      ['legislation', 'Legislație'],
      ['official', 'Subiecte ANP'],
      ['interview', 'Interviu']
    ];

    const nav = document.createElement('nav');
    nav.className = 'ev-officer-mobile-nav';
    nav.setAttribute('aria-label', 'Navigare rapidă Ofițer');
    nav.innerHTML = directItems.map(([view, icon, label]) => `
      <button type="button" data-officer-view="${view}"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`).join('') +
      '<button type="button" data-officer-more aria-expanded="false"><span aria-hidden="true">•••</span><small>Mai multe</small></button>';

    const sheet = document.createElement('div');
    sheet.className = 'ev-officer-more-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'false');
    sheet.setAttribute('aria-label', 'Mai multe module Ofițer');
    sheet.innerHTML = `<div class="ev-officer-more-sheet__head"><strong>Mai multe module</strong><button type="button" data-officer-close aria-label="Închide">×</button></div>
      <div class="ev-officer-more-sheet__grid">${moreItems.map(([view, label]) => `<button type="button" data-officer-view="${view}">${label}</button>`).join('')}</div>`;

    document.body.append(sheet, nav);
    const moreButton = nav.querySelector('[data-officer-more]');

    const closeMore = () => {
      document.body.classList.remove('ev-officer-more-open');
      moreButton.setAttribute('aria-expanded', 'false');
    };
    const openMore = () => {
      document.body.classList.add('ev-officer-more-open');
      moreButton.setAttribute('aria-expanded', 'true');
    };

    nav.addEventListener('click', event => {
      const viewButton = event.target.closest('[data-officer-view]');
      if (viewButton) {
        closeMore();
        officerGo(viewButton.dataset.officerView);
        return;
      }
      if (event.target.closest('[data-officer-more]')) {
        document.body.classList.contains('ev-officer-more-open') ? closeMore() : openMore();
      }
    });
    sheet.addEventListener('click', event => {
      const viewButton = event.target.closest('[data-officer-view]');
      if (viewButton) {
        closeMore();
        officerGo(viewButton.dataset.officerView);
        return;
      }
      if (event.target.closest('[data-officer-close]')) closeMore();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMore();
    });

    const syncActive = () => {
      const current = decodeURIComponent(location.hash.replace(/^#/, '')) || 'dashboard';
      nav.querySelectorAll('[data-officer-view]').forEach(button => {
        const active = button.dataset.officerView === current;
        button.classList.toggle('is-active', active);
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      const moreActive = moreItems.some(([view]) => view === current);
      moreButton.classList.toggle('is-active', moreActive);
    };
    window.addEventListener('hashchange', syncActive);
    document.addEventListener('training:app-ready', syncActive);
    syncActive();
  }

  function initAll() {
    if (!document.body) return;
    initDateInputs();
    initMobileSuiteMenu();
    initPedepseDisclosure();
    initTransferExplainability();
    initTransferRulesTabs();
    initSemnalmenteUx();
    initOfficerMobileNav();
  }

  function start() {
    loadStylesheet().finally(initAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
  window.addEventListener('evidenta:shellready', initAll);
})();

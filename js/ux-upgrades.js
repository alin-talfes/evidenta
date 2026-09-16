(() => {
  'use strict';

  if (window.__EVIDENTA_UX_UPGRADES__) return;
  window.__EVIDENTA_UX_UPGRADES__ = true;

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

  function transferCriteriaText() {
    const judet = document.getElementById('judet')?.value;
    const sex = document.querySelector('input[name="sex"]:checked')?.closest('label')?.textContent?.trim();
    const varsta = document.querySelector('input[name="varsta"]:checked')?.closest('label')?.textContent?.trim();
    const regim = document.querySelector('input[name="regim"]:checked')?.closest('label')?.textContent?.trim();
    const mode = document.querySelector('#toggleGroup .toggle-btn.active')?.textContent?.trim();
    return [mode, judet && `județ ${judet}`, sex, varsta, regim].filter(Boolean).join(' · ');
  }

  function setTextIfChanged(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function normalizeTransferResults() {
    if (pageName() !== 'transfer') return;
    const resultArea = document.getElementById('resultArea');
    if (!resultArea) return;

    const title = resultArea.querySelector('.result-title');
    if (title?.textContent?.trim() === 'Unități recomandate') {
      setTextIfChanged(title, 'Unități compatibile');
    }

    const criteria = transferCriteriaText();
    resultArea.querySelectorAll('.match-item').forEach((item, index) => {
      const tag = item.querySelector('.tag');
      const reason = item.querySelector('.reason');
      if (index === 0) {
        setTextIfChanged(tag, 'Prima potrivire tehnică');
        setTextIfChanged(reason, 'Prima potrivire după criteriile tehnice');
      } else if (reason?.textContent?.includes('Alternativă')) {
        setTextIfChanged(reason, 'Potrivire compatibilă');
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

    const observerOptions = { childList: true, subtree: true };
    let observer;
    const observe = () => observer.observe(resultArea, observerOptions);

    observer = new MutationObserver(() => {
      observer.disconnect();
      try {
        normalizeTransferResults();
      } finally {
        observe();
      }
    });

    normalizeTransferResults();
    observe();
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
    initTransferExplainability();
    initTransferRulesTabs();
    initSemnalmenteUx();
    initOfficerMobileNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }
  window.addEventListener('evidenta:shellready', initAll);
})();

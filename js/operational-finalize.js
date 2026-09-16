(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_FINALIZE__) return;
  window.__EVIDENTA_OPERATIONAL_FINALIZE__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-finalize.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const PREFILL_PEDEPSE = 'evidenta:prefill:pedepse';

  function pageKey() {
    const rootPath = rootUrl.pathname.endsWith('/') ? rootUrl.pathname : `${rootUrl.pathname}/`;
    const relative = location.pathname.startsWith(rootPath)
      ? location.pathname.slice(rootPath.length).replace(/^\/+|\/+$/g, '')
      : '';
    if (!relative || relative === 'index.html') return 'pedepse';
    if (relative.startsWith('ai')) return 'ai';
    if (relative.startsWith('contopiri')) return 'contopiri';
    if (relative.startsWith('transfer')) return 'transfer';
    if (relative.startsWith('instructaj')) return 'instructaj';
    if (relative.startsWith('semnalmente')) return 'semnalmente';
    return '';
  }

  function normalizeGlobalNav() {
    if (String(document.body?.dataset.evPage || '').startsWith('ofiter')) return;
    const nav = document.querySelector('.ev-shell__nav');
    if (!nav) return;
    const current = pageKey();
    const items = [
      ['pedepse', 'Pedepse', './'],
      ['ai', 'AI · BETA', 'ai/'],
      ['contopiri', 'Contopiri', 'contopiri/'],
      ['transfer', 'Transfer', 'transfer/'],
      ['instructaj', 'Instructaj', 'instructaj/'],
      ['semnalmente', 'Semnalmente', 'semnalmente/']
    ];
    const signature = items.map(([key]) => key).join('|');
    if (nav.dataset.evOperationalSignature === signature && nav.children.length === items.length) return;
    nav.innerHTML = items.map(([key, label, href]) =>
      `<a href="${new URL(href, rootUrl).href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`
    ).join('');
    nav.dataset.evOperationalSignature = signature;
  }

  function aiRowSource(row) {
    return row.querySelector('.ai-source')?.textContent?.toLocaleLowerCase('ro') || '';
  }

  function aiRowType(row) {
    const source = aiRowSource(row);
    if (source.includes('reținere 24') || source.includes('retinere 24')) return 'retention24h';
    if (source.includes('domiciliu')) return 'home_arrest';
    if (source.includes('preventiv')) return 'preventive';
    return 'generic';
  }

  function aiRowIsOpenEnded(row) {
    const source = aiRowSource(row);
    const start = row.querySelector('.d-start')?.value.trim() || '';
    const end = row.querySelector('.d-end')?.value.trim() || '';
    if (!start || aiRowType(row) === 'retention24h') return false;
    if (!end) return true;
    return /(?:la\s+zi|„la\s+zi”|până\s+la\s+zi|pana\s+la\s+zi)/i.test(source);
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function installAiToPedepseGuard() {
    if (!location.pathname.includes('/ai/')) return;
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-ai-to-pedepse]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const deductions = [];
      let openEndedOmitted = 0;
      document.querySelectorAll('#deductionRows tr').forEach(row => {
        const start = row.querySelector('.d-start')?.value.trim() || '';
        let end = row.querySelector('.d-end')?.value.trim() || '';
        if (!start && !end) return;
        const type = aiRowType(row);
        if (type === 'retention24h' && start && !end) end = start;
        if (aiRowIsOpenEnded(row)) {
          // „... de la X la zi” stabilește data începerii X. Intervalul nu se
          // transferă și ca deducere, altfel perioada X→mandat s-ar scădea de două ori.
          openEndedOmitted += 1;
          return;
        }
        if (!start || !end) {
          openEndedOmitted += 1;
          return;
        }
        deductions.push({ start, end, type });
      });

      safeSessionSet(PREFILL_PEDEPSE, {
        source: 'ai',
        duration: {
          years: Number(document.getElementById('finalYears')?.value || 0),
          months: Number(document.getElementById('finalMonths')?.value || 0),
          days: Number(document.getElementById('finalDays')?.value || 0)
        },
        startDate: document.getElementById('startDate')?.value.trim() || '',
        deductions,
        openEndedOmitted
      });
      location.href = rootUrl.href;
    }, true);
  }

  function annotateAiOpenEndedDeductions() {
    if (!location.pathname.includes('/ai/')) return;
    const primary = document.querySelector('.ev-ai-primary');
    if (!primary) return;
    const rows = [...document.querySelectorAll('#deductionRows tr')];
    const openRows = rows.filter(aiRowIsOpenEnded);
    let note = primary.querySelector('.ev-ai-open-ended-note');
    if (!openRows.length) {
      note?.remove();
      return;
    }
    if (!note) {
      note = document.createElement('p');
      note.className = 'ev-ai-open-ended-note';
      primary.querySelector('.ev-ai-primary__deductions')?.insertAdjacentElement('afterend', note);
    }
    const dates = [...new Set(openRows.map(row => row.querySelector('.d-start')?.value.trim()).filter(Boolean))];
    const text = `Deducerea „la zi”${dates.length ? ` (${dates.join(', ')})` : ''} stabilește data începerii. La transferul în Pedepse se trimit numai deducerile închise, pentru a evita dublarea scăderii.`;
    if (note.textContent !== text) note.textContent = text;
  }

  function syncQuickResultControls() {
    if (pageKey() !== 'pedepse') return;
    const quick = document.body.classList.contains('ev-quick-mode');
    const toggleSteps = document.getElementById('toggleStepsBtn');
    const timeline = document.getElementById('timelineContainer');
    if (toggleSteps) toggleSteps.hidden = quick;
    if (quick) {
      document.getElementById('stepsContainer')?.classList.add('hidden');
      timeline?.classList.add('hidden');
    } else if (window.lastCalculation && !window.lastCalculation.quick) {
      toggleSteps?.removeAttribute('hidden');
    }
  }

  function improvePrefillBanner() {
    if (pageKey() !== 'pedepse') return;
    const banner = document.querySelector('.ev-prefill-banner');
    if (!banner || banner.dataset.evFinalized === 'true') return;
    banner.dataset.evFinalized = 'true';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
  }

  function scheduleRefresh(kind = 'all') {
    window.requestAnimationFrame(() => {
      if (kind === 'all' || kind === 'nav') normalizeGlobalNav();
      if (kind === 'all' || kind === 'quick') {
        syncQuickResultControls();
        improvePrefillBanner();
      }
      if (kind === 'all' || kind === 'ai') annotateAiOpenEndedDeductions();
    });
  }

  function bindDeterministicRefreshes() {
    document.addEventListener('click', event => {
      if (event.target.closest?.('[data-mode], #calcBtn, #addDeductionBtn, .d-remove, [data-ai-to-pedepse]')) {
        scheduleRefresh(pageKey() === 'ai' ? 'ai' : 'quick');
      }
    });
    document.addEventListener('input', event => {
      if (event.target.closest?.('#deductionRows, #startDate')) scheduleRefresh('ai');
    });
    document.addEventListener('change', event => {
      if (event.target.closest?.('#deductionRows, #startDate')) scheduleRefresh('ai');
    });
    window.addEventListener('load', () => scheduleRefresh('all'), { once: true });
  }

  function init() {
    normalizeGlobalNav();
    installAiToPedepseGuard();
    annotateAiOpenEndedDeductions();
    syncQuickResultControls();
    improvePrefillBanner();
    bindDeterministicRefreshes();
    window.addEventListener('evidenta:shellready', () => scheduleRefresh('nav'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

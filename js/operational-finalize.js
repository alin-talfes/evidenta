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

  function aiRowType(row) {
    const source = row.querySelector('.ai-source')?.textContent?.toLocaleLowerCase('ro') || '';
    if (source.includes('reținere 24') || source.includes('retinere 24')) return 'retention24h';
    if (source.includes('domiciliu')) return 'home_arrest';
    if (source.includes('preventiv')) return 'preventive';
    return 'generic';
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
        if (!start || !end) {
          // O deducere deschisă „... la zi” stabilește data de început și nu se
          // mai transferă ca interval separat, pentru a evita dublarea scăderii.
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
    const hasOpen = rows.some(row => {
      const start = row.querySelector('.d-start')?.value.trim() || '';
      const end = row.querySelector('.d-end')?.value.trim() || '';
      return Boolean(start && !end && aiRowType(row) !== 'retention24h');
    });
    let note = primary.querySelector('.ev-ai-open-ended-note');
    if (!hasOpen) {
      note?.remove();
      return;
    }
    if (!note) {
      note = document.createElement('p');
      note.className = 'ev-ai-open-ended-note';
      primary.querySelector('.ev-ai-primary__deductions')?.insertAdjacentElement('afterend', note);
    }
    note.textContent = 'Deducerea „la zi” stabilește data începerii. La transferul în Pedepse se trimit numai intervalele închise, pentru a evita dublarea scăderii.';
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

  function monitor() {
    const observer = new MutationObserver(records => {
      let shouldNav = false;
      let shouldQuick = false;
      let shouldAi = false;
      for (const record of records) {
        if (record.type === 'attributes' && record.target === document.body) shouldQuick = true;
        for (const node of record.addedNodes || []) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.('.ev-shell, .ev-shell__nav') || node.querySelector?.('.ev-shell__nav')) shouldNav = true;
          if (node.matches?.('.ev-quick-result, .ev-prefill-banner') || node.querySelector?.('.ev-quick-result, .ev-prefill-banner')) shouldQuick = true;
          if (node.matches?.('.ev-ai-primary, #deductionRows, tr') || node.querySelector?.('.ev-ai-primary, #deductionRows')) shouldAi = true;
        }
      }
      if (shouldNav) normalizeGlobalNav();
      if (shouldQuick) { syncQuickResultControls(); improvePrefillBanner(); }
      if (shouldAi) annotateAiOpenEndedDeductions();
    });
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  function init() {
    normalizeGlobalNav();
    installAiToPedepseGuard();
    annotateAiOpenEndedDeductions();
    syncQuickResultControls();
    improvePrefillBanner();
    monitor();
    window.addEventListener('evidenta:shellready', normalizeGlobalNav);
    document.addEventListener('input', annotateAiOpenEndedDeductions);
    document.addEventListener('change', annotateAiOpenEndedDeductions);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

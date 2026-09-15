(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_UPGRADES__) return;
  window.__EVIDENTA_OPERATIONAL_UPGRADES__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-upgrades.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const PREFILL_PEDEPSE = 'evidenta:prefill:pedepse';
  const PREFILL_CONTOPIRI = 'evidenta:prefill:contopiri';

  function ensureStyles() {
    if (document.querySelector('link[data-evidenta-operational-upgrades]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/operational-upgrades.css?v=1', scriptUrl).href;
    link.dataset.evidentaOperationalUpgrades = 'true';
    document.head.appendChild(link);
  }

  function page() {
    const fromDataset = document.body?.dataset.evPage || '';
    if (fromDataset) return fromDataset;
    const rootPath = rootUrl.pathname.endsWith('/') ? rootUrl.pathname : `${rootUrl.pathname}/`;
    return location.pathname.startsWith(rootPath)
      ? location.pathname.slice(rootPath.length).replace(/^\/+|\/+$/g, '')
      : '';
  }

  function parseDateSafe(value) {
    if (typeof window.parseDate === 'function') return window.parseDate(String(value || '').trim());
    const m = String(value || '').trim().match(/^([0-3]?\d)\.([01]?\d)\.((?:19|20)\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return d.getFullYear() === Number(m[3]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[1]) ? d : null;
  }

  function fmtDateSafe(date) {
    if (typeof window.fmtDate === 'function') return window.fmtDate(date);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  }

  function daysBetweenSafe(a, b) {
    return typeof window.daysBetween === 'function'
      ? window.daysBetween(a, b)
      : Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function addCalendarSafeLocal(date, years, months, days) {
    if (typeof window.addCalendarSafe === 'function') return window.addCalendarSafe(date, years, months, days);
    const result = new Date(date);
    const originalDay = result.getDate();
    result.setDate(1);
    result.setFullYear(result.getFullYear() + years);
    result.setMonth(result.getMonth() + months);
    const maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, maxDay));
    result.setDate(result.getDate() + days);
    return result;
  }

  function setSessionJson(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function getSessionJson(key, remove = false) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (remove) sessionStorage.removeItem(key);
      return value;
    } catch (_) {
      if (remove) sessionStorage.removeItem(key);
      return null;
    }
  }

  function go(path = '') {
    location.href = new URL(path, rootUrl).href;
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

  function initGlobalMobileNavigation() {
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

  function replaceOverlapCopy() {
    const replace = node => {
      if (!node?.textContent) return;
      const old = 'Zilele comune vor fi numărate o singură dată.';
      if (node.textContent.includes(old)) node.textContent = node.textContent.replace(old, 'Intervalele sunt calculate integral; verifică dacă suprapunerea este intenționată.');
    };
    document.querySelectorAll('.ev-field-message, #ev-validation-summary li').forEach(replace);
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        replace(node);
        node.querySelectorAll?.('.ev-field-message, #ev-validation-summary li').forEach(replace);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function overrideDeductionSummation() {
    window.sumIntervals = intervals => (intervals || []).reduce((sum, interval) => {
      const [start, end] = interval || [];
      if (!(start instanceof Date) || !(end instanceof Date) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return sum;
      return sum + daysBetweenSafe(start, end) + 1;
    }, 0);
  }

  function overlapPairs(intervals) {
    const pairs = [];
    for (let i = 0; i < intervals.length; i += 1) {
      for (let j = i + 1; j < intervals.length; j += 1) {
        if (intervals[i].start <= intervals[j].end && intervals[j].start <= intervals[i].end) pairs.push([i + 1, j + 1]);
      }
    }
    return pairs;
  }

  function quickDeductionData() {
    const rows = [...document.querySelectorAll('.deduction-row')];
    const intervals = [];
    let total = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const type = row.querySelector('.ded-type')?.value || 'generic';
      const startRaw = row.querySelector('.ded-start')?.value.trim() || '';
      const endRaw = row.querySelector('.ded-end')?.value.trim() || '';
      if (!startRaw && !endRaw) continue;
      const start = parseDateSafe(startRaw);
      const end = type === 'retention24h' ? start : parseDateSafe(endRaw);
      if (!start || !end) throw new Error(`Deducerea ${index + 1}: completează corect data${type === 'retention24h' ? '' : ' de început și de sfârșit'}.`);
      if (end < start) throw new Error(`Deducerea ${index + 1}: sfârșitul este înaintea începutului.`);
      const days = type === 'retention24h' ? 1 : daysBetweenSafe(start, end) + 1;
      total += days;
      intervals.push({ start, end, type, days, startRaw, endRaw: type === 'retention24h' ? startRaw : endRaw });
    }
    document.querySelectorAll('.manual-days').forEach(input => {
      const value = Number(input.value || 0);
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('Zilele de recurs compensatoriu trebuie să fie numere întregi pozitive sau zero.');
      total += value;
    });
    return { total, intervals, overlaps: overlapPairs(intervals) };
  }

  function quickNonExecutedDays() {
    const rows = [...document.querySelectorAll('.non-exec-row')];
    if (!rows.length) return 0;
    const data = [];
    rows.forEach((row, index) => {
      const startRaw = row.querySelector('.ne-start')?.value.trim() || '';
      const endRaw = row.querySelector('.ne-end')?.value.trim() || '';
      if (!startRaw && !endRaw) return;
      const start = parseDateSafe(startRaw), end = parseDateSafe(endRaw);
      if (!start || !end || end <= start) throw new Error(`Perioada neexecutată ${index + 1}: interval invalid.`);
      data.push({ type: row.querySelector('.ne-type')?.value || 'escape', start, end });
    });
    if (typeof window.sumNonExecutedPeriods === 'function') return window.sumNonExecutedPeriods(data);
    return data.reduce((sum, item) => sum + daysBetweenSafe(item.start, item.end) + 1, 0);
  }

  function renderQuickError(message) {
    const box = document.getElementById('errorContainer');
    if (!box) return;
    box.textContent = `• ${message}`;
    box.classList.add('visible');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function quickCalculate() {
    const error = document.getElementById('errorContainer');
    error?.classList.remove('visible');
    const start = parseDateSafe(document.getElementById('startDate')?.value);
    const y = Number(document.getElementById('durYears')?.value || 0);
    const m = Number(document.getElementById('durMonths')?.value || 0);
    const d = Number(document.getElementById('durDays')?.value || 0);
    try {
      if (!start) throw new Error('Completează data începerii executării în format zz.ll.aaaa.');
      if (![y, m, d].every(value => Number.isSafeInteger(value) && value >= 0) || y + m + d === 0) throw new Error('Introdu o pedeapsă validă, mai mare de zero.');
      const theoretical = addCalendarSafeLocal(start, y, m, d);
      theoretical.setDate(theoretical.getDate() - 1);
      const totalDays = daysBetweenSafe(start, theoretical) + 1;
      const deductions = quickDeductionData();
      const nonExecuted = quickNonExecutedDays();
      if (deductions.total > totalDays) throw new Error('Deducerile depășesc durata totală a mandatului.');
      const real = new Date(theoretical);
      real.setDate(real.getDate() - deductions.total + nonExecuted);

      window.lastCalculation = {
        quick: true,
        life: false,
        duration: { y, m, d },
        startDate: new Date(start),
        theorExp: new Date(theoretical),
        realExp: new Date(real),
        totalDays,
        ded: deductions.total,
        non: nonExecuted,
        dedRowsData: deductions.intervals.map(item => ({ type:item.type, start:item.startRaw, end:item.endRaw, days:item.days }))
      };

      const content = document.getElementById('resultsContent');
      const card = document.getElementById('resultsCard');
      const alerts = document.getElementById('alertsContainer');
      if (content) content.innerHTML = `
        <section class="ev-quick-result">
          <span>EXPIRARE REALĂ</span>
          <strong>${fmtDateSafe(real)}</strong>
          <div class="ev-quick-result__grid">
            <div><small>Expirare teoretică</small><b>${fmtDateSafe(theoretical)}</b></div>
            <div><small>Deduceri</small><b>${deductions.total} zile</b></div>
            ${nonExecuted ? `<div><small>Perioade neexecutate</small><b>${nonExecuted} zile</b></div>` : ''}
          </div>
          <p>${y} ani · ${m} luni · ${d} zile, început ${fmtDateSafe(start)}.</p>
        </section>`;
      card?.classList.remove('hidden');
      if (alerts) {
        if (deductions.overlaps.length) {
          alerts.innerHTML = deductions.overlaps.map(([a,b]) => `<div class="alert warning"><strong>Suprapunere deduceri ${a} și ${b}.</strong> Ambele intervale au fost calculate integral. Verifică dacă suprapunerea este intenționată.</div>`).join('');
          alerts.classList.remove('hidden');
        } else {
          alerts.innerHTML = '';
          alerts.classList.add('hidden');
        }
      }
      card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      renderQuickError(err?.message || 'Datele nu pot fi calculate.');
    }
  }

  function fillPedepseFromPrefill() {
    const data = getSessionJson(PREFILL_PEDEPSE, true);
    if (!data) return false;
    const duration = data.duration || {};
    const set = (id, value) => { const input = document.getElementById(id); if (input && value !== undefined && value !== null) input.value = String(value); };
    set('durYears', duration.years ?? duration.y ?? 0);
    set('durMonths', duration.months ?? duration.m ?? 0);
    set('durDays', duration.days ?? duration.d ?? 0);
    if (data.startDate) set('startDate', data.startDate);
    const container = document.getElementById('deductionsContainer');
    if (container && Array.isArray(data.deductions)) {
      container.innerHTML = '';
      data.deductions.forEach(item => {
        const typeMap = { retention24h:'retention24h', preventive:'preventive', home_arrest:'houseArrest', houseArrest:'houseArrest', generic:'generic' };
        if (typeof window.addDedRow === 'function') window.addDedRow({ type:typeMap[item.type] || 'generic', start:item.start || '', end:item.end || '' });
      });
    }
    const banner = document.createElement('div');
    banner.className = 'ev-prefill-banner';
    banner.textContent = `Date preluate din ${data.source === 'contopiri' ? 'Contopiri' : 'AI Documente'}. Verifică-le înainte de calcul.`;
    document.querySelector('#main-content')?.prepend(banner);
    return true;
  }

  function initPedepseQuickMode() {
    if (!document.getElementById('calcBtn') || document.querySelector('.ev-calc-mode')) return;
    overrideDeductionSummation();
    replaceOverlapCopy();

    const main = document.getElementById('main-content');
    const mode = document.createElement('div');
    mode.className = 'ev-calc-mode';
    mode.innerHTML = '<button type="button" data-mode="quick" class="is-active">Calcul rapid</button><button type="button" data-mode="full">Calcul complet · LC</button>';
    main?.prepend(mode);

    const generalCard = document.getElementById('date-ppl-heading')?.closest('.card');
    const sentenceCard = document.getElementById('sentence-heading')?.closest('.card');
    const sentenceGrids = sentenceCard ? [...sentenceCard.querySelectorAll(':scope > .form-grid')] : [];
    const lcGrid = sentenceGrids[0] || null;
    const datesGrid = sentenceGrids.find(grid => grid.querySelector('#startDate')) || null;
    const receivedWrap = document.getElementById('prisonReceivedDate')?.closest('div');
    const calcBtn = document.getElementById('calcBtn');
    let current = 'quick';

    const setMode = value => {
      current = value === 'full' ? 'full' : 'quick';
      document.body.classList.toggle('ev-quick-mode', current === 'quick');
      mode.querySelectorAll('button').forEach(button => button.classList.toggle('is-active', button.dataset.mode === current));
      if (generalCard) generalCard.hidden = current === 'quick';
      if (lcGrid) lcGrid.hidden = current === 'quick';
      if (receivedWrap) receivedWrap.hidden = current === 'quick';
      if (calcBtn) calcBtn.textContent = current === 'quick' ? 'CALCULEAZĂ EXPIRAREA' : 'CALCULEAZĂ';
      const heading = document.getElementById('sentence-heading');
      if (heading) heading.textContent = current === 'quick' ? 'CALCUL RAPID PEDEAPSĂ' : 'DETALII PEDEAPSĂ PPL';
      datesGrid?.classList.toggle('ev-quick-dates', current === 'quick');
    };

    mode.addEventListener('click', event => {
      const button = event.target.closest('[data-mode]');
      if (button) setMode(button.dataset.mode);
    });
    calcBtn?.addEventListener('click', event => {
      if (current !== 'quick') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      quickCalculate();
    }, true);

    fillPedepseFromPrefill();
    setMode('quick');
  }

  function aiDeductions() {
    return [...document.querySelectorAll('#deductionRows tr')].map(row => ({
      start: row.querySelector('.d-start')?.value.trim() || '',
      end: row.querySelector('.d-end')?.value.trim() || '',
      type: (() => {
        const source = row.querySelector('.ai-source')?.textContent?.toLocaleLowerCase('ro') || '';
        if (source.includes('reținere 24') || source.includes('retinere 24')) return 'retention24h';
        if (source.includes('domiciliu')) return 'home_arrest';
        if (source.includes('preventiv')) return 'preventive';
        return 'generic';
      })()
    })).filter(item => item.start || item.end);
  }

  function syncAiPrimary() {
    const box = document.querySelector('.ev-ai-primary');
    if (!box) return;
    const y = Number(document.getElementById('finalYears')?.value || 0);
    const m = Number(document.getElementById('finalMonths')?.value || 0);
    const d = Number(document.getElementById('finalDays')?.value || 0);
    const start = document.getElementById('startDate')?.value.trim() || '—';
    const deductions = aiDeductions();
    const list = deductions.length ? deductions.map(item => {
      const a = parseDateSafe(item.start), b = parseDateSafe(item.end || item.start);
      const days = a && b && b >= a ? (item.type === 'retention24h' ? 1 : daysBetweenSafe(a,b)+1) : null;
      return `<li><strong>${item.start || '—'}${item.end && item.end !== item.start ? ` – ${item.end}` : ''}</strong>${days ? ` · ${days} zile` : ''}</li>`;
    }).join('') : '<li>Nu au fost identificate deduceri.</li>';
    box.querySelector('[data-ai-duration]').textContent = `${y} ani · ${m} luni · ${d} zile`;
    box.querySelector('[data-ai-start]').textContent = start;
    box.querySelector('[data-ai-deductions]').innerHTML = list;
  }

  function sendAiToPedepse() {
    setSessionJson(PREFILL_PEDEPSE, {
      source: 'ai',
      duration: {
        years: Number(document.getElementById('finalYears')?.value || 0),
        months: Number(document.getElementById('finalMonths')?.value || 0),
        days: Number(document.getElementById('finalDays')?.value || 0)
      },
      startDate: document.getElementById('startDate')?.value.trim() || '',
      deductions: aiDeductions()
    });
    go('./');
  }

  function sendAiToContopiri() {
    const components = [...document.querySelectorAll('#penaltyRows tr')].map(row => ({
      years: Number(row.querySelector('.p-y')?.value || 0),
      months: Number(row.querySelector('.p-m')?.value || 0),
      days: Number(row.querySelector('.p-d')?.value || 0),
      group: row.querySelector('.p-group')?.value || 'ignore'
    })).filter(item => item.group !== 'ignore' && (item.years || item.months || item.days));
    if (!components.length) return;
    setSessionJson(PREFILL_CONTOPIRI, { source:'ai', components });
    go('contopiri/');
  }

  function initAiPrimary() {
    const review = document.getElementById('reviewCard');
    if (!review || review.querySelector('.ev-ai-primary')) return;
    const heading = document.getElementById('review-title');
    const box = document.createElement('section');
    box.className = 'ev-ai-primary';
    box.innerHTML = `
      <span class="ev-ai-primary__eyebrow">DATE PENTRU EVIDENȚĂ</span>
      <div class="ev-ai-primary__grid">
        <div><small>Pedeapsă</small><strong data-ai-duration>—</strong></div>
        <div><small>Data începerii</small><strong data-ai-start>—</strong></div>
      </div>
      <div class="ev-ai-primary__deductions"><small>Deduceri</small><ul data-ai-deductions></ul></div>
      <div class="ev-ai-primary__actions">
        <button type="button" class="btn btn-primary" data-ai-to-pedepse>DESCHIDE ÎN PEDEPSE</button>
        <button type="button" class="btn btn-outline" data-ai-to-contopiri>DESCHIDE ÎN CONTOPIRI</button>
      </div>`;
    heading?.insertAdjacentElement('afterend', box);
    box.querySelector('[data-ai-to-pedepse]')?.addEventListener('click', sendAiToPedepse);
    box.querySelector('[data-ai-to-contopiri]')?.addEventListener('click', sendAiToContopiri);

    const grid = review.querySelector('.ai-review-grid');
    if (grid && !review.querySelector('.ev-ai-secondary')) {
      const secondary = document.createElement('details');
      secondary.className = 'ev-ai-secondary';
      secondary.innerHTML = '<summary>Detalii suplimentare / liberare condiționată</summary><div class="ev-ai-secondary__grid"></div>';
      const target = secondary.querySelector('.ev-ai-secondary__grid');
      ['sex','birthDate','receivedDate','article','lifeSentence'].forEach(id => {
        const control = document.getElementById(id);
        const wrapper = control?.closest('.wide') || control?.closest('.ai-review-grid > div');
        if (wrapper && wrapper.parentElement === grid) target.appendChild(wrapper);
      });
      grid.insertAdjacentElement('afterend', secondary);
    }

    const penaltySection = document.getElementById('penaltyRows')?.closest('.ai-section-gap');
    if (penaltySection && !penaltySection.closest('.ev-ai-components')) {
      const details = document.createElement('details');
      details.className = 'ev-ai-components';
      const summary = document.createElement('summary');
      summary.textContent = 'Pedepse componente / contopire';
      penaltySection.insertAdjacentElement('beforebegin', details);
      details.append(summary, penaltySection);
    }

    review.addEventListener('input', syncAiPrimary);
    review.addEventListener('change', syncAiPrimary);
    const deductionRows = document.getElementById('deductionRows');
    if (deductionRows) new MutationObserver(syncAiPrimary).observe(deductionRows, { childList:true, subtree:true });
    syncAiPrimary();
  }

  function contopiriGroups() {
    const groups = { concurs:[], recidiva:[], revocare:[], litb:[] };
    document.querySelectorAll('.penalty-row').forEach(row => {
      const years = Number(row.querySelector('.penalty-years')?.value || 0);
      const months = Number(row.querySelector('.penalty-months')?.value || 0);
      const days = Number(row.querySelector('.penalty-days')?.value || 0);
      const type = row.querySelector('.penalty-type')?.value || 'concurs';
      if (!groups[type] || ![years,months,days].every(Number.isSafeInteger) || years < 0 || months < 0 || days < 0 || !(years || months || days)) return;
      groups[type].push({ years, months, days, totalDays: window.ContopiriCore.toDays(years,months,days) });
    });
    return groups;
  }

  function currentContopiriFinal() {
    try { return window.ContopiriCore?.calculate(contopiriGroups())?.finalDuration || null; }
    catch (_) { return null; }
  }

  function addContopiriTransferButton() {
    const result = document.getElementById('mergeResult');
    const final = currentContopiriFinal();
    if (!result || !final || result.style.display === 'none') return;
    let button = result.querySelector('[data-contopiri-to-pedepse]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary ev-contopiri-transfer';
      button.dataset.contopiriToPedepse = 'true';
      button.textContent = 'FOLOSEȘTE ÎN PEDEPSE';
      result.appendChild(button);
    }
    button.onclick = () => {
      setSessionJson(PREFILL_PEDEPSE, { source:'contopiri', duration:final, startDate:'', deductions:[] });
      go('./');
    };
  }

  function fillContopiriFromPrefill() {
    const data = getSessionJson(PREFILL_CONTOPIRI, true);
    if (!data?.components?.length || typeof window.addPenaltyRow !== 'function') return;
    const container = document.getElementById('penaltyRowsContainer');
    if (container) container.innerHTML = '';
    data.components.forEach(item => {
      window.addPenaltyRow();
      const row = container?.lastElementChild;
      if (!row) return;
      row.querySelector('.penalty-years').value = item.years || 0;
      row.querySelector('.penalty-months').value = item.months || 0;
      row.querySelector('.penalty-days').value = item.days || 0;
      const type = ['concurs','recidiva','revocare','litb'].includes(item.group) ? item.group : 'concurs';
      row.querySelector('.penalty-type').value = type;
    });
  }

  function compactLegalBox() {
    const legal = document.querySelector('.legal-box');
    if (!legal || legal.closest('.ev-legal-details')) return;
    const details = document.createElement('details');
    details.className = 'ev-legal-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Baza legală și explicații';
    legal.insertAdjacentElement('beforebegin', details);
    details.append(summary, legal);
  }

  function initContopiri() {
    if (!document.getElementById('penaltyRowsContainer')) return;
    compactLegalBox();
    fillContopiriFromPrefill();
    const original = window.calculateMergedPenalties;
    if (typeof original === 'function' && !original.__evOperationalWrapped) {
      const wrapped = function(...args) {
        const out = original.apply(this, args);
        setTimeout(addContopiriTransferButton, 0);
        return out;
      };
      wrapped.__evOperationalWrapped = true;
      window.calculateMergedPenalties = wrapped;
    }
  }

  function addTransferCopy() {
    const resultArea = document.getElementById('resultArea');
    if (!resultArea || !resultArea.querySelector('.result-card.success') || resultArea.querySelector('[data-transfer-copy]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline ev-transfer-copy';
    button.dataset.transferCopy = 'true';
    button.textContent = 'COPIAZĂ REZULTATUL';
    button.addEventListener('click', async () => {
      const text = resultArea.innerText.trim();
      try { await navigator.clipboard.writeText(text); } catch (_) {}
      button.textContent = 'COPIAT';
      setTimeout(() => { button.textContent = 'COPIAZĂ REZULTATUL'; }, 1200);
    });
    resultArea.appendChild(button);
  }

  function initTransfer() {
    const form = document.getElementById('transferForm');
    const search = document.getElementById('cautaBtn');
    if (!form || !search) return;
    document.body.classList.add('ev-transfer-auto');
    let timer;
    const run = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!document.getElementById('judet')?.value) return;
        search.click();
      }, 100);
    };
    form.addEventListener('change', run);
    document.getElementById('toggleGroup')?.addEventListener('click', event => {
      if (event.target.closest('.toggle-btn')) setTimeout(run, 0);
    });
    const resultArea = document.getElementById('resultArea');
    if (resultArea) new MutationObserver(addTransferCopy).observe(resultArea, { childList:true, subtree:true });
    addTransferCopy();
  }

  function initInstructajSearch(attempt = 0) {
    const search = document.getElementById('search');
    if (!search) {
      if (attempt < 20) setTimeout(() => initInstructajSearch(attempt + 1), 150);
      return;
    }
    if (document.querySelector('.ev-operational-search')) return;
    const originalParent = search.parentElement;
    const section = document.createElement('section');
    section.className = 'ev-operational-search';
    section.innerHTML = `
      <label for="search"><strong>CĂUTARE OPERATIVĂ</strong><span>Găsește rapid o procedură de evidență.</span></label>
      <div class="ev-operational-search__input"></div>
      <div class="ev-operational-search__chips">
        <button type="button" data-q="mandat">Mandat</button><button type="button" data-q="deducere">Deducere</button><button type="button" data-q="contopire">Contopire</button><button type="button" data-q="transfer">Transfer</button>
      </div>`;
    const inputHost = section.querySelector('.ev-operational-search__input');
    inputHost.appendChild(search);
    search.placeholder = 'Mandat, deducere, contopire, liberare…';
    originalParent?.classList.add('ev-search-placeholder-empty');
    const shell = document.querySelector('.ev-shell');
    (shell || document.body.firstElementChild)?.insertAdjacentElement('afterend', section);

    const openProcedures = () => {
      const trigger = document.querySelector('[data-view="proceduri"]');
      if (trigger instanceof HTMLElement) trigger.click();
      const procedures = document.getElementById('proceduri');
      if (procedures) procedures.hidden = false;
    };
    search.addEventListener('input', () => { if (search.value.trim()) openProcedures(); });
    section.querySelectorAll('[data-q]').forEach(button => button.addEventListener('click', () => {
      search.value = button.dataset.q;
      search.dispatchEvent(new Event('input', { bubbles:true }));
      openProcedures();
      setTimeout(() => document.getElementById('workflow-list')?.scrollIntoView({ behavior:'smooth', block:'start' }), 0);
    }));
  }

  function initSemnalmente() {
    if (!document.getElementById('file-frontal')) return;
    document.getElementById('file-frontal')?.setAttribute('capture', 'environment');
    document.getElementById('file-profil')?.setAttribute('capture', 'environment');

    const notice = document.querySelector('.notice-panel');
    if (notice && !notice.querySelector('[data-notice-toggle]')) {
      notice.classList.add('ev-collapsible-notice', 'is-collapsed');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.noticeToggle = 'true';
      button.className = 'ev-inline-toggle';
      button.textContent = 'DETALII';
      button.addEventListener('click', () => {
        const collapsed = notice.classList.toggle('is-collapsed');
        button.textContent = collapsed ? 'DETALII' : 'ASCUNDE';
      });
      notice.appendChild(button);
    }

    const saved = document.getElementById('saved-list');
    if (saved && !saved.querySelector('[data-saved-toggle]')) {
      saved.classList.add('ev-saved-collapsed');
      const head = saved.querySelector('.saved-heading-row') || saved.firstElementChild;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-ghost';
      button.dataset.savedToggle = 'true';
      button.textContent = 'ARATĂ ARHIVA';
      button.addEventListener('click', () => {
        const collapsed = saved.classList.toggle('ev-saved-collapsed');
        button.textContent = collapsed ? 'ARATĂ ARHIVA' : 'ASCUNDE ARHIVA';
      });
      head?.appendChild(button);
    }
  }

  function init() {
    ensureStyles();
    initGlobalMobileNavigation();
    const p = page();
    if (!p || p === 'index.html' || p === 'pedepse') initPedepseQuickMode();
    if (p.startsWith('ai')) initAiPrimary();
    if (p.startsWith('contopiri')) initContopiri();
    if (p === 'transfer' || p === 'transfer/index.html') initTransfer();
    if (p.startsWith('instructaj')) initInstructajSearch();
    if (p.startsWith('semnalmente')) initSemnalmente();
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

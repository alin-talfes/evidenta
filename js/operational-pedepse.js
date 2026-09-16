(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_PEDEPSE__) return;
  window.__EVIDENTA_OPERATIONAL_PEDEPSE__ = true;

  const PREFILL_PEDEPSE = 'evidenta:prefill:pedepse';
  let activeMode = 'quick';

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

  function syncQuickResultControls() {
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
      syncQuickResultControls();
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
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.textContent = `Date preluate din ${data.source === 'contopiri' ? 'Contopiri' : 'AI Documente'}. Verifică-le înainte de calcul.`;
    document.querySelector('#main-content')?.prepend(banner);
    return true;
  }

  function detailsShell(className, summaryText) {
    const details = document.createElement('details');
    details.className = className;
    const summary = document.createElement('summary');
    summary.textContent = summaryText;
    const body = document.createElement('div');
    body.className = `${className}__body`;
    details.append(summary, body);
    return { details, body };
  }

  function buildMobileDisclosure() {
    if (document.querySelector('.ev-mobile-lc-details')) return;
    const sentence = document.getElementById('sentence-heading')?.closest('.card');
    if (!sentence) return;
    const general = document.getElementById('date-ppl-heading')?.closest('.card');
    const lcGrid = document.getElementById('liberationArticle')?.closest('.form-grid');
    const mode = document.querySelector('.ev-calc-mode');

    const lc = detailsShell('ev-mobile-lc-details', 'Liberare condiționată și date PPL');
    lc.details.open = true;
    if (general) lc.body.appendChild(general);
    if (lcGrid) {
      const card = document.createElement('section');
      card.className = 'card ev-lc-controls-card';
      const title = document.createElement('h3');
      title.textContent = 'ALGORITM LIBERARE CONDIȚIONATĂ';
      card.append(title, lcGrid);
      lc.body.appendChild(card);
    }
    if (lc.body.children.length) (mode || sentence).insertAdjacentElement(mode ? 'afterend' : 'beforebegin', lc.details);

    window.EvidentaDisclosurePolicy?.normalize?.(document);
    window.EvidentaDisclosureA11y?.scan?.(document);
  }

  function normalizedMode(value) {
    return value === 'preventive' ? 'preventive' : value === 'full' ? 'full' : 'quick';
  }

  function revealValidationDetails() {
    requestAnimationFrame(() => {
      const lc = document.querySelector('.ev-mobile-lc-details');
      if (lc?.querySelector('.ev-field-invalid,[aria-invalid="true"]')) lc.open = true;
      window.EvidentaPedepseOptional?.revealInvalid?.();
    });
  }

  function setMode(value) {
    const requested = normalizedMode(value);
    const mode = document.querySelector('.ev-calc-mode');
    if (!mode) return;
    activeMode = requested;

    document.body.classList.toggle('ev-quick-mode', requested === 'quick');
    document.body.classList.toggle('ev-preventive-mode', requested === 'preventive');

    mode.querySelectorAll('[data-mode]').forEach(button => {
      const active = button.dataset.mode === requested;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const generalCard = document.getElementById('date-ppl-heading')?.closest('.card');
    const lcGrid = document.getElementById('liberationArticle')?.closest('.form-grid');
    const datesGrid = document.getElementById('startDate')?.closest('.form-grid');
    const sentenceHeading = document.getElementById('sentence-heading');
    const lcDetails = document.querySelector('.ev-mobile-lc-details');
    const preventivePanel = document.querySelector('.ev-preventive-mode-panel');
    const calcBtn = document.getElementById('calcBtn');

    if (generalCard) generalCard.hidden = requested !== 'full';
    if (lcGrid) lcGrid.hidden = requested !== 'full';
    if (lcDetails) lcDetails.hidden = requested !== 'full';
    if (preventivePanel) preventivePanel.hidden = requested !== 'preventive';
    datesGrid?.classList.toggle('ev-quick-dates', requested === 'quick');

    if (sentenceHeading) sentenceHeading.textContent = requested === 'quick' ? 'CALCUL RAPID PEDEAPSĂ' : 'DETALII PEDEAPSĂ PPL';
    if (calcBtn) calcBtn.textContent = requested === 'quick' ? 'CALCULEAZĂ EXPIRAREA' : 'CALCULEAZĂ';

    if (requested === 'preventive') window.syncPreventiveDayPresets?.();
    window.syncPrisonReceivedControl?.();
    syncQuickResultControls();
    requestAnimationFrame(() => window.EvidentaDisclosureA11y?.scan?.(document));
  }

  function calculate() {
    if (activeMode === 'preventive') {
      window.calcMasuriPreventive?.();
      return;
    }
    if (activeMode === 'quick') {
      quickCalculate();
      return;
    }
    if (window.EvidentaPedepseUx?.runCalculation && typeof window.calculateAll === 'function') {
      window.EvidentaPedepseUx.runCalculation(window.calculateAll);
      revealValidationDetails();
      return;
    }
    window.calculateAll?.();
    revealValidationDetails();
  }

  function init() {
    const mode = document.querySelector('.ev-calc-mode');
    if (!document.getElementById('calcBtn') || !mode) return;
    if (mode.dataset.evOperationalBound === 'true') return;
    mode.dataset.evOperationalBound = 'true';

    mode.addEventListener('click', event => {
      const button = event.target.closest('[data-mode]');
      if (button && mode.contains(button)) setMode(button.dataset.mode);
    });

    fillPedepseFromPrefill();
    buildMobileDisclosure();
    setMode(mode.querySelector('[data-mode].is-active')?.dataset.mode || 'quick');
  }

  window.EvidentaPedepseOperational = Object.freeze({
    calculate,
    quickCalculate,
    setMode,
    get mode() { return activeMode; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_UX__) return;
  window.__EVIDENTA_PEDEPSE_UX__ = true;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function parseDateValue(value) {
    if (!String(value || '').trim()) return null;
    return typeof window.parseDate === 'function' ? window.parseDate(String(value).trim()) : null;
  }

  function clearFieldState() {
    $$('.ev-field-invalid, .ev-field-warning').forEach(element => {
      element.classList.remove('ev-field-invalid', 'ev-field-warning');
      element.removeAttribute('aria-invalid');
      element.removeAttribute('aria-describedby');
    });
    $$('.ev-field-message').forEach(element => element.remove());
    const summary = $('#ev-validation-summary');
    if (summary) {
      summary.hidden = true;
      summary.innerHTML = '';
    }
  }

  function messageAnchor(control) {
    return control?.closest('.date-wrapper') || control;
  }

  function markControl(control, message, severity = 'error') {
    if (!control) return;
    const cls = severity === 'warning' ? 'ev-field-warning' : 'ev-field-invalid';
    control.classList.add(cls);
    if (severity === 'error') control.setAttribute('aria-invalid', 'true');

    const anchor = messageAnchor(control);
    const messageId = `ev-msg-${control.id || Math.random().toString(36).slice(2)}`;
    const note = document.createElement('div');
    note.className = `ev-field-message ${severity === 'warning' ? 'is-warning' : ''}`;
    note.id = messageId;
    note.textContent = message;
    anchor.insertAdjacentElement('afterend', note);
    control.setAttribute('aria-describedby', messageId);
  }

  function addIssue(issues, control, message, severity = 'error') {
    issues.push({ control, message, severity });
    markControl(control, message, severity);
  }

  function pairOverlaps(a, b) {
    return a.start <= b.end && b.start <= a.end;
  }

  function validateBeforeCalculation() {
    clearFieldState();
    const issues = [];
    const birthInput = $('#birthDate');
    const startInput = $('#startDate');
    const article = $('#liberationArticle');
    const life = Boolean($('#lifeSentence')?.checked);
    const birthDate = parseDateValue(birthInput?.value);
    const startDate = parseDateValue(startInput?.value);

    if (!birthDate) addIssue(issues, birthInput, 'Completează data nașterii în format zz.ll.aaaa.');
    if (!startDate) addIssue(issues, startInput, 'Completează data începerii executării în format zz.ll.aaaa.');
    if (birthDate && startDate && birthDate > startDate) {
      addIssue(issues, startInput, 'Data începerii executării nu poate fi anterioară datei nașterii.');
    }

    if (!life && !article?.value) {
      addIssue(issues, article, 'Selectează articolul de liberare condiționată.');
    }
    if (life && article?.value !== 'NCP99') {
      addIssue(issues, article, 'Pentru detențiunea pe viață se utilizează NCP art. 99.');
    }
    if (!life && article?.value === 'NCP99') {
      addIssue(issues, article, 'NCP art. 99 se utilizează numai pentru detențiunea pe viață.');
    }

    const durationControls = [
      ['#durYears', 'Ani'],
      ['#durMonths', 'Luni'],
      ['#durDays', 'Zile']
    ];
    let durationTotal = 0;
    durationControls.forEach(([selector, label]) => {
      const control = $(selector);
      const value = Number(control?.value || 0);
      if (!Number.isSafeInteger(value) || value < 0) {
        addIssue(issues, control, `${label}: introdu un număr întreg pozitiv sau zero.`);
      } else {
        durationTotal += value;
      }
    });
    if (!life && durationTotal === 0) {
      addIssue(issues, $('#durYears'), 'Durata pedepsei trebuie să fie mai mare de zero.');
    }

    const deductionIntervals = [];
    $$('.deduction-row').forEach((row, index) => {
      const start = row.querySelector('.ded-start');
      const end = row.querySelector('.ded-end');
      const startText = start?.value.trim() || '';
      const endText = end?.value.trim() || '';
      const startDateRow = parseDateValue(startText);
      const endDateRow = parseDateValue(endText);

      if (!startText) addIssue(issues, start, `Deducerea ${index + 1}: completează data de început.`);
      else if (!startDateRow) addIssue(issues, start, `Deducerea ${index + 1}: data de început este invalidă.`);

      if (!endText) addIssue(issues, end, `Deducerea ${index + 1}: completează data de sfârșit.`);
      else if (!endDateRow) addIssue(issues, end, `Deducerea ${index + 1}: data de sfârșit este invalidă.`);

      if (startDateRow && endDateRow) {
        if (endDateRow < startDateRow) {
          addIssue(issues, end, `Deducerea ${index + 1}: sfârșitul este înaintea începutului.`);
        } else {
          deductionIntervals.push({ start: startDateRow, end: endDateRow, control: start });
        }
      }
    });

    deductionIntervals.forEach((interval, index) => {
      if (deductionIntervals.slice(index + 1).some(other => pairOverlaps(interval, other))) {
        addIssue(
          issues,
          interval.control,
          'Există perioade deduse care se suprapun. Zilele comune vor fi numărate o singură dată.',
          'warning'
        );
      }
    });

    $$('.manual-days').forEach((control, index) => {
      const value = Number(control.value || 0);
      if (!Number.isSafeInteger(value) || value < 0) {
        addIssue(issues, control, `Recurs compensatoriu ${index + 1}: introdu un număr întreg pozitiv sau zero.`);
      }
    });

    const addedIntervals = [];
    $$('.non-exec-row').forEach((row, index) => {
      const start = row.querySelector('.ne-start');
      const end = row.querySelector('.ne-end');
      const startText = start?.value.trim() || '';
      const endText = end?.value.trim() || '';
      const startDateRow = parseDateValue(startText);
      const endDateRow = parseDateValue(endText);

      if (!startText) addIssue(issues, start, `Perioada adăugată ${index + 1}: completează data de început.`);
      else if (!startDateRow) addIssue(issues, start, `Perioada adăugată ${index + 1}: data de început este invalidă.`);

      if (!endText) addIssue(issues, end, `Perioada adăugată ${index + 1}: completează data finală.`);
      else if (!endDateRow) addIssue(issues, end, `Perioada adăugată ${index + 1}: data finală este invalidă.`);

      if (startDateRow && endDateRow) {
        if (endDateRow <= startDateRow) {
          addIssue(issues, end, `Perioada adăugată ${index + 1}: data finală trebuie să fie strict după data inițială.`);
        } else {
          addedIntervals.push({ start: startDateRow, end: endDateRow, control: start });
        }
      }
    });

    addedIntervals.forEach((interval, index) => {
      if (addedIntervals.slice(index + 1).some(other => pairOverlaps(interval, other))) {
        addIssue(
          issues,
          interval.control,
          'Există perioade adăugate care se suprapun. Zilele comune vor fi numărate o singură dată.',
          'warning'
        );
      }
    });

    const optionalDate = $('#conditionalReleaseDate');
    if (optionalDate?.value.trim() && !parseDateValue(optionalDate.value)) {
      addIssue(issues, optionalDate, 'Data liberării condiționate este incompletă sau invalidă.', 'warning');
    }

    const preventiveDate = $('#masuriRefDate');
    if (preventiveDate?.value.trim() && !parseDateValue(preventiveDate.value)) {
      addIssue(issues, preventiveDate, 'Data de referință pentru măsura preventivă este invalidă.', 'warning');
    }
    const preventiveDays = $('#masuriDays');
    if (preventiveDays) {
      const value = Number(preventiveDays.value || 0);
      if (!Number.isSafeInteger(value) || value < 0) {
        addIssue(issues, preventiveDays, 'Numărul de zile pentru măsura preventivă trebuie să fie întreg și pozitiv sau zero.', 'warning');
      }
    }

    return issues;
  }

  function ensureValidationSummary() {
    let summary = $('#ev-validation-summary');
    if (summary) return summary;
    summary = document.createElement('section');
    summary.id = 'ev-validation-summary';
    summary.className = 'ev-validation-summary';
    summary.hidden = true;
    summary.setAttribute('role', 'status');
    summary.setAttribute('aria-live', 'polite');
    $('#errorContainer')?.insertAdjacentElement('beforebegin', summary);
    return summary;
  }

  function renderValidationSummary(issues) {
    const summary = ensureValidationSummary();
    if (!summary) return;
    const errors = issues.filter(issue => issue.severity === 'error');
    const warnings = issues.filter(issue => issue.severity === 'warning');
    if (!issues.length) {
      summary.hidden = true;
      summary.innerHTML = '';
      return;
    }

    const title = errors.length
      ? `Corectează ${errors.length === 1 ? 'eroarea indicată' : `${errors.length} erori`} înainte de calcul`
      : 'Datele pot fi calculate, dar există elemente de verificat';

    const uniqueMessages = [...new Set(issues.map(issue => issue.message))];
    summary.classList.toggle('has-errors', errors.length > 0);
    summary.innerHTML = `
      <div class="ev-validation-summary__head">
        <strong>${title}</strong>
        ${warnings.length ? `<span>${warnings.length} ${warnings.length === 1 ? 'atenționare' : 'atenționări'}</span>` : ''}
      </div>
      <ul>${uniqueMessages.map(message => `<li>${escapeHtmlSafe(message)}</li>`).join('')}</ul>`;
    summary.hidden = false;

    if (errors.length) {
      const first = errors[0].control;
      first?.focus({ preventScroll: true });
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function escapeHtmlSafe(value) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(String(value));
    const node = document.createElement('span');
    node.textContent = String(value);
    return node.innerHTML;
  }

  function formatDateSafe(date) {
    return date instanceof Date && !Number.isNaN(date.getTime()) && typeof window.fmtDate === 'function'
      ? window.fmtDate(date)
      : '—';
  }

  function fractionSafe(ratio) {
    if (typeof window.fracStr === 'function') return window.fracStr(ratio);
    return Number.isFinite(ratio) ? String(ratio) : '—';
  }

  function durationText(calc) {
    if (calc.life) return 'Detențiune pe viață';
    const duration = calc.duration || {};
    return `${duration.y || 0} ani · ${duration.m || 0} luni · ${duration.d || 0} zile`;
  }

  function primaryStatus(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'Fără termen calendaristic';
    const now = typeof window.today === 'function' ? window.today() : new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    if (target < now) return 'Termen împlinit';
    if (target.getTime() === now.getTime()) return 'Termen astăzi';
    return 'Termen viitor';
  }

  function enhanceCalculationResult() {
    const calc = window.lastCalculation;
    const content = $('#resultsContent');
    const card = $('#resultsCard');
    if (!calc || !content || !card || card.classList.contains('hidden')) return;

    const existingDetails = content.innerHTML;
    const primaryDate = calc.life ? calc.tDate : calc.realExp;
    const primaryLabel = calc.life ? 'Prag temporal pentru LC' : 'Expirare reală';
    const minimum = calc.life
      ? `${calc.mDays ?? '—'} zile efective`
      : `${fractionSafe(calc.mR)} · ${calc.mDays ?? '—'} zile`;
    const proposed = calc.life
      ? `${calc.tDays ?? '—'} zile efective`
      : `${fractionSafe(calc.tR)} · ${calc.tDays ?? '—'} zile`;

    const summary = `
      <section class="ev-result-overview" aria-labelledby="ev-result-overview-title">
        <div class="ev-result-overview__primary">
          <div>
            <span class="ev-result-overview__eyebrow" id="ev-result-overview-title">Rezultat operațional</span>
            <strong>${primaryLabel}</strong>
            <b>${formatDateSafe(primaryDate)}</b>
          </div>
          <span class="ev-result-status">${primaryStatus(primaryDate)}</span>
        </div>

        <div class="ev-result-kpis">
          <article class="ev-result-kpi">
            <span>Pedeapsă</span>
            <strong>${escapeHtmlSafe(durationText(calc))}</strong>
          </article>
          <article class="ev-result-kpi">
            <span>Deduceri totale</span>
            <strong>${calc.ded ?? 0} zile</strong>
          </article>
          <article class="ev-result-kpi">
            <span>Perioade adăugate</span>
            <strong>${calc.non ?? 0} zile</strong>
          </article>
          <article class="ev-result-kpi">
            <span>${calc.reanalysisLabel || 'Reanalizare'}</span>
            <strong>${formatDateSafe(calc.fDate)}</strong>
          </article>
        </div>

        <div class="ev-result-milestones">
          <article>
            <span>Fracție minimă obligatorie</span>
            <strong>${minimum}</strong>
            <b>${formatDateSafe(calc.mDate)}</b>
          </article>
          <article class="is-primary">
            <span>Data propozabilă</span>
            <strong>${proposed}</strong>
            <b>${formatDateSafe(calc.tDate)}</b>
          </article>
        </div>

        <div class="ev-result-check">
          <span aria-hidden="true">✓</span>
          <p><strong>Calcul finalizat.</strong> Rezultatul trebuie confruntat cu mandatul, hotărârile și situația juridică din dosar înainte de operare.</p>
        </div>
      </section>

      <details class="ev-result-details">
        <summary>Vezi toate detaliile și explicațiile calculului</summary>
        <div class="ev-result-details__content">${existingDetails}</div>
      </details>`;

    content.innerHTML = summary;
  }

  function updateTechnicalFootnote() {
    const footnote = $('.steps-container .footnote');
    if (!footnote) return;
    footnote.textContent = 'Notă: fracțiile exprimate în zile folosesc partea întreagă inferioară; aplicația nu rotunjește fracția în sus.';
  }

  function installCalculationGuard() {
    const original = window.calculateAll;
    if (typeof original !== 'function' || original.__evEnhanced) return;

    function enhancedCalculateAll(...args) {
      const engineError = $('#errorContainer');
      engineError?.classList.remove('visible');

      const issues = validateBeforeCalculation();
      renderValidationSummary(issues);
      if (issues.some(issue => issue.severity === 'error')) {
        $('#resultsCard')?.classList.add('hidden');
        return;
      }

      const result = original.apply(this, args);
      if (!$('#errorContainer')?.classList.contains('visible')) {
        enhanceCalculationResult();
      }
      return result;
    }

    enhancedCalculateAll.__evEnhanced = true;
    enhancedCalculateAll.__evOriginal = original;
    window.calculateAll = enhancedCalculateAll;
  }

  function init() {
    ensureValidationSummary();
    updateTechnicalFootnote();
    installCalculationGuard();

    document.addEventListener('input', event => {
      if (!event.target.matches('input, select, textarea')) return;
      if (event.target.classList.contains('ev-field-invalid') || event.target.classList.contains('ev-field-warning')) {
        clearFieldState();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

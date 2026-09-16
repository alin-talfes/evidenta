(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_AI__) return;
  window.__EVIDENTA_OPERATIONAL_AI__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-ai.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const PREFILL_PEDEPSE = 'evidenta:prefill:pedepse';
  const PREFILL_CONTOPIRI = 'evidenta:prefill:contopiri';

  function parseDateSafe(value) {
    if (typeof window.parseDate === 'function') return window.parseDate(String(value || '').trim());
    const m = String(value || '').trim().match(/^([0-3]?\d)\.([01]?\d)\.((?:19|20)\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return d.getFullYear() === Number(m[3]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[1]) ? d : null;
  }

  function daysBetweenSafe(a, b) {
    return typeof window.daysBetween === 'function'
      ? window.daysBetween(a, b)
      : Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function setSessionJson(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function go(path = '') {
    location.href = new URL(path, rootUrl).href;
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

  function aiDeductions() {
    return [...document.querySelectorAll('#deductionRows tr')].map(row => ({
      start: row.querySelector('.d-start')?.value.trim() || '',
      end: row.querySelector('.d-end')?.value.trim() || '',
      type: aiRowType(row),
      openEnded: aiRowIsOpenEnded(row)
    })).filter(item => item.start || item.end);
  }

  function transferDeductions() {
    const deductions = [];
    let openEndedOmitted = 0;
    document.querySelectorAll('#deductionRows tr').forEach(row => {
      const start = row.querySelector('.d-start')?.value.trim() || '';
      let end = row.querySelector('.d-end')?.value.trim() || '';
      if (!start && !end) return;
      const type = aiRowType(row);
      if (type === 'retention24h' && start && !end) end = start;
      if (aiRowIsOpenEnded(row) || !start || !end) {
        openEndedOmitted += 1;
        return;
      }
      deductions.push({ start, end, type });
    });
    return { deductions, openEndedOmitted };
  }

  function annotateAiOpenEndedDeductions() {
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
      const days = !item.openEnded && a && b && b >= a ? (item.type === 'retention24h' ? 1 : daysBetweenSafe(a,b)+1) : null;
      return `<li><strong>${item.start || '—'}${item.end && item.end !== item.start ? ` – ${item.end}` : ''}</strong>${item.openEnded ? ' · la zi' : (days ? ` · ${days} zile` : '')}</li>`;
    }).join('') : '<li>Nu au fost identificate deduceri.</li>';
    box.querySelector('[data-ai-duration]').textContent = `${y} ani · ${m} luni · ${d} zile`;
    box.querySelector('[data-ai-start]').textContent = start;
    box.querySelector('[data-ai-deductions]').innerHTML = list;
    annotateAiOpenEndedDeductions();
  }

  function sendAiToPedepse() {
    const transfer = transferDeductions();
    setSessionJson(PREFILL_PEDEPSE, {
      source: 'ai',
      duration: {
        years: Number(document.getElementById('finalYears')?.value || 0),
        months: Number(document.getElementById('finalMonths')?.value || 0),
        days: Number(document.getElementById('finalDays')?.value || 0)
      },
      startDate: document.getElementById('startDate')?.value.trim() || '',
      deductions: transfer.deductions,
      openEndedOmitted: transfer.openEndedOmitted
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

  function makeCameraFirst() {
    if (document.querySelector('[data-ai-camera]')) return;
    const input = document.getElementById('fileInput');
    const drop = document.getElementById('dropZone');
    if (!input || !drop) return;

    const actions = document.createElement('div');
    actions.className = 'ev-ai-camera-actions';
    actions.innerHTML = `
      <button type="button" class="btn btn-primary ev-ai-camera-button" data-ai-camera>
        <span aria-hidden="true">▣</span> FOTOGRAFIAZĂ MANDATUL
      </button>
      <p>Camera din spate · fotografia rămâne pe dispozitiv</p>`;
    drop.insertAdjacentElement('beforebegin', actions);

    const strong = drop.querySelector('strong');
    const hint = drop.querySelector('span');
    if (strong) strong.textContent = 'ALEGE DIN TELEFON / PDF';
    if (hint) hint.textContent = 'Fotografii existente, PDF sau mai multe pagini';

    actions.querySelector('[data-ai-camera]')?.addEventListener('click', () => {
      const previous = {
        accept: input.getAttribute('accept'),
        multiple: input.hasAttribute('multiple'),
        capture: input.getAttribute('capture')
      };
      const restore = () => {
        if (previous.accept === null) input.removeAttribute('accept'); else input.setAttribute('accept', previous.accept);
        if (previous.multiple) input.setAttribute('multiple', ''); else input.removeAttribute('multiple');
        if (previous.capture === null) input.removeAttribute('capture'); else input.setAttribute('capture', previous.capture);
      };
      input.setAttribute('accept', 'image/*');
      input.removeAttribute('multiple');
      input.setAttribute('capture', 'environment');
      input.addEventListener('change', () => setTimeout(restore, 0), { once:true });
      window.addEventListener('focus', () => setTimeout(restore, 1200), { once:true });
      input.click();
    });
  }

  function makeReviewOperational(review) {
    if (!review || review.dataset.evMobileOperational === 'true') return;
    review.dataset.evMobileOperational = 'true';
    document.getElementById('warningList')?.classList.add('ev-ai-warning-list');
    const evidence = document.getElementById('evidenceCard');
    if (evidence && !evidence.closest('.ev-ai-evidence-details')) {
      const details = document.createElement('details');
      details.className = 'ev-ai-evidence-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Surse și dovezi OCR';
      evidence.insertAdjacentElement('beforebegin', details);
      details.append(summary, evidence);
      const syncEvidenceVisibility = () => {
        const hidden = evidence.classList.contains('ai-hidden');
        details.hidden = hidden;
        if (hidden) details.open = false;
      };
      new MutationObserver(syncEvidenceVisibility).observe(evidence, { attributes:true, attributeFilter:['class'] });
      syncEvidenceVisibility();
    }
  }

  function init() {
    makeCameraFirst();
    const review = document.getElementById('reviewCard');
    if (!review) return;
    makeReviewOperational(review);
    if (review.querySelector('.ev-ai-primary')) return;

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
    window.EvidentaDisclosurePolicy?.normalize?.(document);
    window.EvidentaDisclosureA11y?.scan?.(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
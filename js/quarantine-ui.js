(function(root){
'use strict';

function fmt(d){ return typeof root.fmtDate === 'function' ? root.fmtDate(d) : '—'; }

function enhance(){
  const calc = root.lastCalculation;
  if (!calc?.prisonReceivedDate || !root.QuarantineRules?.schedule) return;
  const q = root.QuarantineRules.schedule(calc.prisonReceivedDate);
  if (!q) return;
  calc.quarantineEnd = q.day21;
  calc.provisionalRegimeDate = q.day22;

  const results = document.getElementById('resultsContent');
  if (results) {
    const items = [...results.querySelectorAll('.result-item')];
    const existing = items.find(item => item.querySelector('.result-label')?.textContent.trim().toLowerCase().startsWith('carantină'));
    if (existing) {
      const label = existing.querySelector('.result-label');
      const value = existing.querySelector('.result-value');
      const note = existing.querySelector('.result-note');
      if (label) label.textContent = 'CARANTINĂ — ZIUA 21';
      if (value) value.textContent = fmt(q.day21);
      if (note) note.textContent = 'Ultima zi de carantină; ziua primirii este ziua 1.';
      else existing.insertAdjacentHTML('beforeend','<div class="result-note">Ultima zi de carantină; ziua primirii este ziua 1.</div>');
      const next = existing.nextElementSibling;
      if (!next || next.dataset?.quarantineDay22 !== 'true') {
        existing.insertAdjacentHTML('afterend', `<div class="result-item" data-quarantine-day22="true"><div class="result-label">REGIM PROVIZORIU — DIN ZIUA 22</div><div class="result-value">${fmt(q.day22)}</div><div class="result-note">Din această zi poate fi stabilit provizoriu regimul.</div></div>`);
      }
    }
  }

  const steps = document.getElementById('stepsList');
  if (steps) {
    const li = [...steps.querySelectorAll('li')].find(x => x.textContent.includes('Carantina de 21 zile'));
    if (li) li.textContent = `Carantină: ziua primirii (${fmt(calc.prisonReceivedDate)}) este ZIUA 1; ZIUA 21 expiră la ${fmt(q.day21)}; din ZIUA 22 (${fmt(q.day22)}) poate fi stabilit provizoriu regimul.`;
  }

  const timeline = document.getElementById('timelineList');
  if (timeline) {
    const item = [...timeline.querySelectorAll('li')].find(li => li.querySelector('.tl-label')?.textContent.trim() === 'Carantină expiră');
    if (item) {
      item.querySelector('.tl-label').textContent = 'Carantină — ziua 21';
      if (!timeline.querySelector('[data-quarantine-day22="true"]')) {
        const li = document.createElement('li');
        li.dataset.quarantineDay22 = 'true';
        const t = typeof root.today === 'function' ? root.today() : new Date();
        if (typeof root.daysBetween === 'function' && root.daysBetween(t,q.day22) < 0) li.classList.add('passed');
        li.innerHTML = `<span class="tl-date">${fmt(q.day22)}</span> <span class="tl-label">Regim provizoriu — din ziua 22</span>`;
        item.insertAdjacentElement('afterend',li);
      }
    }
  }
}

const base = root.calculateAll;
if (typeof base === 'function') {
  root.calculateAll = function(){
    const result = base.apply(this, arguments);
    enhance();
    return result;
  };
}

root.enhanceQuarantineResult = enhance;
})(typeof window !== 'undefined' ? window : globalThis);

(() => {
  'use strict';

  if (window.__EVIDENTA_MOBILE_OPERATIONAL_V2__) return;
  window.__EVIDENTA_MOBILE_OPERATIONAL_V2__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/mobile-operational-v2.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);

  function ensureStyles() {
    if (document.querySelector('link[data-evidenta-mobile-operational-v2]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/mobile-operational-v2.css?v=1', scriptUrl).href;
    link.dataset.evidentaMobileOperationalV2 = 'true';
    document.head.appendChild(link);
  }

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

  function buildPedepseDisclosure() {
    if (pageKey() !== 'pedepse' || document.querySelector('.ev-mobile-lc-details')) return;
    const main = document.getElementById('main-content');
    const sentence = document.getElementById('sentence-heading')?.closest('.card');
    if (!main || !sentence) return;

    const general = document.getElementById('date-ppl-heading')?.closest('.card');
    const directSentenceGrids = [...sentence.querySelectorAll(':scope > .form-grid')];
    const lcGrid = directSentenceGrids.find(grid => grid.querySelector('#liberationArticle')) || null;
    const mode = document.querySelector('.ev-calc-mode');

    const lc = detailsShell('ev-mobile-lc-details', 'Liberare condiționată și date PPL');
    if (general) lc.body.appendChild(general);
    if (lcGrid) {
      const card = document.createElement('section');
      card.className = 'card ev-lc-controls-card';
      const title = document.createElement('h3');
      title.textContent = 'ALGORITM LIBERARE CONDIȚIONATĂ';
      card.append(title, lcGrid);
      lc.body.appendChild(card);
    }
    if (lc.body.children.length) {
      (mode || sentence).insertAdjacentElement(mode ? 'afterend' : 'beforebegin', lc.details);
    }

    const rareIds = ['recurs-heading', 'nonExec-heading', 'rest-heading', 'masuri-preventive-heading'];
    const rareCards = rareIds.map(id => document.getElementById(id)?.closest('.card')).filter(Boolean);
    if (rareCards.length) {
      const advanced = detailsShell('ev-mobile-advanced-details', 'Opțiuni avansate');
      const deductionsCard = document.getElementById('deductions-heading')?.closest('.card');
      rareCards.forEach(card => advanced.body.appendChild(card));
      (deductionsCard || sentence).insertAdjacentElement('afterend', advanced.details);
    }

    const syncMode = () => {
      const quick = document.body.classList.contains('ev-quick-mode');
      lc.details.hidden = quick;
      if (!quick && (document.getElementById('birthDate')?.classList.contains('ev-field-invalid') || document.getElementById('liberationArticle')?.classList.contains('ev-field-invalid'))) {
        lc.details.open = true;
      }
    };
    syncMode();
    new MutationObserver(syncMode).observe(document.body, { attributes:true, attributeFilter:['class'] });

    document.getElementById('calcBtn')?.addEventListener('click', () => {
      if (document.body.classList.contains('ev-quick-mode')) return;
      requestAnimationFrame(() => {
        if (lc.details.querySelector('.ev-field-invalid,[aria-invalid="true"]')) lc.details.open = true;
        const advanced = document.querySelector('.ev-mobile-advanced-details');
        if (advanced?.querySelector('.ev-field-invalid,[aria-invalid="true"]')) advanced.open = true;
      });
    });
  }

  function addRetentionPreset() {
    if (pageKey() !== 'pedepse') return;
    const add = document.getElementById('addDedBtn');
    if (!add || document.querySelector('[data-add-retention]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline btn-sm ev-retention-preset';
    button.dataset.addRetention = 'true';
    button.textContent = '+ REȚINERE 24H';
    button.addEventListener('click', () => {
      if (typeof window.addDedRow !== 'function') return;
      window.addDedRow({ type:'retention24h' });
      const row = document.querySelector('#deductionsContainer .deduction-row:last-child');
      row?.querySelector('.ded-start')?.focus();
      row?.scrollIntoView({ behavior:'smooth', block:'center' });
    });
    add.insertAdjacentElement('afterend', button);
  }

  function makeAiCameraFirst() {
    if (pageKey() !== 'ai' || document.querySelector('[data-ai-camera]')) return;
    const input = document.getElementById('fileInput');
    const drop = document.getElementById('dropZone');
    const card = document.getElementById('upload-title')?.closest('.ai-card');
    if (!input || !drop || !card) return;

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
      const onFocus = () => setTimeout(restore, 1200);
      window.addEventListener('focus', onFocus, { once:true });
      input.click();
    });
  }

  function makeAiReviewOperational() {
    if (pageKey() !== 'ai') return;
    const review = document.getElementById('reviewCard');
    if (!review || review.dataset.evMobileOperational === 'true') return;
    review.dataset.evMobileOperational = 'true';
    const warning = document.getElementById('warningList');
    if (warning) warning.classList.add('ev-ai-warning-list');
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

  function compactContopiriResult() {
    if (pageKey() !== 'contopiri') return;
    const result = document.getElementById('mergeResult');
    if (!result || result.dataset.evMobileObserved === 'true') return;
    result.dataset.evMobileObserved = 'true';
    const apply = () => {
      const detail = result.querySelector('.detail');
      if (!detail || detail.closest('details')) return;
      const details = document.createElement('details');
      details.className = 'ev-contopiri-result-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Detalii calcul';
      detail.insertAdjacentElement('beforebegin', details);
      details.append(summary, detail);
    };
    new MutationObserver(apply).observe(result, { childList:true, subtree:true });
    apply();
  }

  function compactTransfer() {
    if (pageKey() !== 'transfer') return;
    const card = document.getElementById('transferForm')?.closest('.card');
    if (!card) return;
    card.classList.add('ev-transfer-compact');
    const help = card.querySelector('.section-help');
    if (help && !help.closest('details')) {
      const details = document.createElement('details');
      details.className = 'ev-transfer-help-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Cum se folosește';
      help.insertAdjacentElement('beforebegin', details);
      details.append(summary, help);
    }
  }

  function compactSemnalmente() {
    if (pageKey() !== 'semnalmente') return;
    const frontal = document.getElementById('file-frontal');
    const profil = document.getElementById('file-profil');
    if (frontal) frontal.setAttribute('capture', 'environment');
    if (profil) profil.setAttribute('capture', 'environment');
    document.querySelectorAll('.upload-zone').forEach((zone, index) => {
      const title = zone.querySelector('strong, h3, h4');
      if (title && !title.dataset.evCameraLabel) {
        title.dataset.evCameraLabel = 'true';
        const isFront = index === 0 || zone.id?.includes('frontal');
        title.textContent = isFront ? 'FĂ POZĂ FRONTALĂ' : 'FĂ POZĂ DIN PROFIL';
      }
    });
  }

  function makeTouchFriendly() {
    document.querySelectorAll('input.date-masked').forEach(input => {
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('autocomplete', 'off');
    });
    document.querySelectorAll('input[type="number"]').forEach(input => input.setAttribute('inputmode', 'numeric'));
  }

  function init() {
    ensureStyles();
    buildPedepseDisclosure();
    addRetentionPreset();
    makeAiCameraFirst();
    makeAiReviewOperational();
    compactContopiriResult();
    compactTransfer();
    compactSemnalmente();
    makeTouchFriendly();
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

(() => {
  'use strict';

  if (window.__EVIDENTA_DISCLOSURE_HARDENING__) return;
  window.__EVIDENTA_DISCLOSURE_HARDENING__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/disclosure-hardening.js', document.baseURI);
  let idCounter = 0;

  const DETAILS_SELECTOR = [
    '.ev-mobile-lc-details',
    '.ev-mobile-advanced-details',
    '.ev-ai-evidence-details',
    '.ev-contopiri-result-details',
    '.ev-transfer-help-details',
    '.ev-ai-secondary',
    '.ev-ai-components',
    '.ev-legal-details'
  ].join(',');

  function ensureStyles() {
    if (document.querySelector('link[data-evidenta-disclosure-hardening]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/disclosure-hardening.css?v=1', scriptUrl).href;
    link.dataset.evidentaDisclosureHardening = 'true';
    document.head.appendChild(link);
  }

  function ensureId(element, prefix = 'ev-disclosure') {
    if (!element) return '';
    if (!element.id) {
      idCounter += 1;
      element.id = `${prefix}-${idCounter}`;
    }
    return element.id;
  }

  function syncNativeDetails(details) {
    if (!(details instanceof HTMLElement)) return;
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;
    const body = [...details.children].find(child => child !== summary) || null;
    if (body) summary.setAttribute('aria-controls', ensureId(body));
    summary.setAttribute('aria-expanded', String(details.open));

    if (details.dataset.evDisclosureBound === 'true') return;
    details.dataset.evDisclosureBound = 'true';
    details.addEventListener('toggle', () => {
      summary.setAttribute('aria-expanded', String(details.open));
    });
  }

  function bindClassToggle(button, container, collapsedClass, target) {
    if (!button || !container) return;
    if (target) button.setAttribute('aria-controls', ensureId(target));
    const sync = () => button.setAttribute('aria-expanded', String(!container.classList.contains(collapsedClass)));
    sync();

    if (button.dataset.evDisclosureBound !== 'true') {
      button.dataset.evDisclosureBound = 'true';
      button.addEventListener('click', () => queueMicrotask(sync));
      new MutationObserver(sync).observe(container, { attributes:true, attributeFilter:['class'] });
    }
  }

  function syncCustomDisclosures(root = document) {
    root.querySelectorAll?.('[data-notice-toggle]').forEach(button => {
      const notice = button.closest('.ev-collapsible-notice');
      const target = notice?.querySelector(':scope > div:not(.notice-icon)') || null;
      bindClassToggle(button, notice, 'is-collapsed', target);
    });

    root.querySelectorAll?.('[data-saved-toggle]').forEach(button => {
      const saved = button.closest('#saved-list, .saved-list');
      const target = saved?.querySelector('#saved-items') || null;
      bindClassToggle(button, saved, 'ev-saved-collapsed', target);
    });
  }

  function repairPreventiveCardOwnership() {
    const heading = document.getElementById('masuri-preventive-heading');
    const card = heading?.closest('.card');
    const panelBody = document.querySelector('.ev-preventive-mode-panel__body');
    if (!card || !panelBody || card.parentElement === panelBody) return;
    panelBody.appendChild(card);
    card.hidden = false;

    const advancedBody = document.querySelector('.ev-mobile-advanced-details__body');
    const advanced = advancedBody?.closest('.ev-mobile-advanced-details');
    if (advancedBody && advanced && advancedBody.children.length === 0) advanced.remove();
  }

  function scan(root = document) {
    root.querySelectorAll?.(DETAILS_SELECTOR).forEach(syncNativeDetails);
    if (root.matches?.(DETAILS_SELECTOR)) syncNativeDetails(root);
    syncCustomDisclosures(root);
    repairPreventiveCardOwnership();
  }

  function init() {
    ensureStyles();
    scan(document);

    let queued = false;
    const observer = new MutationObserver(records => {
      if (!records.some(record => record.addedNodes?.length)) return;
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        scan(document);
      });
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();

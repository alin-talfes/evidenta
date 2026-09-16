(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_OPTIONAL_FIX__) return;
  window.__EVIDENTA_PEDEPSE_OPTIONAL_FIX__ = true;

  const OPTIONAL_IDS = ['recurs-heading', 'nonExec-heading', 'rest-heading'];
  const PREVENTIVE_HEADING_ID = 'masuri-preventive-heading';
  let observer = null;
  let queued = false;

  function cardForHeading(id) {
    return document.getElementById(id)?.closest('.card') || null;
  }

  function removePreventiveFromOptionalTools() {
    const optional = document.querySelector('.ev-optional-tools');
    const preventiveCard = cardForHeading(PREVENTIVE_HEADING_ID);
    if (!optional) return;

    optional.querySelectorAll('.ev-optional-toggle').forEach(button => {
      const controls = button.getAttribute('aria-controls') || '';
      const text = (button.textContent || '').toLocaleLowerCase('ro');
      if (
        (preventiveCard?.id && controls === preventiveCard.id) ||
        controls.includes('masuri-preventive') ||
        text.includes('măsuri preventive') ||
        text.includes('masuri preventive')
      ) {
        button.remove();
      }
    });

    if (preventiveCard) preventiveCard.classList.remove('ev-optional-card');
  }

  function unwrapOptionalCards() {
    const optional = document.querySelector('.ev-optional-tools');
    if (!optional) return false;

    let anchor = optional;
    OPTIONAL_IDS.forEach(id => {
      const card = cardForHeading(id);
      if (!card) return;
      if (card.closest('.ev-mobile-advanced-details')) {
        anchor.insertAdjacentElement('afterend', card);
      }
      anchor = card;
    });

    document.querySelectorAll('.ev-mobile-advanced-details').forEach(details => {
      const body = details.querySelector('.ev-mobile-advanced-details__body');
      if (!body || body.children.length === 0) details.remove();
    });

    return true;
  }

  function syncButton(button, card, open) {
    card.hidden = !open;
    button.classList.toggle('is-active', open);
    button.setAttribute('aria-expanded', String(open));
    const icon = button.querySelector('span[aria-hidden="true"]');
    if (icon) icon.textContent = open ? '−' : '+';
  }

  function bindOptionalTools() {
    const optional = document.querySelector('.ev-optional-tools');
    if (!optional || optional.dataset.evOptionalFixBound === 'true') return Boolean(optional);

    optional.dataset.evOptionalFixBound = 'true';
    optional.addEventListener('click', event => {
      const button = event.target.closest('.ev-optional-toggle');
      if (!button || !optional.contains(button)) return;

      const targetId = button.getAttribute('aria-controls') || '';
      const card = targetId ? document.getElementById(targetId) : null;
      if (!card || !OPTIONAL_IDS.some(id => card.querySelector(`#${id}`))) return;

      // Neutralizează listenerul vechi: altfel cardul este deschis și închis imediat.
      event.preventDefault();
      event.stopImmediatePropagation();

      unwrapOptionalCards();
      const open = card.hidden;
      syncButton(button, card, open);
      if (open) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, true);

    return true;
  }

  function repair() {
    if (!document.body) return false;
    removePreventiveFromOptionalTools();
    const hasOptional = unwrapOptionalCards();
    bindOptionalTools();
    return hasOptional;
  }

  function scheduleRepair() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      repair();
    });
  }

  function init() {
    repair();

    // UX/mobile controllers are loaded dynamically and can finish in either order.
    // Observe only during bootstrap, then disconnect to avoid a permanent body observer.
    observer = new MutationObserver(records => {
      if (records.some(record => record.addedNodes?.length || record.removedNodes?.length)) scheduleRepair();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => {
      observer?.disconnect();
      observer = null;
      repair();
    }, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.addEventListener('evidenta:shellready', scheduleRepair);
})();

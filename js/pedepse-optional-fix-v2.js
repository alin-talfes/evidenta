(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_OPTIONAL_FIX_V2__) return;
  window.__EVIDENTA_PEDEPSE_OPTIONAL_FIX_V2__ = true;

  const OPTIONAL_IDS = ['recurs-heading', 'nonExec-heading', 'rest-heading'];
  const PREVENTIVE_HEADING_ID = 'masuri-preventive-heading';

  function cardForHeading(id) {
    return document.getElementById(id)?.closest('.card') || null;
  }

  function removePreventiveFromOptionalTools() {
    const optional = document.querySelector('.ev-optional-tools');
    const preventiveCard = cardForHeading(PREVENTIVE_HEADING_ID);
    if (!optional) return false;

    optional.querySelectorAll('.ev-optional-toggle').forEach(button => {
      const controls = button.getAttribute('aria-controls') || '';
      const text = (button.textContent || '').toLocaleLowerCase('ro');
      if (
        (preventiveCard?.id && controls === preventiveCard.id) ||
        controls.includes('masuri-preventive') ||
        text.includes('măsuri preventive') ||
        text.includes('masuri preventive')
      ) button.remove();
    });

    if (preventiveCard) preventiveCard.classList.remove('ev-optional-card');
    return true;
  }

  function unwrapOptionalCards() {
    const optional = document.querySelector('.ev-optional-tools');
    if (!optional) return false;

    let anchor = optional;
    for (const id of OPTIONAL_IDS) {
      const card = cardForHeading(id);
      if (!card) continue;
      if (card.closest('.ev-mobile-advanced-details')) anchor.insertAdjacentElement('afterend', card);
      anchor = card;
    }

    document.querySelectorAll('.ev-mobile-advanced-details').forEach(details => {
      const body = details.querySelector('.ev-mobile-advanced-details__body');
      if (!body || body.children.length === 0) details.remove();
    });
    return true;
  }

  function syncButton(button, card, open) {
    if (card.hidden === open) card.hidden = !open;
    button.classList.toggle('is-active', open);
    button.setAttribute('aria-expanded', String(open));
    const icon = button.querySelector('span[aria-hidden="true"]');
    if (icon && icon.textContent !== (open ? '−' : '+')) icon.textContent = open ? '−' : '+';
  }

  function bindOptionalTools() {
    const optional = document.querySelector('.ev-optional-tools');
    if (!optional) return false;
    if (optional.dataset.evOptionalFixV2Bound === 'true') return true;

    optional.dataset.evOptionalFixV2Bound = 'true';
    optional.addEventListener('click', event => {
      const button = event.target.closest('.ev-optional-toggle');
      if (!button || !optional.contains(button)) return;

      const targetId = button.getAttribute('aria-controls') || '';
      const card = targetId ? document.getElementById(targetId) : null;
      if (!card || !OPTIONAL_IDS.some(id => card.querySelector(`#${id}`))) return;

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
    const bound = bindOptionalTools();
    return hasOptional && bound;
  }

  function initDeterministically() {
    const delays = [0, 40, 120, 300, 700];
    delays.forEach(delay => window.setTimeout(repair, delay));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeterministically, { once: true });
  } else {
    initDeterministically();
  }
  window.addEventListener('evidenta:shellready', repair);
  window.addEventListener('load', repair, { once: true });
})();

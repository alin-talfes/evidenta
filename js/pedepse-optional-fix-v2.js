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

    if (preventiveCard) {
      preventiveCard.classList.remove('ev-optional-card');
      preventiveCard.hidden = false;
    }
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

  function repair() {
    if (!document.body) return false;
    removePreventiveFromOptionalTools();
    return unwrapOptionalCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', repair, { once: true });
  } else {
    repair();
  }
})();

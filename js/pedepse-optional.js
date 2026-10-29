(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_OPTIONAL__) return;
  window.__EVIDENTA_PEDEPSE_OPTIONAL__ = true;

  const ITEMS = Object.freeze([
    { cardId: 'recursCard', headingId: 'recurs-heading' },
    { cardId: 'nonExecCard', headingId: 'nonExec-heading' },
    { cardId: 'restCard', headingId: 'rest-heading' }
  ]);

  function cardHasMeaningfulValue(card) {
    if (!card) return false;
    return [...card.querySelectorAll('input, select, textarea')].some(control => {
      if (control.type === 'checkbox' || control.type === 'radio') return control.checked;
      if (control.type === 'number') return Number(control.value || 0) !== 0;
      if (control.type === 'text' && control.classList.contains('ne-days')) return Boolean(control.value.trim() && control.value !== '0');
      if (control.tagName === 'SELECT') return Boolean(control.value && !['escape', '0'].includes(control.value));
      return Boolean(String(control.value || '').trim());
    });
  }

  function buttonForCard(cardId) {
    return document.querySelector(`.ev-optional-toggle[aria-controls="${cardId}"]`);
  }

  function setOpen(card, open, { scroll = false, manual = false } = {}) {
    if (!card) return;
    card.hidden = !open;
    if (manual) card.dataset.evOptionalOverride = open ? 'open' : 'closed';
    const button = buttonForCard(card.id);
    if (button) {
      button.classList.toggle('is-active', open);
      button.setAttribute('aria-expanded', String(open));
      const icon = button.querySelector('[aria-hidden="true"]');
      if (icon) icon.textContent = open ? '−' : '+';
    }
    if (open && scroll) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function syncFromValues() {
    ITEMS.forEach(({ cardId }) => {
      const card = document.getElementById(cardId);
      if (!card) return;
      const populated = cardHasMeaningfulValue(card);
      const override = card.dataset.evOptionalOverride;
      setOpen(card, override ? override === 'open' : populated);
      card.dataset.evOptionalInitialized = 'true';
    });
  }

  function syncControlsForCard(card) {
    if (!card) return;
    card.querySelectorAll('input, select, textarea').forEach(control => {
      if (control.dataset.evOptionalSyncBound === 'true') return;
      control.dataset.evOptionalSyncBound = 'true';
      const revealWhenPopulated = () => {
        if (!cardHasMeaningfulValue(card)) return;
        delete card.dataset.evOptionalOverride;
        setOpen(card, true);
      };
      control.addEventListener('input', revealWhenPopulated);
      control.addEventListener('change', revealWhenPopulated);
    });
  }

  function revealInvalid() {
    ITEMS.forEach(({ cardId }) => {
      const card = document.getElementById(cardId);
      if (card?.querySelector('.ev-field-invalid,[aria-invalid="true"]')) setOpen(card, true);
    });
  }

  function init() {
    const section = document.querySelector('.ev-optional-tools');
    if (!section || section.dataset.evOptionalBound === 'true') return;
    section.dataset.evOptionalBound = 'true';

    section.addEventListener('click', event => {
      const button = event.target.closest('.ev-optional-toggle');
      if (!button || !section.contains(button)) return;
      const cardId = button.getAttribute('aria-controls') || '';
      if (!ITEMS.some(item => item.cardId === cardId)) return;
      const card = document.getElementById(cardId);
      if (!card) return;
      setOpen(card, card.hidden, { scroll: card.hidden, manual: true });
    });

    syncFromValues();
    ITEMS.forEach(({ cardId }) => syncControlsForCard(document.getElementById(cardId)));
  }

  window.EvidentaPedepseOptional = Object.freeze({
    syncFromValues,
    revealInvalid,
    setOpen
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

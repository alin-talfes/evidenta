(() => {
  'use strict';

  // Neutralizează controllerele vechi care instalau observatori largi pe DOM.
  // Noile controllere folosesc inițializare deterministă, fără MutationObserver pe body/main.
  window.__EVIDENTA_PEDEPSE_OPTIONAL_FIX__ = true;
  window.__EVIDENTA_PEDEPSE_MODES_V4__ = true;
  window.__EVIDENTA_DISCLOSURE_HARDENING__ = true;
})();

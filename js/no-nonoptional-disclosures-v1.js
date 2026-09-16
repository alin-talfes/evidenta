(() => {
  'use strict';

  if (window.__EVIDENTA_NO_NONOPTIONAL_DISCLOSURES_V1__) return;
  window.__EVIDENTA_NO_NONOPTIONAL_DISCLOSURES_V1__ = true;

  const OPTIONAL_DETAILS_SELECTOR = [
    'details.ev-mobile-advanced-details',
    '.ev-optional-tools details',
    'details[data-ev-optional="true"]'
  ].join(',');

  function isOptionalDisclosure(details) {
    return details.matches?.(OPTIONAL_DETAILS_SELECTOR) || Boolean(details.closest?.('.ev-optional-tools'));
  }

  function ensureStyles() {
    if (document.getElementById('ev-no-nonoptional-disclosures-style')) return;
    const style = document.createElement('style');
    style.id = 'ev-no-nonoptional-disclosures-style';
    style.textContent = `
      details[data-ev-static-disclosure="true"] > summary.ev-static-disclosure-title {
        display:flex;
        align-items:center;
        min-height:42px;
        padding:10px 14px;
        color:var(--ev-text, inherit);
        font-size:.8rem;
        font-weight:800;
        line-height:1.35;
        cursor:default;
        user-select:text;
        list-style:none;
        pointer-events:none;
      }
      details[data-ev-static-disclosure="true"] > summary.ev-static-disclosure-title::-webkit-details-marker {
        display:none;
      }
      details[data-ev-static-disclosure="true"] > summary.ev-static-disclosure-title::marker {
        content:'';
      }
      .ev-match-why > summary.ev-static-disclosure-title {
        min-height:0;
        padding:0;
        color:var(--ev-accent-strong, #7aa7ff);
        font-size:.74rem;
        font-weight:760;
      }
    `;
    document.head.appendChild(style);
  }

  function neutralizeSummary(details) {
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;
    summary.classList.add('ev-static-disclosure-title');
    summary.setAttribute('tabindex', '-1');
    summary.setAttribute('aria-disabled', 'true');
    summary.removeAttribute('aria-expanded');
  }

  function freezeDetails(details) {
    if (!(details instanceof HTMLElement) || details.tagName !== 'DETAILS' || isOptionalDisclosure(details)) return;
    details.dataset.evStaticDisclosure = 'true';
    details.open = true;
    neutralizeSummary(details);

    if (details.dataset.evStaticDisclosureBound === 'true') return;
    details.dataset.evStaticDisclosureBound = 'true';
    details.addEventListener('toggle', () => {
      if (!details.hidden && !details.open) details.open = true;
    });
  }

  function expandLegacyCustomDisclosures(root = document) {
    root.querySelectorAll?.('.ev-collapsible-notice.is-collapsed').forEach(node => node.classList.remove('is-collapsed'));
    root.querySelectorAll?.('#saved-list.ev-saved-collapsed, .saved-list.ev-saved-collapsed').forEach(node => node.classList.remove('ev-saved-collapsed'));
    root.querySelectorAll?.('[data-notice-toggle], [data-saved-toggle]').forEach(button => button.remove());
  }

  function normalize(root = document) {
    ensureStyles();
    root.querySelectorAll?.('details').forEach(freezeDetails);
    if (root.matches?.('details')) freezeDetails(root);
    expandLegacyCustomDisclosures(root);
  }

  function scheduleNormalize(delays = [0, 80, 260]) {
    delays.forEach(delay => window.setTimeout(() => normalize(document), delay));
  }

  function guardInteractiveDisclosure(event) {
    const summary = event.target.closest?.('summary');
    const details = summary?.parentElement;
    if (!details || details.tagName !== 'DETAILS' || isOptionalDisclosure(details)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    freezeDetails(details);
  }

  function init() {
    normalize(document);
    scheduleNormalize([0, 60, 180, 500]);

    document.addEventListener('click', event => {
      guardInteractiveDisclosure(event);
      scheduleNormalize([0, 70, 240, 800]);
    }, true);

    document.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      guardInteractiveDisclosure(event);
    }, true);

    document.addEventListener('change', () => scheduleNormalize([0, 120, 500, 1500]), true);
    window.addEventListener('evidenta:shellready', () => scheduleNormalize([0, 80, 300]));
    window.addEventListener('load', () => scheduleNormalize([0, 100, 400]), { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

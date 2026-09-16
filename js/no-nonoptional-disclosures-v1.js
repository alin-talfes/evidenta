(() => {
  'use strict';

  if (window.__EVIDENTA_NO_NONOPTIONAL_DISCLOSURES_V1__) return;
  window.__EVIDENTA_NO_NONOPTIONAL_DISCLOSURES_V1__ = true;

  const OPTIONAL_DETAILS_SELECTOR = [
    'details.ev-mobile-advanced-details',
    '.ev-optional-tools details',
    'details[data-ev-optional="true"]'
  ].join(',');

  let normalizeQueued = false;

  function isOptionalDisclosure(details) {
    return details.matches?.(OPTIONAL_DETAILS_SELECTOR) || Boolean(details.closest?.('.ev-optional-tools'));
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
    root.querySelectorAll?.('details').forEach(freezeDetails);
    if (root.matches?.('details')) freezeDetails(root);
    expandLegacyCustomDisclosures(root);
  }

  function queueNormalize() {
    if (normalizeQueued) return;
    normalizeQueued = true;
    queueMicrotask(() => {
      normalizeQueued = false;
      normalize(document);
    });
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

    document.addEventListener('click', event => {
      guardInteractiveDisclosure(event);
      queueNormalize();
    }, true);

    document.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      guardInteractiveDisclosure(event);
    }, true);

    document.addEventListener('change', queueNormalize, true);
    window.addEventListener('evidenta:shellready', queueNormalize);
    window.addEventListener('load', queueNormalize, { once: true });
  }

  window.EvidentaDisclosurePolicy = Object.freeze({ normalize, freezeDetails });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

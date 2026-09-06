(function(root){
'use strict';

const DATE_SELECTOR = '.date-masked, #birthDate, #startDate, #receivedDate, .d-start, .d-end';

function formatDateValue(value){
  let val = String(value ?? '').replace(/\D/g, '');
  if (val.length > 8) val = val.slice(0, 8);
  let formatted = '';
  if (val.length > 0) formatted += val.substring(0, 2);
  if (val.length >= 3) formatted += '.' + val.substring(2, 4);
  if (val.length >= 5) formatted += '.' + val.substring(4, 8);
  return formatted;
}

function applyDateMask(event){
  const input = event.target;
  input.value = formatDateValue(input.value);
}

function decorateDateInput(input){
  if (!(input instanceof HTMLInputElement) || !input.matches(DATE_SELECTOR)) return;
  input.classList.add('date-masked');
  input.inputMode = 'numeric';
  input.maxLength = 10;
  input.autocomplete = 'off';
  input.enterKeyHint = 'next';
}

function decorateAll(rootNode){
  if (!rootNode?.querySelectorAll) return;
  rootNode.querySelectorAll(DATE_SELECTOR).forEach(decorateDateInput);
}

function init(){
  decorateAll(document);
  document.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement && event.target.matches(DATE_SELECTOR)) applyDateMask(event);
  });
  document.addEventListener('focusin', event => {
    if (event.target instanceof HTMLInputElement && event.target.matches(DATE_SELECTOR)) decorateDateInput(event.target);
  });
  new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node instanceof HTMLInputElement) decorateDateInput(node);
      decorateAll(node);
    }));
  }).observe(document.body, { childList:true, subtree:true });
}

root.AIDateMask = { formatDateValue };
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
}
})(typeof window !== 'undefined' ? window : globalThis);

(function(root){
'use strict';

let sourceFiles = [];
let previewObjectUrl = '';
const SOURCE_RX = /^(.+?)\s+—\s+(pagina\s+(\d+)|imagine)\b/i;

function parseSourceReference(value){
  const text = String(value || '').trim();
  const match = text.match(SOURCE_RX);
  if (!match) return null;
  return {
    fileName: match[1].trim(),
    kind: /^pagina/i.test(match[2]) ? 'pdf-page' : 'image',
    page: match[3] ? Number(match[3]) : null,
    sourceText: text
  };
}

function rememberFiles(fileList){
  sourceFiles = [...(fileList || [])];
}

function findFile(name){
  return sourceFiles.find(file => file.name === name) || null;
}

function cleanupObjectUrl(){
  if (!previewObjectUrl) return;
  URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = '';
}

function closeDialog(dialog){
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  cleanupObjectUrl();
}

function ensureDialog(){
  let dialog = document.getElementById('aiSourceDialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'aiSourceDialog';
  dialog.className = 'ai-source-dialog';
  dialog.setAttribute('aria-labelledby','aiSourceDialogTitle');
  dialog.innerHTML = `
    <div class="ai-source-dialog-shell">
      <div class="ai-source-dialog-head">
        <div><span class="ai-source-dialog-kicker">Sursă document</span><h2 id="aiSourceDialogTitle">Previzualizare</h2></div>
        <button type="button" class="btn btn-outline btn-sm" data-source-close aria-label="Închide previzualizarea">ÎNCHIDE</button>
      </div>
      <div id="aiSourceDialogStatus" class="ai-source-dialog-status" aria-live="polite"></div>
      <div id="aiSourceDialogViewer" class="ai-source-dialog-viewer"></div>
      <div class="ai-source-dialog-excerpt"><strong>Fragment extras</strong><p id="aiSourceDialogExcerpt"></p></div>
    </div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('[data-source-close]').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener('close', cleanupObjectUrl);
  return dialog;
}

function setDialogContent(reference, message){
  const dialog = ensureDialog();
  dialog.querySelector('#aiSourceDialogTitle').textContent = reference.kind === 'pdf-page'
    ? `${reference.fileName} · pagina ${reference.page}`
    : reference.fileName;
  dialog.querySelector('#aiSourceDialogStatus').textContent = message || '';
  dialog.querySelector('#aiSourceDialogExcerpt').textContent = reference.sourceText;
  dialog.querySelector('#aiSourceDialogViewer').replaceChildren();
  return dialog;
}

async function renderPdfPage(file, pageNo, viewer){
  const pdfjsLib = await root.AIDocumentDependencies?.ensurePdf?.();
  if (!pdfjsLib) throw new Error('PDF.js nu este disponibil pentru previzualizare.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data:bytes }).promise;
  try {
    if (!Number.isInteger(pageNo) || pageNo < 1 || pageNo > pdf.numPages) throw new Error(`Pagina ${pageNo} nu există în document.`);
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale:1.7 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browserul nu poate reda pagina PDF.');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.className = 'ai-source-preview-canvas';
    await page.render({ canvasContext:ctx, viewport }).promise;
    viewer.replaceChildren(canvas);
    page.cleanup?.();
  } finally {
    await pdf.destroy();
  }
}

function renderImage(file, viewer){
  cleanupObjectUrl();
  previewObjectUrl = URL.createObjectURL(file);
  const image = document.createElement('img');
  image.className = 'ai-source-preview-image';
  image.alt = `Previzualizare ${file.name}`;
  image.src = previewObjectUrl;
  viewer.replaceChildren(image);
}

async function openSourcePreview(sourceText){
  const reference = parseSourceReference(sourceText);
  if (!reference) return;
  cleanupObjectUrl();
  const dialog = setDialogContent(reference, 'Se pregătește documentul-sursă…');
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open','');

  const viewer = dialog.querySelector('#aiSourceDialogViewer');
  const status = dialog.querySelector('#aiSourceDialogStatus');
  const file = findFile(reference.fileName);
  if (!file) {
    status.textContent = 'Fișierul original nu mai este disponibil în selecția curentă. Fragmentul textual rămâne afișat mai jos.';
    return;
  }

  try {
    if (reference.kind === 'pdf-page') await renderPdfPage(file, reference.page, viewer);
    else renderImage(file, viewer);
    status.textContent = reference.kind === 'pdf-page'
      ? `Pagina ${reference.page} din documentul încărcat.`
      : 'Imaginea originală încărcată.';
  } catch (error) {
    status.textContent = error?.message || String(error);
  }
}

function sourceButton(sourceText){
  const reference = parseSourceReference(sourceText);
  if (!reference) return null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-outline btn-sm ai-source-preview-btn';
  button.textContent = 'VEZI SURSA';
  button.dataset.sourcePreview = reference.sourceText;
  button.setAttribute('aria-label', reference.kind === 'pdf-page'
    ? `Vezi ${reference.fileName}, pagina ${reference.page}`
    : `Vezi imaginea ${reference.fileName}`);
  return button;
}

function enhanceSourceElement(element){
  if (!(element instanceof HTMLElement) || element.dataset.sourcePreviewEnhanced === 'true') return;
  const text = element.textContent?.trim() || '';
  const button = sourceButton(text);
  if (!button) return;
  element.dataset.sourcePreviewEnhanced = 'true';
  const actions = document.createElement('div');
  actions.className = 'ai-source-actions';
  actions.appendChild(button);
  element.appendChild(actions);
}

function scanSources(rootNode=document){
  rootNode.querySelectorAll?.('.ai-evidence-item p, td.ai-source').forEach(enhanceSourceElement);
}

function init(){
  const input = document.getElementById('fileInput');
  const drop = document.getElementById('dropZone');
  const clear = document.getElementById('clearBtn');

  input?.addEventListener('change', event => rememberFiles(event.target.files));
  drop?.addEventListener('drop', event => rememberFiles(event.dataTransfer?.files));
  clear?.addEventListener('click', () => {
    sourceFiles = [];
    closeDialog(document.getElementById('aiSourceDialog'));
  });

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-source-preview]');
    if (!button) return;
    void openSourcePreview(button.dataset.sourcePreview || '');
  });

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('.ai-evidence-item p, td.ai-source')) enhanceSourceElement(node);
        scanSources(node);
      });
    }
  });
  observer.observe(document.getElementById('ai-main') || document.body, { childList:true, subtree:true });
  scanSources();
}

root.AISourcePreview = { parseSourceReference, openSourcePreview };
document.addEventListener('DOMContentLoaded', init, { once:true });
})(typeof window !== 'undefined' ? window : globalThis);
(function(){
'use strict';

const state = { files: [], analysis: null };
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const asInt = value => { const n = Number(value); return Number.isSafeInteger(n) && n >= 0 ? n : 0; };

function setStatus(text, progress){
  $('statusText').textContent = text || '';
  if (Number.isFinite(progress)) $('progressBar').style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function renderFiles(){
  $('fileList').innerHTML = state.files.map((file, i) => `<div class="ai-file"><span>${esc(file.name)}</span><span>${Math.round(file.size/1024)} KB · ${i+1}/${state.files.length}</span></div>`).join('');
}

function setFiles(files){
  const accepted = [...files].filter(file => file.type === 'application/pdf' || file.type.startsWith('image/'));
  const tooLarge = accepted.filter(file => file.size > 25 * 1024 * 1024);
  state.files = accepted.filter(file => file.size <= 25 * 1024 * 1024).slice(0, 20);
  renderFiles();
  if (tooLarge.length) setStatus('Unele fișiere depășesc limita ALPHA de 25 MB/fișier și au fost ignorate.', 0);
  else setStatus(state.files.length ? `${state.files.length} fișier(e) selectat(e).` : '', 0);
}

async function ocrSource(source, label, baseProgress, spanProgress){
  if (!window.Tesseract) throw new Error('Motorul OCR nu s-a încărcat. Verifică conexiunea la internet și reîncarcă pagina.');
  const result = await Tesseract.recognize(source, 'ron', {
    logger: msg => {
      if (msg.status === 'recognizing text' && Number.isFinite(msg.progress)) {
        setStatus(`OCR: ${label} — ${Math.round(msg.progress*100)}%`, baseProgress + msg.progress * spanProgress);
      }
    }
  });
  return result?.data?.text || '';
}

async function extractPdf(file, fileIndex, totalFiles){
  if (!window.pdfjsLib) throw new Error('Motorul PDF nu s-a încărcat. Verifică conexiunea la internet și reîncarcă pagina.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const tc = await page.getTextContent();
    const nativeText = tc.items.map(item => item.str).join(' ').replace(/\s+/g,' ').trim();
    const base = ((fileIndex + (pageNo-1)/pdf.numPages) / totalFiles) * 100;
    const span = 100 / totalFiles / pdf.numPages;
    let text = nativeText;
    let mode = 'text';
    if (nativeText.length < 80) {
      const viewport = page.getViewport({ scale: 1.8 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently:true });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext:ctx, viewport }).promise;
      text = await ocrSource(canvas, `${file.name}, pagina ${pageNo}`, base, span);
      mode = 'OCR';
      canvas.width = canvas.height = 1;
    } else {
      setStatus(`Citire PDF: ${file.name}, pagina ${pageNo}/${pdf.numPages}`, base + span);
    }
    pages.push(`[${file.name} — pagina ${pageNo} — ${mode}]\n${text.trim()}`);
  }
  return pages.join('\n\n');
}

async function extractImage(file, fileIndex, totalFiles){
  const base = (fileIndex / totalFiles) * 100;
  const span = 100 / totalFiles;
  const text = await ocrSource(file, file.name, base, span);
  return `[${file.name} — OCR]\n${text.trim()}`;
}

async function extractAll(){
  if (!state.files.length) throw new Error('Selectează cel puțin un PDF sau o imagine.');
  const chunks = [];
  for (let i=0;i<state.files.length;i++) {
    const file = state.files[i];
    const text = file.type === 'application/pdf'
      ? await extractPdf(file, i, state.files.length)
      : await extractImage(file, i, state.files.length);
    chunks.push(text);
  }
  setStatus('Citirea documentului s-a încheiat.', 100);
  return chunks.join('\n\n====================\n\n');
}

function confidenceBadge(value){
  const cls = value === 'ridicat' ? 'ridicat' : value === 'mediu' ? 'mediu' : 'scăzut';
  return `<span class="ai-confidence ${cls}">${esc(value || 'scăzut')}</span>`;
}

function renderEvidence(items){
  const card = $('evidenceCard');
  if (!items?.length) { card.classList.add('ai-hidden'); return; }
  $('evidenceList').innerHTML = items.map(item => `<div class="ai-evidence-item"><div class="ai-inline"><strong>${esc(item.label)}: ${esc(item.value)}</strong>${confidenceBadge(item.confidence)}</div><p>${esc(item.source)}</p></div>`).join('');
  card.classList.remove('ai-hidden');
}

function penaltyRow(data={}){
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input class="p-y" type="number" min="0" value="${asInt(data.years)}"></td>
    <td><input class="p-m" type="number" min="0" value="${asInt(data.months)}"></td>
    <td><input class="p-d" type="number" min="0" value="${asInt(data.days)}"></td>
    <td><select class="p-group"><option value="ignore">Ignoră</option><option value="concurs">Concurs</option><option value="recidiva">Recidivă</option><option value="revocare">Revocare/rest</option><option value="litb">Art. 129 alin. (2) lit. b)</option></select></td>
    <td class="ai-source">${esc(data.source || 'Adăugat manual')}</td>
    <td><button type="button" class="btn btn-danger btn-sm p-remove" aria-label="Șterge pedeapsa">X</button></td>`;
  tr.querySelector('.p-group').value = data.group || 'ignore';
  tr.querySelector('.p-remove').addEventListener('click', () => tr.remove());
  return tr;
}

function deductionRow(data={}){
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input class="d-start" type="text" placeholder="zz.ll.aaaa" value="${esc(data.start || '')}"></td>
    <td><input class="d-end" type="text" placeholder="zz.ll.aaaa" value="${esc(data.end || '')}"></td>
    <td class="ai-source">${esc(data.source || 'Adăugat manual')}</td>
    <td><button type="button" class="btn btn-danger btn-sm d-remove" aria-label="Șterge deducerea">X</button></td>`;
  tr.querySelector('.d-remove').addEventListener('click', () => tr.remove());
  return tr;
}

function populateReview(analysis){
  state.analysis = analysis;
  $('birthDate').value = analysis.birthDate || '';
  $('startDate').value = analysis.startDate || '';
  $('receivedDate').value = '';
  $('article').value = analysis.article || '';
  $('lifeSentence').checked = Boolean(analysis.life);
  $('finalYears').value = analysis.finalSentence?.years || 0;
  $('finalMonths').value = analysis.finalSentence?.months || 0;
  $('finalDays').value = analysis.finalSentence?.days || 0;
  $('penaltyRows').innerHTML = '';
  (analysis.penalties || []).forEach(item => $('penaltyRows').appendChild(penaltyRow(item)));
  $('deductionRows').innerHTML = '';
  (analysis.deductions || []).forEach(item => $('deductionRows').appendChild(deductionRow(item)));
  $('warningList').innerHTML = (analysis.warnings || []).map(w => `<div class="ai-warning">${esc(w)}</div>`).join('');
  $('reviewCard').classList.remove('ai-hidden');
  $('resultCard').classList.add('ai-hidden');
  renderEvidence(analysis.evidence || []);
}

function analyzeRawText(){
  const text = $('rawText').value.trim();
  if (!text) { setStatus('Nu există text de analizat.', 0); return; }
  const analysis = AIDocumentCore.analyzeDocument(text);
  populateReview(analysis);
  setStatus('Analiza automată s-a încheiat. Verifică datele înainte de calcul.', 100);
  $('reviewCard').scrollIntoView({ behavior:'smooth', block:'start' });
}

function readPenaltyGroups(){
  const groups = { concurs:[], recidiva:[], revocare:[], litb:[] };
  document.querySelectorAll('#penaltyRows tr').forEach(row => {
    const group = row.querySelector('.p-group').value;
    if (group === 'ignore') return;
    const years = asInt(row.querySelector('.p-y').value), months = asInt(row.querySelector('.p-m').value), days = asInt(row.querySelector('.p-d').value);
    const totalDays = ContopiriCore.toDays(years, months, days);
    if (totalDays > 0) groups[group].push({ years, months, days, totalDays });
  });
  return groups;
}

function groupCount(groups){ return Object.values(groups).reduce((sum, arr) => sum + arr.length, 0); }

function readDeductions(){
  const intervals = [];
  document.querySelectorAll('#deductionRows tr').forEach(row => {
    const a = parseDate(row.querySelector('.d-start').value.trim());
    const b = parseDate(row.querySelector('.d-end').value.trim());
    if (a && b && b >= a) intervals.push([a,b]);
  });
  return intervals;
}

function fractionLabel(ratio){
  const known = [[1/100,'1/100'],[1/4,'1/4'],[1/3,'1/3'],[1/2,'1/2'],[2/3,'2/3'],[3/4,'3/4']];
  const found = known.find(([value]) => Math.abs(value-ratio) < 1e-9);
  return found ? found[1] : String(ratio);
}

function resultItem(label, value, wide=false){ return `<div class="ai-result${wide?' wide':''}"><span>${esc(label)}</span><strong>${value}</strong></div>`; }

function calculateReviewed(){
  const errorBox = $('calcError'); errorBox.classList.add('ai-hidden'); errorBox.textContent='';
  try {
    const life = $('lifeSentence').checked;
    const art = $('article').value;
    const birthDate = parseDate($('birthDate').value.trim());
    const startDate = parseDate($('startDate').value.trim());
    const sex = $('sex').value;
    const groups = readPenaltyGroups();
    let contopire = null;
    let duration = { years:asInt($('finalYears').value), months:asInt($('finalMonths').value), days:asInt($('finalDays').value) };
    if (groupCount(groups)) {
      contopire = ContopiriCore.calculate(groups);
      duration = contopire.finalDuration;
    }
    if (!life && !(duration.years || duration.months || duration.days)) throw new Error('Pedeapsa rezultantă este zero. Verifică pedeapsa identificată sau categoriile din Contopiri.');
    if (!life && !startDate) throw new Error('Completează data începerii executării pentru calculul pedepsei.');

    let theorExp = null, realExp = null, totalDays = null, ded = 0, schedule = null;
    const deductions = readDeductions();
    if (!life) {
      theorExp = addCalendarSafe(startDate, duration.years, duration.months, duration.days);
      theorExp.setDate(theorExp.getDate()-1);
      totalDays = daysBetween(startDate, theorExp)+1;
      ded = sumIntervals(deductions);
      if (ded > totalDays) throw new Error('Deducerile identificate depășesc durata pedepsei. Verifică perioadele.');
      realExp = new Date(theorExp); realExp.setDate(realExp.getDate()-ded);
    } else {
      totalDays = 7305;
      ded = sumIntervals(deductions);
    }

    const warnings = [];
    if (contopire) {
      const manualDays = ContopiriCore.toDays(asInt($('finalYears').value), asInt($('finalMonths').value), asInt($('finalDays').value));
      if (manualDays && manualDays !== contopire.finalDays) warnings.push(`NECONCORDANȚĂ: pedeapsa rezultantă introdusă/identificată (${ContopiriCore.formatDuration(ContopiriCore.fromDays(manualDays))}) nu coincide cu rezultatul motorului Contopiri (${ContopiriCore.formatDuration(contopire.finalDuration)}). Pentru calculele de mai jos a fost utilizat rezultatul motorului Contopiri.`);
    }

    if (art && birthDate && startDate) {
      const sentenceOver10 = !life && (duration.years*12 + duration.months + duration.days/30) > 120;
      schedule = calculateLiberationSchedule({ life, art, sentenceOver10, totalDays, birthDate, startDate, currentSex:sex, theorExp, dedDays:ded, nonExecDays:0 });
      if (schedule.error) warnings.push(`LC: ${schedule.error}`);
    } else {
      warnings.push('Fracțiile LC nu au fost calculate: sunt necesare articolul/configurația IMSweb, data nașterii și data începerii executării.');
    }

    const received = parseDate($('receivedDate').value.trim());
    let quarantineEnd = null;
    if (received) { quarantineEnd = new Date(received); quarantineEnd.setDate(quarantineEnd.getDate()+20); }

    const items = [];
    if (contopire) {
      items.push(resultItem('Pedeapsă rezultată — motor Contopiri', esc(ContopiriCore.formatDuration(contopire.finalDuration)), true));
      if (contopire.bonusDays) items.push(resultItem('Spor concurs calculat', `${contopire.bonusDays} zile`));
    } else if (!life) items.push(resultItem('Pedeapsă utilizată', `${duration.years} ani, ${duration.months} luni, ${duration.days} zile`, true));
    if (life) items.push(resultItem('Pedeapsă', 'Detențiune pe viață', true));
    if (!life) {
      items.push(resultItem('Mandat total', `${totalDays} zile`));
      items.push(resultItem('Zile deduse', `${ded} zile`));
      items.push(resultItem('Expirare teoretică', fmtDate(theorExp)));
      items.push(resultItem('Expirare reală', fmtDate(realExp)));
    } else items.push(resultItem('Zile deduse', `${ded} zile`));
    if (schedule && !schedule.error) {
      items.push(resultItem('Fracție obligatorie', `${life ? 'prag' : fractionLabel(schedule.mR)} · ${schedule.mDays} zile · ${fmtDate(schedule.mDate)}`, true));
      items.push(resultItem('Fracție totală / propozabilă', `${life ? 'prag' : fractionLabel(schedule.tR)} · ${schedule.tDays} zile · ${fmtDate(schedule.tDate)}`, true));
      items.push(resultItem('Regulă utilizată', esc(schedule.articleInfo || art), true));
    }
    if (quarantineEnd) items.push(resultItem('Carantină 21 zile', fmtDate(quarantineEnd)));

    const ids = state.analysis?.identifiers || {};
    if (ids.mandate || ids.sentence || ids.decision) {
      items.push(resultItem('Identificatori document', esc([ids.mandate&&`MEPI/mandat: ${ids.mandate}`,ids.sentence&&`SP: ${ids.sentence}`,ids.decision&&`DP: ${ids.decision}`].filter(Boolean).join(' · ')), true));
    }

    $('resultContent').innerHTML = `${warnings.map(w => `<div class="ai-warning">${esc(w)}</div>`).join('')}<div class="ai-result-grid">${items.join('')}</div><p class="ai-note ai-section-gap"><strong>Control:</strong> OCR-ul/extragerea nu generează formule juridice. Contopirea este calculată de <code>ContopiriCore</code>, iar fracțiile și datele LC de motorul comun din <code>rules.js</code>. Rezultatul rămâne în acest modul.</p>`;
    $('resultCard').classList.remove('ai-hidden');
    $('resultCard').scrollIntoView({ behavior:'smooth', block:'start' });
  } catch (err) {
    errorBox.textContent = err?.message || String(err);
    errorBox.classList.remove('ai-hidden');
  }
}

async function analyzeFiles(){
  $('analyzeFilesBtn').disabled = true;
  try {
    const text = await extractAll();
    $('rawText').value = text;
    analyzeRawText();
  } catch (err) {
    setStatus(err?.message || String(err), 0);
  } finally {
    $('analyzeFilesBtn').disabled = false;
  }
}

function resetAll(){
  state.files = []; state.analysis = null;
  $('fileInput').value=''; $('rawText').value=''; $('fileList').innerHTML=''; $('warningList').innerHTML='';
  $('penaltyRows').innerHTML=''; $('deductionRows').innerHTML=''; $('evidenceList').innerHTML=''; $('resultContent').innerHTML='';
  $('reviewCard').classList.add('ai-hidden'); $('resultCard').classList.add('ai-hidden'); $('evidenceCard').classList.add('ai-hidden');
  setStatus('',0);
}

function init(){
  const drop = $('dropZone');
  $('fileInput').addEventListener('change', e => setFiles(e.target.files));
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('dragover'); setFiles(e.dataTransfer.files); });
  $('analyzeFilesBtn').addEventListener('click', analyzeFiles);
  $('reanalyzeTextBtn').addEventListener('click', analyzeRawText);
  $('clearBtn').addEventListener('click', resetAll);
  $('addPenaltyBtn').addEventListener('click', () => $('penaltyRows').appendChild(penaltyRow()));
  $('addDeductionBtn').addEventListener('click', () => $('deductionRows').appendChild(deductionRow()));
  $('calculateBtn').addEventListener('click', calculateReviewed);
}

document.addEventListener('DOMContentLoaded', init, { once:true });
})();

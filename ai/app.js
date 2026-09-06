(function(){
'use strict';

const state = { files: [], analysis: null };
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 20;
const MAX_PDF_PAGES = 120;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png','image/jpeg','image/webp','image/bmp','image/tiff']);
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function setStatus(text, progress){
  $('statusText').textContent = text || '';
  if (Number.isFinite(progress)) $('progressBar').style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function acceptedKind(file){
  const name = String(file.name || '').toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (ACCEPTED_IMAGE_TYPES.has(file.type) || /\.(png|jpe?g|webp|bmp|tiff?)$/.test(name)) return 'image';
  return '';
}

function renderFiles(){
  $('fileList').innerHTML = state.files.map((entry, i) => `<div class="ai-file"><span>${esc(entry.file.name)}</span><span>${entry.kind.toUpperCase()} · ${Math.round(entry.file.size/1024)} KB · ${i+1}/${state.files.length}</span></div>`).join('');
}

function setFiles(files){
  const input = [...files];
  const unsupported = input.filter(file => !acceptedKind(file));
  const tooLarge = input.filter(file => acceptedKind(file) && file.size > MAX_FILE_BYTES);
  const accepted = input
    .map(file => ({ file, kind:acceptedKind(file) }))
    .filter(entry => entry.kind && entry.file.size <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES);
  state.files = accepted;
  renderFiles();
  const messages=[];
  if (unsupported.length) messages.push(`${unsupported.length} fișier(e) cu format neacceptat`);
  if (tooLarge.length) messages.push(`${tooLarge.length} fișier(e) peste 25 MB`);
  if (input.length > MAX_FILES) messages.push(`se procesează maximum ${MAX_FILES} fișiere`);
  if (messages.length) setStatus(`${messages.join(' · ')}.`, 0);
  else setStatus(state.files.length ? `${state.files.length} fișier(e) selectat(e).` : '', 0);
}

function nativeTextUsable(text){
  const value = String(text || '').trim();
  if (value.length < 80) return false;
  const letters = (value.match(/[A-Za-zĂÂÎȘȚăâîșț]/g) || []).length;
  const controls = (value.match(/[�□■]/g) || []).length;
  return letters / Math.max(1, value.length) >= 0.35 && controls < 4;
}

async function ocrSource(source, label, baseProgress, spanProgress){
  if (!window.AIDocumentDependencies) throw new Error('Controllerul de dependențe OCR nu este disponibil.');
  return AIDocumentDependencies.recognize(source, msg => {
    if (msg.status === 'recognizing text' && Number.isFinite(msg.progress)) {
      setStatus(`OCR: ${label} — ${Math.round(msg.progress*100)}%`, baseProgress + msg.progress * spanProgress);
    }
  });
}

async function extractPdf(file, fileIndex, totalFiles){
  const pdfjsLib = await AIDocumentDependencies.ensurePdf();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data:bytes }).promise;
  if (pdf.numPages > MAX_PDF_PAGES) {
    await pdf.destroy();
    throw new Error(`${file.name}: ${pdf.numPages} pagini. Limita ALPHA este ${MAX_PDF_PAGES} pagini/PDF.`);
  }
  const pages=[];
  try {
    for (let pageNo=1; pageNo<=pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const tc = await page.getTextContent();
      const nativeText = tc.items.map(item => item.str).join(' ').replace(/\s+/g,' ').trim();
      const base = ((fileIndex + (pageNo-1)/pdf.numPages) / totalFiles) * 100;
      const span = 100 / totalFiles / pdf.numPages;
      let text = nativeText;
      let mode = 'text';
      if (!nativeTextUsable(nativeText)) {
        const viewport = page.getViewport({ scale:1.8 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently:true });
        if (!ctx) throw new Error('Browserul nu a putut inițializa canvas-ul necesar OCR.');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext:ctx, viewport }).promise;
        text = await ocrSource(canvas, `${file.name}, pagina ${pageNo}`, base, span);
        mode = 'OCR';
        canvas.width = 1;
        canvas.height = 1;
      } else {
        setStatus(`Citire PDF: ${file.name}, pagina ${pageNo}/${pdf.numPages}`, base + span);
      }
      pages.push(`[${file.name} — pagina ${pageNo} — ${mode}]\n${String(text || '').trim()}`);
      page.cleanup?.();
    }
  } finally {
    await pdf.destroy();
  }
  return pages.join('\n\n');
}

async function extractImage(file, fileIndex, totalFiles){
  const base = (fileIndex / totalFiles) * 100;
  const span = 100 / totalFiles;
  const text = await ocrSource(file, file.name, base, span);
  return `[${file.name} — OCR]\n${String(text || '').trim()}`;
}

async function extractAll(){
  if (!state.files.length) throw new Error('Selectează cel puțin un PDF sau o imagine acceptată.');
  const chunks=[];
  for (let i=0;i<state.files.length;i++) {
    const entry=state.files[i];
    const text = entry.kind === 'pdf'
      ? await extractPdf(entry.file, i, state.files.length)
      : await extractImage(entry.file, i, state.files.length);
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
  const card=$('evidenceCard');
  if (!items?.length) { card.classList.add('ai-hidden'); return; }
  $('evidenceList').innerHTML = items.map(item => `<div class="ai-evidence-item"><div class="ai-inline"><strong>${esc(item.label)}: ${esc(item.value)}</strong>${confidenceBadge(item.confidence)}</div><p>${esc(item.source)}</p></div>`).join('');
  card.classList.remove('ai-hidden');
}

function inputInteger(input, label){
  const raw = String(input.value ?? '').trim();
  if (!/^\d+$/.test(raw)) throw new Error(`${label}: introdu un număr întreg pozitiv sau zero.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label}: valoare invalidă.`);
  return value;
}

function penaltyRow(data={}){
  const tr=document.createElement('tr');
  tr.innerHTML = `<td><input class="p-y" type="number" min="0" step="1" value="${Number.isSafeInteger(data.years)?data.years:0}"></td>
    <td><input class="p-m" type="number" min="0" step="1" value="${Number.isSafeInteger(data.months)?data.months:0}"></td>
    <td><input class="p-d" type="number" min="0" step="1" value="${Number.isSafeInteger(data.days)?data.days:0}"></td>
    <td><select class="p-group"><option value="ignore">Ignoră</option><option value="concurs">Concurs</option><option value="recidiva">Recidivă</option><option value="revocare">Revocare/rest</option><option value="litb">Art. 129 alin. (2) lit. b)</option></select></td>
    <td class="ai-source">${esc(data.source || 'Adăugat manual')}</td>
    <td><button type="button" class="btn btn-danger btn-sm p-remove" aria-label="Șterge pedeapsa">X</button></td>`;
  tr.querySelector('.p-group').value = data.group || 'ignore';
  tr.querySelector('.p-remove').addEventListener('click',()=>tr.remove());
  return tr;
}

function deductionRow(data={}){
  const tr=document.createElement('tr');
  tr.innerHTML = `<td><input class="d-start" type="text" inputmode="numeric" placeholder="zz.ll.aaaa" value="${esc(data.start || '')}"></td>
    <td><input class="d-end" type="text" inputmode="numeric" placeholder="zz.ll.aaaa" value="${esc(data.end || '')}"></td>
    <td class="ai-source">${esc(data.source || 'Adăugat manual')}</td>
    <td><button type="button" class="btn btn-danger btn-sm d-remove" aria-label="Șterge deducerea">X</button></td>`;
  tr.querySelector('.d-remove').addEventListener('click',()=>tr.remove());
  return tr;
}

function populateReview(analysis){
  state.analysis=analysis;
  $('birthDate').value=analysis.birthDate || '';
  $('startDate').value=analysis.startDate || '';
  $('receivedDate').value=analysis.receivedDate || '';
  $('article').value=analysis.article || '';
  $('lifeSentence').checked=Boolean(analysis.life);
  $('finalYears').value=analysis.finalSentence?.years || 0;
  $('finalMonths').value=analysis.finalSentence?.months || 0;
  $('finalDays').value=analysis.finalSentence?.days || 0;
  $('penaltyRows').innerHTML='';
  (analysis.penalties || []).forEach(item=>$('penaltyRows').appendChild(penaltyRow(item)));
  $('deductionRows').innerHTML='';
  (analysis.deductions || []).forEach(item=>$('deductionRows').appendChild(deductionRow(item)));
  $('warningList').innerHTML=(analysis.warnings || []).map(w=>`<div class="ai-warning">${esc(w)}</div>`).join('');
  $('confirmedData').checked=false;
  $('calculateBtn').disabled=true;
  $('reviewCard').classList.remove('ai-hidden');
  $('resultCard').classList.add('ai-hidden');
  renderEvidence(analysis.evidence || []);
}

function analyzeRawText(){
  const text=$('rawText').value.trim();
  if (!text) { setStatus('Nu există text de analizat.',0); return; }
  const analyzer = window.AIDocumentSafety?.analyze || window.AIDocumentCore?.analyzeDocument;
  if (!analyzer) { setStatus('Motorul de analiză nu este disponibil.',0); return; }
  populateReview(analyzer(text));
  setStatus('Analiza automată s-a încheiat. Verifică datele înainte de calcul.',100);
  $('reviewCard').scrollIntoView({behavior:'smooth',block:'start'});
}

function readPenaltyGroups(){
  const groups={concurs:[],recidiva:[],revocare:[],litb:[]};
  document.querySelectorAll('#penaltyRows tr').forEach((row,index)=>{
    const group=row.querySelector('.p-group').value;
    if (group==='ignore') return;
    const years=inputInteger(row.querySelector('.p-y'),`Pedeapsa ${index+1} — ani`);
    const months=inputInteger(row.querySelector('.p-m'),`Pedeapsa ${index+1} — luni`);
    const days=inputInteger(row.querySelector('.p-d'),`Pedeapsa ${index+1} — zile`);
    const totalDays=ContopiriCore.toDays(years,months,days);
    if (totalDays<=0) throw new Error(`Pedeapsa ${index+1}: cuantumul selectat pentru calcul este zero.`);
    groups[group].push({years,months,days,totalDays});
  });
  return groups;
}

function groupCount(groups){ return Object.values(groups).reduce((sum,arr)=>sum+arr.length,0); }

function readDeductions(){
  const intervals=[];
  document.querySelectorAll('#deductionRows tr').forEach((row,index)=>{
    const startRaw=row.querySelector('.d-start').value.trim();
    const endRaw=row.querySelector('.d-end').value.trim();
    if (!startRaw && !endRaw) return;
    if (!startRaw || !endRaw) throw new Error(`Deducerea ${index+1}: completează atât începutul, cât și sfârșitul.`);
    const a=parseDate(startRaw), b=parseDate(endRaw);
    if (!a || !b) throw new Error(`Deducerea ${index+1}: dată invalidă. Folosește formatul zz.ll.aaaa.`);
    if (b<a) throw new Error(`Deducerea ${index+1}: sfârșitul nu poate preceda începutul.`);
    intervals.push([a,b]);
  });
  return intervals;
}

function fractionLabel(ratio){
  const known=[[1/100,'1/100'],[1/4,'1/4'],[1/3,'1/3'],[1/2,'1/2'],[2/3,'2/3'],[3/4,'3/4']];
  const found=known.find(([value])=>Math.abs(value-ratio)<1e-9);
  return found?found[1]:String(ratio);
}

function resultItem(label,value,wide=false){ return `<div class="ai-result${wide?' wide':''}"><span>${esc(label)}</span><strong>${value}</strong></div>`; }

function readManualDuration(){
  return {
    years:inputInteger($('finalYears'),'Pedeapsa rezultantă — ani'),
    months:inputInteger($('finalMonths'),'Pedeapsa rezultantă — luni'),
    days:inputInteger($('finalDays'),'Pedeapsa rezultantă — zile')
  };
}

function validateLegalInputs({life,art,birthDate,startDate,receivedDate}){
  if (art) {
    const lifeArticles=new Set(['NCP99','VCP551']);
    if (life && !lifeArticles.has(art)) throw new Error('Detențiunea pe viață necesită o configurație compatibilă: NCP art. 99 sau VCP art. 55¹.');
    if (!life && lifeArticles.has(art)) throw new Error('Configurația selectată este pentru detențiune pe viață, dar opțiunea „Detențiune pe viață” nu este bifată.');
  }
  if (birthDate && startDate && birthDate>=startDate) throw new Error('Data nașterii trebuie să fie anterioară datei începerii executării.');
  if (receivedDate && startDate && receivedDate<startDate) throw new Error('Data primirii în penitenciar/centru nu poate preceda data începerii executării introdusă.');
}

function calculateReviewed(){
  const errorBox=$('calcError');
  errorBox.classList.add('ai-hidden'); errorBox.textContent='';
  try {
    if (!$('confirmedData').checked) throw new Error('Confirmă că ai verificat datele față de documentul-sursă înainte de calcul.');
    const life=$('lifeSentence').checked;
    const art=$('article').value;
    const birthDate=parseDate($('birthDate').value.trim());
    const startDate=parseDate($('startDate').value.trim());
    const receivedDate=parseDate($('receivedDate').value.trim());
    const sex=$('sex').value;
    validateLegalInputs({life,art,birthDate,startDate,receivedDate});

    const groups=readPenaltyGroups();
    let contopire=null;
    const manualDuration=readManualDuration();
    let duration={...manualDuration};
    if (groupCount(groups)) {
      contopire=ContopiriCore.calculate(groups);
      duration=contopire.finalDuration;
    }
    if (!life && !(duration.years||duration.months||duration.days)) throw new Error('Pedeapsa rezultantă este zero. Verifică pedeapsa identificată sau categoriile din Contopiri.');
    if (!startDate) throw new Error('Completează data începerii executării pentru calcul.');

    let theorExp=null, realExp=null, totalDays=null, ded=0, schedule=null;
    const deductions=readDeductions();
    if (!life) {
      theorExp=addCalendarSafe(startDate,duration.years,duration.months,duration.days);
      theorExp.setDate(theorExp.getDate()-1);
      totalDays=daysBetween(startDate,theorExp)+1;
      ded=sumIntervals(deductions);
      if (ded>totalDays) throw new Error('Deducerile depășesc durata pedepsei. Verifică perioadele.');
      realExp=new Date(theorExp); realExp.setDate(realExp.getDate()-ded);
    } else {
      totalDays=7305;
      ded=sumIntervals(deductions);
    }

    const warnings=[];
    if (state.analysis?.conflicts && Object.values(state.analysis.conflicts).some(Boolean)) {
      warnings.push('Documentul a avut conflicte de extragere. Calculul folosește exclusiv valorile pe care le-ai verificat/confirmat în formular.');
    }
    if (contopire) {
      const manualDays=ContopiriCore.toDays(manualDuration.years,manualDuration.months,manualDuration.days);
      if (manualDays && manualDays!==contopire.finalDays) warnings.push(`NECONCORDANȚĂ: pedeapsa rezultantă introdusă/identificată (${ContopiriCore.formatDuration(ContopiriCore.fromDays(manualDays))}) nu coincide cu rezultatul motorului Contopiri (${ContopiriCore.formatDuration(contopire.finalDuration)}). Pentru calculele de mai jos a fost utilizat rezultatul motorului Contopiri.`);
    }

    if (art && birthDate) {
      const sentenceOver10=!life && (duration.years*12+duration.months+duration.days/30)>120;
      schedule=calculateLiberationSchedule({life,art,sentenceOver10,totalDays,birthDate,startDate,currentSex:sex,theorExp,dedDays:ded,nonExecDays:0});
      if (schedule.error) warnings.push(`LC: ${schedule.error}`);
    } else {
      warnings.push('Fracțiile LC nu au fost calculate: sunt necesare articolul/configurația IMSweb și data nașterii.');
    }

    let quarantineEnd=null;
    if (receivedDate) { quarantineEnd=new Date(receivedDate); quarantineEnd.setDate(quarantineEnd.getDate()+20); }

    const items=[];
    if (contopire) {
      items.push(resultItem('Pedeapsă rezultată — motor Contopiri',esc(ContopiriCore.formatDuration(contopire.finalDuration)),true));
      if (contopire.bonusDays) items.push(resultItem('Spor concurs calculat',`${contopire.bonusDays} zile`));
      if (contopire.litbQuarterDays) items.push(resultItem('Spor minim art. 129 alin. (2) lit. b)',`${contopire.litbQuarterDays} zile`));
    } else if (!life) items.push(resultItem('Pedeapsă utilizată',`${duration.years} ani, ${duration.months} luni, ${duration.days} zile`,true));
    if (life) items.push(resultItem('Pedeapsă','Detențiune pe viață',true));
    if (!life) {
      items.push(resultItem('Mandat total',`${totalDays} zile`));
      items.push(resultItem('Zile deduse',`${ded} zile`));
      items.push(resultItem('Expirare teoretică',fmtDate(theorExp)));
      items.push(resultItem('Expirare reală',fmtDate(realExp)));
    } else items.push(resultItem('Zile deduse',`${ded} zile`));
    if (schedule && !schedule.error) {
      items.push(resultItem('Fracție obligatorie',`${life?'prag':fractionLabel(schedule.mR)} · ${schedule.mDays} zile · ${fmtDate(schedule.mDate)}`,true));
      items.push(resultItem('Fracție totală / propozabilă',`${life?'prag':fractionLabel(schedule.tR)} · ${schedule.tDays} zile · ${fmtDate(schedule.tDate)}`,true));
      items.push(resultItem('Regulă utilizată',esc(schedule.articleInfo||art),true));
    }
    if (quarantineEnd) items.push(resultItem('Carantină 21 zile',fmtDate(quarantineEnd)));

    const ids=state.analysis?.identifiers || {};
    if (ids.mandate||ids.sentence||ids.decision) {
      items.push(resultItem('Identificatori document',esc([ids.mandate&&`MEPI/mandat: ${ids.mandate}`,ids.sentence&&`SP: ${ids.sentence}`,ids.decision&&`DP: ${ids.decision}`].filter(Boolean).join(' · ')),true));
    }
    if (state.analysis?.documentTypes?.length) items.push(resultItem('Tipuri document detectate',esc(state.analysis.documentTypes.join(' · ')),true));

    $('resultContent').innerHTML=`${warnings.map(w=>`<div class="ai-warning">${esc(w)}</div>`).join('')}<div class="ai-result-grid">${items.join('')}</div><p class="ai-note ai-section-gap"><strong>Control:</strong> OCR-ul/extragerea nu generează formule juridice. Contopirea este calculată de <code>ContopiriCore</code>, iar fracțiile și datele LC de motorul comun din <code>rules.js</code>. Rezultatul rămâne în acest modul.</p>`;
    $('resultCard').classList.remove('ai-hidden');
    $('resultCard').scrollIntoView({behavior:'smooth',block:'start'});
  } catch (err) {
    errorBox.textContent=err?.message || String(err);
    errorBox.classList.remove('ai-hidden');
  }
}

async function analyzeFiles(){
  $('analyzeFilesBtn').disabled=true;
  try {
    const text=await extractAll();
    $('rawText').value=text;
    analyzeRawText();
  } catch (err) {
    setStatus(err?.message || String(err),0);
  } finally {
    $('analyzeFilesBtn').disabled=false;
  }
}

async function resetAll(){
  state.files=[]; state.analysis=null;
  $('fileInput').value=''; $('rawText').value=''; $('fileList').innerHTML=''; $('warningList').innerHTML='';
  $('penaltyRows').innerHTML=''; $('deductionRows').innerHTML=''; $('evidenceList').innerHTML=''; $('resultContent').innerHTML='';
  $('reviewCard').classList.add('ai-hidden'); $('resultCard').classList.add('ai-hidden'); $('evidenceCard').classList.add('ai-hidden');
  $('confirmedData').checked=false; $('calculateBtn').disabled=true;
  setStatus('',0);
  await window.AIDocumentDependencies?.terminateOcr?.();
}

function init(){
  const drop=$('dropZone');
  $('fileInput').addEventListener('change',e=>setFiles(e.target.files));
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');setFiles(e.dataTransfer.files);});
  $('analyzeFilesBtn').addEventListener('click',analyzeFiles);
  $('reanalyzeTextBtn').addEventListener('click',analyzeRawText);
  $('clearBtn').addEventListener('click',()=>{void resetAll();});
  $('addPenaltyBtn').addEventListener('click',()=>$('penaltyRows').appendChild(penaltyRow()));
  $('addDeductionBtn').addEventListener('click',()=>$('deductionRows').appendChild(deductionRow()));
  $('confirmedData').addEventListener('change',e=>{$('calculateBtn').disabled=!e.target.checked;});
  $('calculateBtn').addEventListener('click',calculateReviewed);
}

document.addEventListener('DOMContentLoaded',init,{once:true});
})();

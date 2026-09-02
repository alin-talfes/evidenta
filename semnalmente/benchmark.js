import {
  CALIBRATION_TRAITS,
  TRAIT_LABELS,
  REFERENCE_OPTIONS,
  unpackCalibrationPayload,
  validateCalibrationRecord,
  computeCalibrationReport,
  computeVersionReports,
  computeQualityReports,
  buildCalibrationBundle,
  predictionFromAnalysis,
  calibrationRecordFromAnalysis,
} from './calibration-metrics.js';
import {
  featuresFromAnalysis,
  computeInterRaterReport,
  computeErrorHotspots,
  computeThresholdCandidates,
  buildAdvancedCalibrationReport,
} from './advanced-calibration.js';

const $ = id => document.getElementById(id);
let records = [];
let report = null;
let advancedReport = null;
let toastTimer = null;
let loadedAnalysis = null;

function showToast(message, error = false) {
  const toast = $('toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast visible${error ? ' error' : ''}`;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—';
}

function formatKappa(value) {
  return Number.isFinite(value) ? value.toFixed(3) : '—';
}

function metricClass(value) {
  if (!Number.isFinite(value)) return '';
  if (value >= 0.85) return 'metric-good';
  if (value >= 0.70) return 'metric-mid';
  return 'metric-low';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function ensureAdvancedUi() {
  if (!document.querySelector('link[data-advanced-benchmark]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'advanced-benchmark.css';
    link.dataset.advancedBenchmark = 'true';
    document.head.appendChild(link);
  }
  const summary = document.querySelector('.summary-grid');
  if (summary && !$('metric-kappa')) {
    const card = document.createElement('article');
    card.className = 'metric-card';
    card.innerHTML = '<span>Kappa inter-evaluator</span><strong id="metric-kappa">—</strong><small id="metric-rater-pairs">fără evaluări pereche</small>';
    summary.appendChild(card);
  }
  if ($('rater-table-body')) return;
  const matrixPanel = document.querySelector('.matrix-panel');
  if (!matrixPanel) return;

  const diagnosticGrid = document.createElement('div');
  diagnosticGrid.className = 'benchmark-two-column advanced-diagnostics';
  diagnosticGrid.innerHTML = `
    <section class="panel" aria-labelledby="rater-heading">
      <p class="section-kicker">CONSISTENȚĂ UMANĂ</p>
      <h2 id="rater-heading">Acord inter-evaluatori</h2>
      <p class="section-copy">Cohen's kappa este calculat separat pentru fiecare pereche de evaluatori și categorie. Un kappa absent poate însemna date insuficiente sau distribuție degenerată.</p>
      <div class="table-scroll"><table class="benchmark-table compact"><thead><tr><th>Evaluatori</th><th>Categorie</th><th>N</th><th>Acord</th><th>Kappa</th></tr></thead><tbody id="rater-table-body"></tbody></table></div>
    </section>
    <section class="panel" aria-labelledby="hotspot-heading">
      <p class="section-kicker">DIAGNOSTIC ERORI</p>
      <h2 id="hotspot-heading">Hotspot-uri de clasificare</h2>
      <p class="section-copy" id="hotspot-summary"></p>
      <div class="table-scroll"><table class="benchmark-table compact"><thead><tr><th>Categorie</th><th>Referință</th><th>Predicție</th><th>N</th><th>Din erori</th></tr></thead><tbody id="hotspot-table-body"></tbody></table></div>
    </section>`;
  matrixPanel.insertAdjacentElement('afterend', diagnosticGrid);

  const thresholdPanel = document.createElement('section');
  thresholdPanel.className = 'panel threshold-panel';
  thresholdPanel.setAttribute('aria-labelledby', 'threshold-heading');
  thresholdPanel.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="section-kicker">CALIBRARE EXPLORATORIE</p>
        <h2 id="threshold-heading">Praguri candidate</h2>
        <p>Compară pragurile actuale cu praguri candidate calculate numai din lotul de calibrare. Propunerile nu modifică automat motorul și trebuie validate ulterior pe un lot independent.</p>
      </div>
    </div>
    <div class="table-scroll"><table class="benchmark-table"><thead><tr><th>Categorie</th><th>N</th><th>Prag actual</th><th>Candidat</th><th>F1 actual</th><th>F1 candidat</th><th>Δ F1</th><th>Status</th></tr></thead><tbody id="threshold-table-body"></tbody></table></div>`;
  diagnosticGrid.insertAdjacentElement('afterend', thresholdPanel);
}

function renderReferenceForm() {
  const grid = $('reference-grid');
  grid.replaceChildren();
  for (const trait of CALIBRATION_TRAITS) {
    const label = document.createElement('label');
    label.className = 'reference-field';
    label.textContent = TRAIT_LABELS[trait] || trait;
    const select = document.createElement('select');
    select.dataset.trait = trait;
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— necompletat —';
    select.appendChild(blank);
    for (const optionValue of REFERENCE_OPTIONS[trait] || []) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    }
    label.appendChild(select);
    grid.appendChild(label);
  }
}

function resetBuilder() {
  loadedAnalysis = null;
  $('analysis-file').value = '';
  $('builder-case-id').value = '';
  $('builder-blinded').checked = false;
  $('reference-grid').querySelectorAll('select').forEach(select => { select.value = ''; });
  $('builder-form').hidden = true;
  $('builder-state').textContent = 'Nu este încărcat niciun export Semnalmente.';
}

async function loadAnalysisFile(file) {
  if (!file) return;
  try {
    const analysis = await readJsonFile(file);
    const prediction = predictionFromAnalysis(analysis);
    if (!prediction) throw new Error('Fișierul nu pare a fi un export Semnalmente compatibil.');
    loadedAnalysis = analysis;
    $('builder-form').hidden = false;
    const features = featuresFromAnalysis(analysis);
    $('builder-state').textContent = `Predicție încărcată: motor ${analysis.engineVersion || 'necunoscut'}. Valorile automate sunt ascunse în formular. ${features ? `${Object.keys(features).length} metrici numerice disponibile pentru analiza pragurilor.` : 'Exportul nu conține metrici numerice pentru analiza pragurilor.'}`;
    showToast('Export Semnalmente încărcat pentru calibrare.');
  } catch (error) {
    loadedAnalysis = null;
    $('builder-form').hidden = true;
    $('builder-state').textContent = error.message;
    showToast(error.message, true);
  }
}

function addCalibrationCase() {
  if (!loadedAnalysis) return showToast('Încarcă mai întâi un export Semnalmente.', true);
  const caseId = $('builder-case-id').value.trim();
  if (!caseId) return showToast('Completează un caseId pseudonimizat.', true);
  if (records.some(record => record?.caseId === caseId)) return showToast('Acest caseId există deja în set.', true);
  const reference = {};
  $('reference-grid').querySelectorAll('select[data-trait]').forEach(select => {
    if (select.value) reference[select.dataset.trait] = select.value;
  });
  if (!Object.keys(reference).length) return showToast('Completează cel puțin o etichetă de referință.', true);
  const blinded = $('builder-blinded').checked;
  const record = calibrationRecordFromAnalysis(loadedAnalysis, {
    caseId,
    reference,
    referenceMeta: {
      blindedToPrediction: blinded,
      enteredAt: new Date().toISOString(),
      method: 'manual-reference-entry',
    },
  });
  if (!record) return showToast('Cazul nu a putut fi construit.', true);
  const features = featuresFromAnalysis(loadedAnalysis);
  if (features) record.features = features;
  records.push(record);
  render();
  resetBuilder();
  showToast(`Cazul ${caseId} a fost adăugat setului.`);
}

async function readJsonFile(file) {
  if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') throw new Error(`${file.name}: formatul nu este JSON.`);
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: fișierul depășește 10 MB.`);
  const text = await file.text();
  try { return JSON.parse(text); } catch { throw new Error(`${file.name}: JSON invalid.`); }
}

async function ingestFiles(files) {
  const incoming = [];
  const errors = [];
  for (const file of files) {
    try {
      const payload = await readJsonFile(file);
      const items = unpackCalibrationPayload(payload);
      if (!items.length) throw new Error(`${file.name}: nu conține cazuri de calibrare recunoscute.`);
      incoming.push(...items);
    } catch (error) {
      errors.push(error.message);
    }
  }
  records.push(...incoming);
  render();
  if (incoming.length) showToast(`${incoming.length} caz${incoming.length === 1 ? '' : 'uri'} încărcat${incoming.length === 1 ? '' : 'e'}.`);
  if (errors.length) showToast(errors.join(' '), true);
}

function renderSummary() {
  $('metric-cases').textContent = report.cases;
  $('metric-invalid').textContent = `${report.invalidCount} invalide`;
  $('metric-micro').textContent = formatPercent(report.microAccuracy);
  $('metric-macro').textContent = formatPercent(report.macroAccuracy);
  $('metric-f1').textContent = formatPercent(report.macroF1);
  $('metric-coverage').textContent = formatPercent(report.coverage);
  $('metric-abstentions').textContent = `${report.totalAbstentions} abstention`;
  const inter = advancedReport?.interRater;
  $('metric-kappa').textContent = formatKappa(inter?.macroKappa);
  $('metric-rater-pairs').textContent = inter?.pairCount ? `${inter.pairCount} perechi · ${inter.comparisons} comparații` : 'fără evaluări pereche';
}

function renderTraitTable() {
  const tbody = $('trait-table-body');
  tbody.replaceChildren();
  for (const trait of CALIBRATION_TRAITS) {
    const item = report.perTrait[trait];
    if (!item.eligible) continue;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(item.label)}</strong></td>
      <td>${item.eligible}</td>
      <td>${item.correct}</td>
      <td>${item.abstentions}</td>
      <td class="${metricClass(item.coverage)}">${formatPercent(item.coverage)}</td>
      <td class="${metricClass(item.accuracy)}">${formatPercent(item.accuracy)}</td>
      <td class="${metricClass(item.conditionalAccuracy)}">${formatPercent(item.conditionalAccuracy)}</td>
      <td class="${metricClass(item.macroF1)}">${formatPercent(item.macroF1)}</td>`;
    tbody.appendChild(row);
  }
}

function availableMatrixTraits() {
  return CALIBRATION_TRAITS.filter(trait => report.perTrait[trait].eligible > 0);
}

function renderMatrixSelector() {
  const select = $('matrix-trait');
  const previous = select.value;
  select.replaceChildren();
  for (const trait of availableMatrixTraits()) {
    const option = document.createElement('option');
    option.value = trait;
    option.textContent = TRAIT_LABELS[trait] || trait;
    select.appendChild(option);
  }
  if ([...select.options].some(option => option.value === previous)) select.value = previous;
  renderMatrix();
}

function renderMatrix() {
  const trait = $('matrix-trait').value;
  const container = $('matrix-container');
  container.replaceChildren();
  if (!trait) {
    container.textContent = 'Nu există date pentru matrice.';
    return;
  }
  const item = report.perTrait[trait];
  const keys = Object.keys(item.confusion);
  const table = document.createElement('table');
  table.className = 'benchmark-table confusion-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>Referință ↓ / Predicție →</th>' + keys.map(key => `<th>${escapeHtml(item.labels[key] || key)}</th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const reference of keys) {
    const row = document.createElement('tr');
    const cells = [`<td><strong>${escapeHtml(item.labels[reference] || reference)}</strong></td>`];
    for (const prediction of keys) {
      const value = item.confusion[reference][prediction] || 0;
      const klass = value ? (reference === prediction ? 'confusion-hit' : 'confusion-error') : '';
      cells.push(`<td class="${klass}">${value}</td>`);
    }
    row.innerHTML = cells.join('');
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderGroupTable(tbodyId, groups) {
  const tbody = $(tbodyId);
  tbody.replaceChildren();
  const entries = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], 'ro'));
  if (!entries.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">Fără date.</td>';
    tbody.appendChild(row);
    return;
  }
  for (const [name, item] of entries) {
    const row = document.createElement('tr');
    row.innerHTML = `<td><strong>${escapeHtml(name)}</strong></td><td>${item.cases}</td><td class="${metricClass(item.microAccuracy)}">${formatPercent(item.microAccuracy)}</td><td class="${metricClass(item.coverage)}">${formatPercent(item.coverage)}</td><td class="${metricClass(item.macroF1)}">${formatPercent(item.macroF1)}</td>`;
    tbody.appendChild(row);
  }
}

function renderInterRater() {
  const tbody = $('rater-table-body');
  tbody.replaceChildren();
  const pairs = advancedReport?.interRater?.pairs || {};
  let rows = 0;
  for (const [pairName, pair] of Object.entries(pairs)) {
    for (const item of Object.values(pair.perTrait || {})) {
      if (!item.n) continue;
      rows += 1;
      const row = document.createElement('tr');
      row.innerHTML = `<td><strong>${escapeHtml(pairName)}</strong></td><td>${escapeHtml(item.label)}</td><td>${item.n}</td><td>${formatPercent(item.agreement)}</td><td>${formatKappa(item.kappa)}</td>`;
      tbody.appendChild(row);
    }
  }
  if (!rows) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">Nu există încă două evaluări independente pentru aceleași cazuri. Câmpul opțional <code>ratings</code> din schema de calibrare activează această analiză.</td>';
    tbody.appendChild(row);
  }
}

function renderHotspots() {
  const tbody = $('hotspot-table-body');
  tbody.replaceChildren();
  const hotspots = advancedReport?.hotspots;
  const items = hotspots?.misclassifications || [];
  if (!items.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">Nu există erori de clasificare suficiente pentru diagnostic.</td>';
    tbody.appendChild(row);
  } else {
    for (const item of items) {
      const row = document.createElement('tr');
      row.innerHTML = `<td><strong>${escapeHtml(item.label)}</strong></td><td>${escapeHtml(item.reference)}</td><td>${escapeHtml(item.prediction)}</td><td>${item.count}</td><td>${formatPercent(item.shareOfTraitErrors)}</td>`;
      tbody.appendChild(row);
    }
  }
  const summary = $('hotspot-summary');
  const lowTraits = (hotspots?.lowPerformingTraits || []).slice(0, 3);
  const abstentions = (hotspots?.abstentions || []).slice(0, 3);
  const parts = [];
  if (lowTraits.length) parts.push(`Cele mai slabe categorii: ${lowTraits.map(item => `${item.label} (${formatPercent(item.accuracy)})`).join('; ')}.`);
  if (abstentions.length) parts.push(`Cele mai multe abstention: ${abstentions.map(item => `${item.label} (${formatPercent(item.rate)})`).join('; ')}.`);
  summary.textContent = parts.join(' ') || 'Nu există încă suficiente erori pentru a identifica un tipar repetabil.';
}

function thresholdText(values) {
  return Array.isArray(values) && values.length ? values.map(value => Number(value).toFixed(4)).join(' / ') : '—';
}

function renderThresholdCandidates() {
  const tbody = $('threshold-table-body');
  tbody.replaceChildren();
  const entries = Object.values(advancedReport?.thresholdCandidates || {});
  for (const item of entries) {
    const row = document.createElement('tr');
    const statusLabel = item.status === 'candidate' ? 'Candidat' : item.status === 'no-improvement' ? 'Fără câștig' : 'Date insuficiente';
    const statusClass = item.status === 'candidate' ? 'proposal-candidate' : item.status === 'no-improvement' ? 'proposal-stable' : 'proposal-insufficient';
    row.innerHTML = `
      <td><strong>${escapeHtml(item.label)}</strong></td>
      <td>${item.n}</td>
      <td>${thresholdText(item.currentThresholds)}</td>
      <td>${thresholdText(item.candidateThresholds)}</td>
      <td>${formatPercent(item.currentMacroF1)}</td>
      <td>${formatPercent(item.candidateMacroF1)}</td>
      <td>${formatPercent(item.macroF1Delta)}</td>
      <td><span class="proposal-status ${statusClass}">${statusLabel}</span></td>`;
    tbody.appendChild(row);
  }
}

function renderIntegrity() {
  const target = $('integrity-content');
  target.replaceChildren();
  const issues = [];
  if (report.invalidCount) issues.push(`${report.invalidCount} înregistrări invalide structural.`);
  if (report.duplicateIds.length) issues.push(`caseId duplicate: ${report.duplicateIds.join(', ')}.`);
  const unblinded = records.filter(record => validateCalibrationRecord(record).valid && record.referenceMeta && record.referenceMeta.blindedToPrediction === false).length;
  if (unblinded) issues.push(`${unblinded} caz${unblinded === 1 ? '' : 'uri'} marcat${unblinded === 1 ? '' : 'e'} ca neblindat${unblinded === 1 ? '' : 'e'} față de predicție.`);
  const emptyTraits = CALIBRATION_TRAITS.filter(trait => report.perTrait[trait].eligible === 0);
  if (emptyTraits.length) issues.push(`Fără referințe pentru: ${emptyTraits.map(trait => TRAIT_LABELS[trait]).join(', ')}.`);
  const featureRecords = records.filter(record => record?.features && typeof record.features === 'object').length;
  if (!featureRecords) issues.push('Niciun caz nu conține metrici numerice `features`; propunerile de praguri nu pot fi calculate pe setul curent.');
  if (!issues.length) {
    const ok = document.createElement('p');
    ok.className = 'integrity-ok';
    ok.textContent = 'Nu au fost identificate probleme structurale evidente în setul încărcat.';
    target.appendChild(ok);
    return;
  }
  const list = document.createElement('ul');
  list.className = 'integrity-list';
  for (const issue of issues) {
    const li = document.createElement('li');
    li.textContent = issue;
    list.appendChild(li);
  }
  target.appendChild(list);
}

function render() {
  const validCount = records.filter(record => validateCalibrationRecord(record).valid).length;
  $('dataset-status').textContent = records.length ? `${records.length} înregistrări încărcate; ${validCount} valide structural.` : 'Niciun caz încărcat.';
  $('btn-clear-dataset').disabled = !records.length;
  $('btn-export-report').disabled = !validCount;
  $('benchmark-results').hidden = !records.length;
  if (!records.length) { report = null; advancedReport = null; return; }

  report = computeCalibrationReport(records);
  advancedReport = buildAdvancedCalibrationReport(records, report);
  renderSummary();
  renderTraitTable();
  renderMatrixSelector();
  renderInterRater();
  renderHotspots();
  renderThresholdCandidates();
  renderGroupTable('version-table-body', computeVersionReports(records));
  renderGroupTable('quality-table-body', computeQualityReports(records));
  renderIntegrity();
}

function downloadReport() {
  if (!report) return;
  const bundle = buildCalibrationBundle(records);
  bundle.advanced = advancedReport || {
    interRater: computeInterRaterReport(records),
    hotspots: computeErrorHotspots(report),
    thresholdCandidates: computeThresholdCandidates(records),
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `semnalmente_benchmark_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function initTheme() {
  const key = 'descriere-semnalmente-theme';
  const saved = localStorage.getItem(key);
  const preferred = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = preferred;
  $('btn-theme').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(key, next);
  });
}

function init() {
  initTheme();
  ensureAdvancedUi();
  const input = $('benchmark-files');
  const drop = $('benchmark-drop');
  renderReferenceForm();
  const analysisInput = $('analysis-file');
  $('btn-load-analysis').addEventListener('click', () => analysisInput.click());
  analysisInput.addEventListener('change', () => { loadAnalysisFile(analysisInput.files?.[0]); });
  $('btn-add-calibration-case').addEventListener('click', addCalibrationCase);
  $('btn-reset-builder').addEventListener('click', resetBuilder);
  $('btn-load-dataset').addEventListener('click', () => input.click());
  input.addEventListener('change', () => { ingestFiles([...input.files]); input.value = ''; });
  $('btn-clear-dataset').addEventListener('click', () => { records = []; render(); });
  $('btn-export-report').addEventListener('click', downloadReport);
  $('matrix-trait').addEventListener('change', renderMatrix);
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); } });
  drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('dragover'); ingestFiles([...event.dataTransfer.files]); });
  render();
}

init();

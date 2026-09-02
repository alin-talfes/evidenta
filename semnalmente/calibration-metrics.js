export const CALIBRATION_TRAITS = Object.freeze([
  'frunte',
  'nasProfil',
  'nasLatime',
  'ochiCuloare',
  'ochiMarime',
  'guraColturi',
  'guraMarime',
  'barbie',
  'tipFata',
  'parCuloare',
  'parTextura',
  'calvitie',
  'spranceneForma',
  'spranceneDensitate',
  'barba',
  'mustata',
]);

export const TRAIT_LABELS = Object.freeze({
  frunte: 'Frunte',
  nasProfil: 'Nas — profil',
  nasLatime: 'Nas — lățime',
  ochiCuloare: 'Ochi — culoare',
  ochiMarime: 'Ochi — mărime',
  guraColturi: 'Gură — colțuri',
  guraMarime: 'Gură — mărime',
  barbie: 'Bărbie',
  tipFata: 'Tipul feței',
  parCuloare: 'Păr — culoare',
  parTextura: 'Păr — textură',
  calvitie: 'Calviție',
  spranceneForma: 'Sprâncene — formă',
  spranceneDensitate: 'Sprâncene — densitate',
  barba: 'Barbă',
  mustata: 'Mustață',
});

export const REFERENCE_OPTIONS = Object.freeze({
  frunte: ['Îngustă', 'Mijlocie', 'Lată'],
  nasProfil: ['Rectiliniu', 'Convex', 'Concav'],
  nasLatime: ['Îngust', 'Mijlociu', 'Lat'],
  ochiCuloare: ['Negri', 'Căprui', 'Verzi', 'Albaștri', 'Cenușii', 'Heterocromie'],
  ochiMarime: ['Mici', 'Mijlocii', 'Mari'],
  guraColturi: ['Colțuri ridicate', 'Liniare', 'Colțuri coborâte'],
  guraMarime: ['Mică', 'Mijlocie', 'Mare'],
  barbie: ['Ascuțită', 'Normală', 'Lată / plată'],
  tipFata: ['Ovală', 'Rotundă', 'Pătrată', 'Dreptunghiulară', 'Triunghiulară', 'Romboidă'],
  parCuloare: ['Negru', 'Șaten', 'Blond', 'Cărunt'],
  parTextura: ['Drept / neted', 'Ondulat / texturat', 'Creț / foarte texturat'],
  calvitie: ['Absentă', 'Frontală', 'Prezentă / extinsă'],
  spranceneForma: ['Drepte', 'Arcuite'],
  spranceneDensitate: ['Rare / slab vizibile', 'Medii', 'Dese'],
  barba: ['Fără barbă', 'Barbă scurtă / rară', 'Barbă medie', 'Barbă deasă'],
  mustata: ['Fără mustață', 'Mustață subțire / rară', 'Mustață groasă'],
});

function getNested(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

export function predictionFromAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return null;
  const source = analysis.automaticResults && typeof analysis.automaticResults === 'object'
    ? analysis.automaticResults
    : analysis;
  const mapping = {
    frunte: 'frunte.tip',
    nasProfil: 'nas.tip',
    nasLatime: 'nas.latime',
    ochiCuloare: 'ochi.culoare',
    ochiMarime: 'ochi.marime',
    guraColturi: 'gura.colturi',
    guraMarime: 'gura.marime',
    barbie: 'barbie.tip',
    tipFata: 'tipFata.tip',
    parCuloare: 'par.culoare',
    parTextura: 'par.textura',
    calvitie: 'par.calvitie',
    spranceneForma: 'sprancene.0',
    spranceneDensitate: 'sprancene.1',
    barba: 'barba',
    mustata: 'mustata',
  };
  const prediction = {};
  for (const [trait, path] of Object.entries(mapping)) {
    const value = cleanLabel(getNested(source, path));
    if (value) prediction[trait] = value;
  }
  return Object.keys(prediction).length ? prediction : null;
}

export function calibrationRecordFromAnalysis(analysis, { caseId, reference, referenceMeta = null } = {}) {
  const prediction = predictionFromAnalysis(analysis);
  const cleanCaseId = typeof caseId === 'string' ? caseId.trim() : '';
  if (!prediction || !cleanCaseId || !reference || typeof reference !== 'object') return null;
  return {
    caseId: cleanCaseId,
    engineVersion: cleanLabel(analysis.engineVersion) || 'necunoscut',
    reference: Object.fromEntries(Object.entries(reference).filter(([, value]) => cleanLabel(value)).map(([key, value]) => [key, cleanLabel(value)])),
    prediction,
    quality: analysis.calitate || analysis.quality || null,
    referenceMeta: referenceMeta || undefined,
  };
}

function cleanLabel(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed || null;
}

function canonicalLabel(value) {
  const cleaned = cleanLabel(value);
  return cleaned ? cleaned.toLocaleLowerCase('ro-RO') : null;
}

function canonicalTraitLabel(trait, value) {
  const normalized = canonicalLabel(value);
  if (!normalized) return null;
  const aliases = {
    ochiCuloare: {
      'posibilă heterocromie — de verificat': 'heterocromie',
    },
    calvitie: {
      'fără indicii clare de calviție': 'absentă',
      'posibilă calviție frontală — de verificat': 'frontală',
      'posibilă calviție — de verificat': 'prezentă / extinsă',
    },
    barba: {
      'fără indicii clare de barbă': 'fără barbă',
    },
    mustata: {
      'fără indicii clare de mustață': 'fără mustață',
    },
  };
  return aliases[trait]?.[normalized] || normalized;
}

function isAbstention(value) {
  const normalized = canonicalLabel(value);
  if (!normalized) return true;
  return normalized.startsWith('nedeterm') || normalized.startsWith('neclasificat');
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function unpackCalibrationPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.cases)) return payload.cases;
  if (payload.caseId && payload.reference && payload.prediction) return [payload];
  return [];
}

export function validateCalibrationRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { valid: false, errors: ['Înregistrarea nu este un obiect JSON.'] };
  }
  if (typeof record.caseId !== 'string' || !record.caseId.trim()) errors.push('caseId lipsește sau este invalid.');
  if (!record.reference || typeof record.reference !== 'object' || Array.isArray(record.reference)) errors.push('reference lipsește sau este invalid.');
  if (!record.prediction || typeof record.prediction !== 'object' || Array.isArray(record.prediction)) errors.push('prediction lipsește sau este invalid.');
  return { valid: errors.length === 0, errors };
}

function computeClassMetrics(confusion, classes) {
  const metrics = {};
  for (const label of classes) {
    const tp = confusion[label]?.[label] || 0;
    let fp = 0;
    let fn = 0;
    for (const referenceLabel of classes) {
      if (referenceLabel !== label) fp += confusion[referenceLabel]?.[label] || 0;
    }
    for (const predictedLabel of classes) {
      if (predictedLabel !== label) fn += confusion[label]?.[predictedLabel] || 0;
    }
    const precision = tp + fp ? tp / (tp + fp) : null;
    const recall = tp + fn ? tp / (tp + fn) : null;
    const f1 = precision !== null && recall !== null && precision + recall
      ? 2 * precision * recall / (precision + recall)
      : null;
    metrics[label] = {
      support: Object.values(confusion[label] || {}).reduce((sum, value) => sum + value, 0),
      precision: round(precision),
      recall: round(recall),
      f1: round(f1),
    };
  }
  return metrics;
}

function computeTraitReport(records, trait) {
  let eligible = 0;
  let correct = 0;
  let abstentions = 0;
  const rawPairs = [];
  const referenceDisplay = new Map();
  const predictionDisplay = new Map();

  for (const record of records) {
    const referenceRaw = cleanLabel(record.reference?.[trait]);
    if (!referenceRaw) continue;
    eligible += 1;
    const reference = canonicalTraitLabel(trait, referenceRaw);
    referenceDisplay.set(reference, referenceRaw);

    const predictionRaw = cleanLabel(record.prediction?.[trait]);
    if (isAbstention(predictionRaw)) {
      abstentions += 1;
      rawPairs.push({ reference, prediction: '__abstain__' });
      predictionDisplay.set('__abstain__', 'Nedeterminat / abstention');
      continue;
    }

    const prediction = canonicalTraitLabel(trait, predictionRaw);
    predictionDisplay.set(prediction, predictionRaw);
    rawPairs.push({ reference, prediction });
    if (reference === prediction) correct += 1;
  }

  const allKeys = new Set();
  for (const pair of rawPairs) {
    allKeys.add(pair.reference);
    allKeys.add(pair.prediction);
  }
  const keys = [...allKeys].sort((a, b) => a.localeCompare(b, 'ro'));
  const confusion = {};
  for (const reference of keys) {
    confusion[reference] = {};
    for (const prediction of keys) confusion[reference][prediction] = 0;
  }
  for (const pair of rawPairs) confusion[pair.reference][pair.prediction] += 1;

  const metricClasses = keys.filter(key => key !== '__abstain__');
  const classMetrics = computeClassMetrics(confusion, metricClasses);
  const f1Values = Object.values(classMetrics).map(item => item.f1).filter(Number.isFinite);

  const labels = {};
  for (const key of keys) labels[key] = referenceDisplay.get(key) || predictionDisplay.get(key) || key;

  return {
    trait,
    label: TRAIT_LABELS[trait] || trait,
    eligible,
    correct,
    errors: Math.max(eligible - correct - abstentions, 0),
    abstentions,
    coverage: eligible ? round((eligible - abstentions) / eligible) : null,
    accuracy: eligible ? round(correct / eligible) : null,
    conditionalAccuracy: eligible - abstentions ? round(correct / (eligible - abstentions)) : null,
    macroF1: f1Values.length ? round(f1Values.reduce((sum, value) => sum + value, 0) / f1Values.length) : null,
    labels,
    confusion,
    classMetrics,
  };
}

export function computeCalibrationReport(records, traits = CALIBRATION_TRAITS) {
  const validRecords = [];
  const invalidRecords = [];
  const seenIds = new Set();
  const duplicateIds = [];

  records.forEach((record, index) => {
    const validation = validateCalibrationRecord(record);
    if (!validation.valid) {
      invalidRecords.push({ index, caseId: record?.caseId || null, errors: validation.errors });
      return;
    }
    const caseId = record.caseId.trim();
    if (seenIds.has(caseId)) duplicateIds.push(caseId);
    seenIds.add(caseId);
    validRecords.push(record);
  });

  const perTrait = Object.fromEntries(traits.map(trait => [trait, computeTraitReport(validRecords, trait)]));
  const reportsWithData = Object.values(perTrait).filter(report => report.eligible > 0);
  const totalEligible = reportsWithData.reduce((sum, report) => sum + report.eligible, 0);
  const totalCorrect = reportsWithData.reduce((sum, report) => sum + report.correct, 0);
  const totalAbstentions = reportsWithData.reduce((sum, report) => sum + report.abstentions, 0);
  const accuracies = reportsWithData.map(report => report.accuracy).filter(Number.isFinite);
  const macroF1s = reportsWithData.map(report => report.macroF1).filter(Number.isFinite);

  return {
    generatedAt: new Date().toISOString(),
    cases: validRecords.length,
    invalidCount: invalidRecords.length,
    invalidRecords,
    duplicateIds: [...new Set(duplicateIds)],
    totalEligible,
    totalCorrect,
    totalAbstentions,
    microAccuracy: totalEligible ? round(totalCorrect / totalEligible) : null,
    macroAccuracy: accuracies.length ? round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length) : null,
    macroF1: macroF1s.length ? round(macroF1s.reduce((sum, value) => sum + value, 0) / macroF1s.length) : null,
    coverage: totalEligible ? round((totalEligible - totalAbstentions) / totalEligible) : null,
    perTrait,
  };
}

function groupBy(records, selector) {
  const groups = new Map();
  for (const record of records) {
    const key = selector(record) || 'necunoscut';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return groups;
}

export function computeVersionReports(records, traits = CALIBRATION_TRAITS) {
  const groups = groupBy(records.filter(record => validateCalibrationRecord(record).valid), record => cleanLabel(record.engineVersion) || 'necunoscut');
  return Object.fromEntries([...groups.entries()].map(([version, items]) => [version, computeCalibrationReport(items, traits)]));
}

export function computeQualityReports(records, traits = CALIBRATION_TRAITS) {
  const groups = groupBy(records.filter(record => validateCalibrationRecord(record).valid), record => {
    return cleanLabel(record.quality?.frontal?.grade)
      || cleanLabel(record.quality?.grade)
      || cleanLabel(record.qualityGrade)
      || 'necunoscut';
  });
  return Object.fromEntries([...groups.entries()].map(([grade, items]) => [grade, computeCalibrationReport(items, traits)]));
}

export function buildCalibrationBundle(records) {
  const valid = records.filter(record => validateCalibrationRecord(record).valid);
  return {
    format: 'semnalmente-calibration-bundle',
    exportedAt: new Date().toISOString(),
    count: valid.length,
    records: valid,
    report: computeCalibrationReport(valid),
    byEngineVersion: computeVersionReports(valid),
    byQuality: computeQualityReports(valid),
  };
}

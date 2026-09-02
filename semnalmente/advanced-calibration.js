import { THRESHOLDS } from './classifier-rules.js';
import { CALIBRATION_TRAITS, TRAIT_LABELS, validateCalibrationRecord } from './calibration-metrics.js';

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
    ochiCuloare: { 'posibilă heterocromie — de verificat': 'heterocromie' },
    calvitie: {
      'fără indicii clare de calviție': 'absentă',
      'posibilă calviție frontală — de verificat': 'frontală',
      'posibilă calviție — de verificat': 'prezentă / extinsă',
    },
    barba: { 'fără indicii clare de barbă': 'fără barbă' },
    mustata: { 'fără indicii clare de mustață': 'fără mustață' },
  };
  return aliases[trait]?.[normalized] || normalized;
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function getSource(analysis) {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return null;
  return analysis.automaticResults && typeof analysis.automaticResults === 'object'
    ? analysis.automaticResults
    : analysis;
}

export function featuresFromAnalysis(analysis) {
  const source = getSource(analysis);
  if (!source) return null;
  const features = {
    frunte: finiteOrNull(source.frunte?.raportLatime),
    nasProfil: finiteOrNull(source.nas?.curburaProfil),
    nasLatime: finiteOrNull(source.nas?.raportLatime),
    ochiMarime: finiteOrNull(source.ochi?.raportOchi),
    guraColturi: finiteOrNull(source.gura?.inclinareColturi),
    guraMarime: finiteOrNull(source.gura?.raportGura),
    barbie: finiteOrNull(source.barbie?.raportConicitate),
    calvitie: finiteOrNull(source.par?.acoperirePar),
  };
  const filtered = Object.fromEntries(Object.entries(features).filter(([, value]) => Number.isFinite(value)));
  return Object.keys(filtered).length ? filtered : null;
}

export function computeCohenKappa(labelPairs) {
  const pairs = (labelPairs || [])
    .map(pair => Array.isArray(pair) ? [canonicalLabel(pair[0]), canonicalLabel(pair[1])] : [null, null])
    .filter(([a, b]) => a && b);
  const n = pairs.length;
  if (!n) return { n: 0, agreement: null, expectedAgreement: null, kappa: null, degenerate: false };

  let agreements = 0;
  const countA = new Map();
  const countB = new Map();
  for (const [a, b] of pairs) {
    if (a === b) agreements += 1;
    countA.set(a, (countA.get(a) || 0) + 1);
    countB.set(b, (countB.get(b) || 0) + 1);
  }
  const labels = new Set([...countA.keys(), ...countB.keys()]);
  const observed = agreements / n;
  let expected = 0;
  for (const label of labels) expected += ((countA.get(label) || 0) / n) * ((countB.get(label) || 0) / n);
  const denominator = 1 - expected;
  const degenerate = Math.abs(denominator) < 1e-12;
  const kappa = degenerate ? null : (observed - expected) / denominator;
  return {
    n,
    agreement: round(observed),
    expectedAgreement: round(expected),
    kappa: round(kappa),
    degenerate,
  };
}

function ratingsFromRecord(record) {
  const source = Array.isArray(record?.ratings)
    ? record.ratings
    : Array.isArray(record?.referenceMeta?.ratings)
      ? record.referenceMeta.ratings
      : [];
  return source.filter(item => item && typeof item === 'object' && (item.labels || item.reference));
}

export function computeInterRaterReport(records, traits = CALIBRATION_TRAITS) {
  const buckets = new Map();
  const usableRecords = (records || []).filter(record => validateCalibrationRecord(record).valid);
  for (const record of usableRecords) {
    const ratings = ratingsFromRecord(record);
    for (let i = 0; i < ratings.length; i += 1) {
      for (let j = i + 1; j < ratings.length; j += 1) {
        const left = ratings[i];
        const right = ratings[j];
        const leftId = cleanLabel(left.raterId) || `R${i + 1}`;
        const rightId = cleanLabel(right.raterId) || `R${j + 1}`;
        const ordered = leftId.localeCompare(rightId, 'ro') <= 0
          ? [{ id: leftId, rating: left }, { id: rightId, rating: right }]
          : [{ id: rightId, rating: right }, { id: leftId, rating: left }];
        const pairKey = `${ordered[0].id} ↔ ${ordered[1].id}`;
        if (!buckets.has(pairKey)) buckets.set(pairKey, Object.fromEntries(traits.map(trait => [trait, []])));
        const traitBuckets = buckets.get(pairKey);
        for (const trait of traits) {
          const a = canonicalTraitLabel(trait, ordered[0].rating.labels?.[trait] ?? ordered[0].rating.reference?.[trait]);
          const b = canonicalTraitLabel(trait, ordered[1].rating.labels?.[trait] ?? ordered[1].rating.reference?.[trait]);
          if (a && b) traitBuckets[trait].push([a, b]);
        }
      }
    }
  }

  const pairs = {};
  let totalComparisons = 0;
  let weightedAgreements = 0;
  const kappas = [];
  for (const [pairKey, traitBuckets] of buckets.entries()) {
    const perTrait = {};
    for (const trait of traits) {
      const metric = computeCohenKappa(traitBuckets[trait]);
      perTrait[trait] = { trait, label: TRAIT_LABELS[trait] || trait, ...metric };
      if (metric.n) {
        totalComparisons += metric.n;
        weightedAgreements += metric.agreement * metric.n;
        if (Number.isFinite(metric.kappa)) kappas.push(metric.kappa);
      }
    }
    pairs[pairKey] = { pair: pairKey, perTrait };
  }

  return {
    pairCount: Object.keys(pairs).length,
    comparisons: totalComparisons,
    observedAgreement: totalComparisons ? round(weightedAgreements / totalComparisons) : null,
    macroKappa: kappas.length ? round(kappas.reduce((sum, value) => sum + value, 0) / kappas.length) : null,
    pairs,
  };
}

export function computeErrorHotspots(report, limit = 12) {
  if (!report?.perTrait) return { misclassifications: [], abstentions: [], lowRecall: [], lowPerformingTraits: [] };
  const misclassifications = [];
  const abstentions = [];
  const lowRecall = [];
  const lowPerformingTraits = [];

  for (const [trait, item] of Object.entries(report.perTrait)) {
    if (!item?.eligible) continue;
    lowPerformingTraits.push({
      trait,
      label: item.label || TRAIT_LABELS[trait] || trait,
      eligible: item.eligible,
      accuracy: item.accuracy,
      coverage: item.coverage,
      macroF1: item.macroF1,
    });
    if (item.abstentions) {
      abstentions.push({
        trait,
        label: item.label || trait,
        count: item.abstentions,
        rate: item.eligible ? round(item.abstentions / item.eligible) : null,
      });
    }
    for (const [reference, row] of Object.entries(item.confusion || {})) {
      for (const [prediction, count] of Object.entries(row || {})) {
        if (!count || reference === prediction || prediction === '__abstain__') continue;
        misclassifications.push({
          trait,
          label: item.label || trait,
          reference: item.labels?.[reference] || reference,
          prediction: item.labels?.[prediction] || prediction,
          count,
          shareOfTraitErrors: item.errors ? round(count / item.errors) : null,
        });
      }
    }
    for (const [classKey, metric] of Object.entries(item.classMetrics || {})) {
      if (!metric?.support || !Number.isFinite(metric.recall)) continue;
      lowRecall.push({
        trait,
        label: item.label || trait,
        classLabel: item.labels?.[classKey] || classKey,
        support: metric.support,
        recall: metric.recall,
      });
    }
  }

  misclassifications.sort((a, b) => b.count - a.count || (b.shareOfTraitErrors ?? 0) - (a.shareOfTraitErrors ?? 0));
  abstentions.sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || b.count - a.count);
  lowRecall.sort((a, b) => a.recall - b.recall || b.support - a.support);
  lowPerformingTraits.sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1) || (a.coverage ?? 1) - (b.coverage ?? 1));

  return {
    misclassifications: misclassifications.slice(0, limit),
    abstentions: abstentions.slice(0, limit),
    lowRecall: lowRecall.slice(0, limit),
    lowPerformingTraits: lowPerformingTraits.slice(0, limit),
  };
}

const THRESHOLD_SPECS = Object.freeze({
  frunte: { type: 'range3', current: [THRESHOLDS.forehead.narrow, THRESHOLDS.forehead.wide], labels: ['Îngustă', 'Mijlocie', 'Lată'] },
  nasLatime: { type: 'range3', current: [THRESHOLDS.nose.narrow, THRESHOLDS.nose.wide], labels: ['Îngust', 'Mijlociu', 'Lat'] },
  ochiMarime: { type: 'range3', current: [THRESHOLDS.eyeSize.small, THRESHOLDS.eyeSize.large], labels: ['Mici', 'Mijlocii', 'Mari'] },
  guraMarime: { type: 'range3', current: [THRESHOLDS.mouth.small, THRESHOLDS.mouth.large], labels: ['Mică', 'Mijlocie', 'Mare'] },
  barbie: { type: 'range3', current: [THRESHOLDS.chin.pointed, THRESHOLDS.chin.wide], labels: ['Ascuțită', 'Normală', 'Lată / plată'] },
  guraColturi: { type: 'symmetric3', current: [THRESHOLDS.mouth.corner], labels: ['Colțuri ridicate', 'Liniare', 'Colțuri coborâte'] },
  nasProfil: { type: 'symmetric3', current: [THRESHOLDS.nose.curvature], labels: ['Concav', 'Rectiliniu', 'Convex'] },
  calvitie: { type: 'coverage3', current: [THRESHOLDS.hair.minimumCoverage, THRESHOLDS.hair.frontalLossCoverage], labels: ['Prezentă / extinsă', 'Frontală', 'Absentă'] },
});

function classifyWithSpec(spec, value, thresholds) {
  if (!Number.isFinite(value)) return null;
  if (spec.type === 'range3') {
    if (value < thresholds[0]) return spec.labels[0];
    if (value > thresholds[1]) return spec.labels[2];
    return spec.labels[1];
  }
  if (spec.type === 'symmetric3') {
    const threshold = thresholds[0];
    if (value < -threshold) return spec.labels[0];
    if (value > threshold) return spec.labels[2];
    return spec.labels[1];
  }
  if (spec.type === 'coverage3') {
    if (value < thresholds[0]) return spec.labels[0];
    if (value < thresholds[1]) return spec.labels[1];
    return spec.labels[2];
  }
  return null;
}

function macroF1FromPairs(pairs) {
  const referenceLabels = [...new Set(pairs.map(pair => pair.reference))];
  const f1s = [];
  for (const label of referenceLabels) {
    let tp = 0, fp = 0, fn = 0;
    for (const pair of pairs) {
      if (pair.reference === label && pair.prediction === label) tp += 1;
      else if (pair.reference !== label && pair.prediction === label) fp += 1;
      else if (pair.reference === label && pair.prediction !== label) fn += 1;
    }
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
    f1s.push(f1);
  }
  return f1s.length ? f1s.reduce((sum, value) => sum + value, 0) / f1s.length : 0;
}

function scoreThresholds(samples, trait, spec, thresholds) {
  const pairs = samples.map(sample => ({
    reference: canonicalTraitLabel(trait, sample.reference),
    prediction: canonicalTraitLabel(trait, classifyWithSpec(spec, sample.value, thresholds)),
  })).filter(pair => pair.reference && pair.prediction);
  const correct = pairs.filter(pair => pair.reference === pair.prediction).length;
  return {
    accuracy: pairs.length ? correct / pairs.length : 0,
    macroF1: macroF1FromPairs(pairs),
  };
}

function candidateCutPoints(values, maxPoints = 50) {
  const unique = [...new Set(values.filter(Number.isFinite).sort((a, b) => a - b))];
  if (unique.length < 2) return [];
  let points = [];
  for (let i = 0; i < unique.length - 1; i += 1) points.push((unique[i] + unique[i + 1]) / 2);
  if (points.length <= maxPoints) return points;
  const sampled = [];
  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.round(i * (points.length - 1) / (maxPoints - 1));
    sampled.push(points[index]);
  }
  return [...new Set(sampled)];
}

function compareScore(a, b) {
  if (Math.abs(a.macroF1 - b.macroF1) > 1e-12) return a.macroF1 - b.macroF1;
  return a.accuracy - b.accuracy;
}

function optimizeSpec(samples, trait, spec) {
  const values = samples.map(sample => sample.value);
  const currentScore = scoreThresholds(samples, trait, spec, spec.current);
  const cutPoints = candidateCutPoints(values);
  let best = { thresholds: [...spec.current], ...currentScore };

  if (spec.type === 'symmetric3') {
    const magnitudes = candidateCutPoints(values.map(Math.abs));
    for (const threshold of magnitudes) {
      if (!(threshold > 0)) continue;
      const score = scoreThresholds(samples, trait, spec, [threshold]);
      if (compareScore(score, best) > 0) best = { thresholds: [threshold], ...score };
    }
  } else {
    for (let i = 0; i < cutPoints.length; i += 1) {
      for (let j = i + 1; j < cutPoints.length; j += 1) {
        const thresholds = [cutPoints[i], cutPoints[j]];
        const score = scoreThresholds(samples, trait, spec, thresholds);
        if (compareScore(score, best) > 0) best = { thresholds, ...score };
      }
    }
  }

  return { current: { thresholds: [...spec.current], ...currentScore }, best };
}

export function computeThresholdCandidates(records, { minimumCases = 12, minimumPerClass = 3 } = {}) {
  const results = {};
  for (const [trait, spec] of Object.entries(THRESHOLD_SPECS)) {
    const samples = [];
    for (const record of records || []) {
      if (!validateCalibrationRecord(record).valid) continue;
      const value = finiteOrNull(record.features?.[trait]);
      const reference = cleanLabel(record.reference?.[trait]);
      if (value === null || !reference) continue;
      samples.push({ value, reference });
    }
    const classCounts = {};
    for (const sample of samples) {
      const key = canonicalTraitLabel(trait, sample.reference);
      if (key) classCounts[key] = (classCounts[key] || 0) + 1;
    }
    const supportedClasses = Object.values(classCounts).filter(count => count >= minimumPerClass).length;
    if (samples.length < minimumCases || supportedClasses < 2) {
      results[trait] = {
        trait,
        label: TRAIT_LABELS[trait] || trait,
        n: samples.length,
        classCounts,
        status: 'insufficient-data',
        currentThresholds: [...spec.current],
      };
      continue;
    }
    const optimized = optimizeSpec(samples, trait, spec);
    const improvement = optimized.best.macroF1 - optimized.current.macroF1;
    const changed = optimized.best.thresholds.some((value, index) => Math.abs(value - optimized.current.thresholds[index]) > 1e-9);
    results[trait] = {
      trait,
      label: TRAIT_LABELS[trait] || trait,
      n: samples.length,
      classCounts,
      status: changed && improvement > 1e-9 ? 'candidate' : 'no-improvement',
      currentThresholds: optimized.current.thresholds.map(value => round(value, 4)),
      candidateThresholds: optimized.best.thresholds.map(value => round(value, 4)),
      currentAccuracy: round(optimized.current.accuracy),
      candidateAccuracy: round(optimized.best.accuracy),
      currentMacroF1: round(optimized.current.macroF1),
      candidateMacroF1: round(optimized.best.macroF1),
      macroF1Delta: round(improvement),
      exploratoryOnly: true,
    };
  }
  return results;
}

export function buildAdvancedCalibrationReport(records, calibrationReport) {
  return {
    generatedAt: new Date().toISOString(),
    interRater: computeInterRaterReport(records),
    hotspots: computeErrorHotspots(calibrationReport),
    thresholdCandidates: computeThresholdCandidates(records),
  };
}

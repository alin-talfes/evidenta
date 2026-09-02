import test from 'node:test';
import assert from 'node:assert/strict';
import {
  unpackCalibrationPayload,
  validateCalibrationRecord,
  computeCalibrationReport,
  computeVersionReports,
  computeQualityReports,
  buildCalibrationBundle,
} from '../calibration-metrics.js';

const base = [
  { caseId: 'A', engineVersion: '3.0', reference: { frunte: 'Lată', ochiMarime: 'Mijlocii' }, prediction: { frunte: 'Lată', ochiMarime: 'Mari' }, quality: { frontal: { grade: 'Bună' } } },
  { caseId: 'B', engineVersion: '3.0', reference: { frunte: 'Îngustă', ochiMarime: 'Mici' }, prediction: { frunte: 'Lată', ochiMarime: 'Mici' }, quality: { frontal: { grade: 'Slabă' } } },
  { caseId: 'C', engineVersion: '2.0', reference: { frunte: 'Lată', ochiMarime: 'Mari' }, prediction: { frunte: 'Nedeterminată', ochiMarime: 'Mari' }, quality: { frontal: { grade: 'Bună' } } },
];

test('unpack supports a record, array and bundle', () => {
  assert.equal(unpackCalibrationPayload(base[0]).length, 1);
  assert.equal(unpackCalibrationPayload(base).length, 3);
  assert.equal(unpackCalibrationPayload({ records: base }).length, 3);
  assert.equal(unpackCalibrationPayload({ nope: true }).length, 0);
});

test('validation rejects malformed records', () => {
  assert.equal(validateCalibrationRecord(base[0]).valid, true);
  assert.equal(validateCalibrationRecord({ caseId: 'X' }).valid, false);
});

test('report counts exact matches and abstentions in the denominator', () => {
  const report = computeCalibrationReport(base, ['frunte']);
  assert.equal(report.cases, 3);
  assert.equal(report.totalEligible, 3);
  assert.equal(report.totalCorrect, 1);
  assert.equal(report.totalAbstentions, 1);
  assert.equal(report.microAccuracy, 0.3333);
  assert.equal(report.coverage, 0.6667);
  assert.equal(report.perTrait.frunte.conditionalAccuracy, 0.5);
});

test('confusion matrix is populated with normalized labels', () => {
  const trait = computeCalibrationReport(base, ['frunte']).perTrait.frunte;
  assert.equal(trait.confusion['lată']['lată'], 1);
  assert.equal(trait.confusion['îngustă']['lată'], 1);
  assert.equal(trait.confusion['lată']['__abstain__'], 1);
});

test('duplicate IDs and invalid records are surfaced', () => {
  const report = computeCalibrationReport([...base, base[0], { caseId: '', reference: {}, prediction: {} }], ['frunte']);
  assert.deepEqual(report.duplicateIds, ['A']);
  assert.equal(report.invalidCount, 1);
});

test('version reports keep engine cohorts separate', () => {
  const reports = computeVersionReports(base, ['frunte']);
  assert.deepEqual(Object.keys(reports).sort(), ['2.0', '3.0']);
  assert.equal(reports['3.0'].cases, 2);
  assert.equal(reports['2.0'].cases, 1);
});

test('quality reports stratify by frontal quality', () => {
  const reports = computeQualityReports(base, ['frunte']);
  assert.equal(reports['Bună'].cases, 2);
  assert.equal(reports['Slabă'].cases, 1);
});

test('bundle contains records plus aggregate reports', () => {
  const bundle = buildCalibrationBundle(base);
  assert.equal(bundle.format, 'semnalmente-calibration-bundle');
  assert.equal(bundle.count, 3);
  assert.equal(bundle.report.cases, 3);
  assert.ok(bundle.byEngineVersion['3.0']);
});

import { predictionFromAnalysis, calibrationRecordFromAnalysis } from '../calibration-metrics.js';

test('analysis export is mapped from automaticResults, not manual corrections', () => {
  const analysis = {
    engineVersion: '3.0',
    frunte: { tip: 'Lată' },
    automaticResults: { frunte: { tip: 'Îngustă' }, nas: { tip: 'Convex', latime: 'Mijlociu' }, sprancene: ['Arcuite', 'Dese'] },
  };
  const prediction = predictionFromAnalysis(analysis);
  assert.equal(prediction.frunte, 'Îngustă');
  assert.equal(prediction.nasProfil, 'Convex');
  assert.equal(prediction.spranceneDensitate, 'Dese');
});

test('calibration record preserves engine version and quality', () => {
  const analysis = { engineVersion: '3.0', automaticResults: { frunte: { tip: 'Lată' } }, calitate: { frontal: { grade: 'Bună' } } };
  const record = calibrationRecordFromAnalysis(analysis, { caseId: 'P-01', reference: { frunte: 'Lată' }, referenceMeta: { blinded: true } });
  assert.equal(record.caseId, 'P-01');
  assert.equal(record.engineVersion, '3.0');
  assert.equal(record.quality.frontal.grade, 'Bună');
  assert.equal(record.referenceMeta.blinded, true);
});

test('benchmark taxonomy separates display uncertainty from phenotype class', () => {
  const records = [
    { caseId: 'H', reference: { ochiCuloare: 'Heterocromie', calvitie: 'Frontală', barba: 'Fără barbă' }, prediction: { ochiCuloare: 'Posibilă heterocromie — de verificat', calvitie: 'Posibilă calviție frontală — de verificat', barba: 'Fără indicii clare de barbă' } },
  ];
  const report = computeCalibrationReport(records, ['ochiCuloare', 'calvitie', 'barba']);
  assert.equal(report.totalCorrect, 3);
  assert.equal(report.microAccuracy, 1);
});

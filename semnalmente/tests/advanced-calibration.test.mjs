import test from 'node:test';
import assert from 'node:assert/strict';
import {
  featuresFromAnalysis,
  computeCohenKappa,
  computeInterRaterReport,
  computeErrorHotspots,
  computeThresholdCandidates,
} from '../advanced-calibration.js';

test('featuresFromAnalysis uses automatic baseline instead of corrected values', () => {
  const analysis = {
    frunte: { raportLatime: 0.9 },
    automaticResults: {
      frunte: { raportLatime: 0.67 },
      nas: { raportLatime: 0.21, curburaProfil: -0.02 },
      ochi: { raportOchi: 0.18 },
      gura: { raportGura: 0.35, inclinareColturi: 0.01 },
      barbie: { raportConicitate: 0.58 },
      par: { acoperirePar: 0.31 },
    },
  };
  assert.deepEqual(featuresFromAnalysis(analysis), {
    frunte: 0.67,
    nasProfil: -0.02,
    nasLatime: 0.21,
    ochiMarime: 0.18,
    guraColturi: 0.01,
    guraMarime: 0.35,
    barbie: 0.58,
    calvitie: 0.31,
  });
});

test('Cohen kappa matches a hand-checkable example', () => {
  const result = computeCohenKappa([['X','X'],['X','Y'],['Y','Y'],['Y','Y']]);
  assert.equal(result.n, 4);
  assert.equal(result.agreement, 0.75);
  assert.equal(result.expectedAgreement, 0.5);
  assert.equal(result.kappa, 0.5);
});

test('inter-rater report computes kappa per trait and rater pair', () => {
  const combos = [
    ['Mici','Mici'], ['Mici','Mari'], ['Mari','Mari'], ['Mari','Mari'],
  ];
  const records = combos.map((pair, i) => ({
    caseId: `C${i}`,
    reference: { ochiMarime: pair[0] },
    prediction: { ochiMarime: pair[0] },
    ratings: [
      { raterId: 'A', labels: { ochiMarime: pair[0] } },
      { raterId: 'B', labels: { ochiMarime: pair[1] } },
    ],
  }));
  const report = computeInterRaterReport(records, ['ochiMarime']);
  assert.equal(report.pairCount, 1);
  assert.equal(report.pairs['A ↔ B'].perTrait.ochiMarime.kappa, 0.5);
});

test('error hotspots rank repeated confusions first', () => {
  const report = {
    perTrait: {
      ochiMarime: {
        eligible: 10, label: 'Ochi', accuracy: 0.6, coverage: 1, macroF1: 0.5, errors: 4, abstentions: 0,
        labels: { mici: 'Mici', mari: 'Mari', mijlocii: 'Mijlocii' },
        confusion: { mici: { mici: 2, mari: 3, mijlocii: 0 }, mari: { mici: 1, mari: 4, mijlocii: 0 }, mijlocii: { mici: 0, mari: 0, mijlocii: 0 } },
        classMetrics: { mici: { support: 5, recall: 0.4 }, mari: { support: 5, recall: 0.8 } },
      },
    },
  };
  const hotspots = computeErrorHotspots(report);
  assert.equal(hotspots.misclassifications[0].count, 3);
  assert.equal(hotspots.misclassifications[0].reference, 'Mici');
  assert.equal(hotspots.lowRecall[0].classLabel, 'Mici');
});

test('threshold candidate finder improves a shifted eye-size split without applying it', () => {
  const values = [0.12,0.13,0.14,0.15,0.151, 0.17,0.175,0.18,0.185,0.189, 0.195,0.20,0.21,0.22,0.23];
  const refs = values.map(v => v < 0.155 ? 'Mici' : v > 0.192 ? 'Mari' : 'Mijlocii');
  const records = values.map((value, i) => ({
    caseId: `E${i}`,
    reference: { ochiMarime: refs[i] },
    prediction: { ochiMarime: 'Mijlocii' },
    features: { ochiMarime: value },
  }));
  const result = computeThresholdCandidates(records, { minimumCases: 12, minimumPerClass: 3 }).ochiMarime;
  assert.equal(result.status, 'candidate');
  assert.ok(result.candidateMacroF1 > result.currentMacroF1);
  assert.equal(result.exploratoryOnly, true);
  assert.notDeepEqual(result.candidateThresholds, result.currentThresholds);
});

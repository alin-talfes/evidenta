import test from 'node:test';
import assert from 'node:assert/strict';
import {
    classifyEyeSizeRatio,
    classifyIrisHsv,
    classifyForeheadRatios,
    classifyFaceShapeMetrics,
    classifyMouthMetrics,
    classifyChinTaper,
    classifyNoseWidthRatio,
    classifyNoseCurvature,
    classifyHairMetrics,
    classifyEyebrowMetrics,
    classifyFacialHairMetrics,
} from '../classifier-rules.js';

test('eye size preserves threshold ordering', () => {
    assert.equal(classifyEyeSizeRatio(0.12), 'Mici');
    assert.equal(classifyEyeSizeRatio(0.17), 'Mijlocii');
    assert.equal(classifyEyeSizeRatio(0.23), 'Mari');
});

test('iris rules separate low saturation, blue, green and brown', () => {
    assert.equal(classifyIrisHsv({ h: 210, s: 0.35, v: 0.65 }), 'Albaștri');
    assert.equal(classifyIrisHsv({ h: 105, s: 0.38, v: 0.55 }), 'Verzi');
    assert.equal(classifyIrisHsv({ h: 30, s: 0.55, v: 0.45 }), 'Căprui');
    assert.equal(classifyIrisHsv({ h: 0, s: 0.05, v: 0.6 }), 'Cenușii');
    assert.equal(classifyIrisHsv({ h: 25, s: 0.4, v: 0.15 }), 'Negri');
});

test('forehead combines independent width and height classifications', () => {
    assert.deepEqual(classifyForeheadRatios(0.60, 0.31), { tip: 'Îngustă', detalii: 'Îngustă, Înaltă' });
    assert.deepEqual(classifyForeheadRatios(0.70, 0.24), { tip: 'Mijlocie', detalii: 'Mijlocie' });
});

test('mouth corner sign is not inverted', () => {
    assert.equal(classifyMouthMetrics(0.35, -0.08).colturi, 'Colțuri ridicate');
    assert.equal(classifyMouthMetrics(0.35, 0.08).colturi, 'Colțuri coborâte');
    assert.equal(classifyMouthMetrics(0.35, 0).colturi, 'Liniare');
});

test('nose profile curvature has symmetric sign behavior', () => {
    assert.equal(classifyNoseCurvature(0.03), 'Convex');
    assert.equal(classifyNoseCurvature(-0.03), 'Concav');
    assert.equal(classifyNoseCurvature(0.005), 'Rectiliniu');
    assert.equal(classifyNoseWidthRatio(0.16), 'Îngust');
    assert.equal(classifyNoseWidthRatio(0.21), 'Mijlociu');
    assert.equal(classifyNoseWidthRatio(0.28), 'Lat');
});

test('face shape representative metric sets remain stable', () => {
    assert.equal(classifyFaceShapeMetrics({ ratio: 1.55, jawRatio: 0.88, foreheadRatio: 0.9, taper: 0.7 }), 'Dreptunghiulară');
    assert.equal(classifyFaceShapeMetrics({ ratio: 1.38, jawRatio: 0.76, foreheadRatio: 0.78, taper: 0.65, cheekDominance: true }), 'Romboidă');
    assert.equal(classifyFaceShapeMetrics({ ratio: 1.31, jawRatio: 0.72, foreheadRatio: 0.86, taper: 0.55 }), 'Triunghiulară');
    assert.equal(classifyFaceShapeMetrics({ ratio: 1.32, jawRatio: 0.82, foreheadRatio: 0.84, taper: 0.7 }), 'Ovală');
    assert.equal(classifyFaceShapeMetrics({ ratio: 1.18, jawRatio: 0.92, foreheadRatio: 0.9, taper: 0.7 }), 'Pătrată');
    assert.equal(classifyFaceShapeMetrics({ ratio: 1.18, jawRatio: 0.78, foreheadRatio: 0.78, taper: 0.65 }), 'Rotundă');
});

test('chin taper classes are ordered', () => {
    assert.equal(classifyChinTaper(0.42), 'Ascuțită');
    assert.equal(classifyChinTaper(0.58), 'Normală');
    assert.equal(classifyChinTaper(0.75), 'Lată / plată');
});

test('hair metrics distinguish insufficient coverage and texture', () => {
    assert.equal(classifyHairMetrics({ coverage: 0.08, luminance: 80, hue: 30, saturation: 0.3, textureVariance: 200 }).culoare, 'Nedeterminată');
    assert.deepEqual(classifyHairMetrics({ coverage: 0.5, luminance: 35, hue: 20, saturation: 0.4, textureVariance: 2200 }), {
        culoare: 'Negru', textura: 'Creț / foarte texturat', calvitie: 'Fără indicii clare de calviție'
    });
});

test('eyebrow and facial hair rules are deterministic', () => {
    assert.deepEqual(classifyEyebrowMetrics(0.1, 0.6), ['Arcuite', 'Dese']);
    assert.deepEqual(classifyFacialHairMetrics({ beardDark: 0.55, beardVariance: 200, mustacheDark: 0.52 }), { barba: 'Barbă deasă', mustata: 'Mustață groasă' });
});

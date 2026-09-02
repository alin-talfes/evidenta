export const THRESHOLDS = Object.freeze({
    eyeSize: Object.freeze({ small: 0.145, large: 0.205 }),
    forehead: Object.freeze({ narrow: 0.64, wide: 0.78, low: 0.20, high: 0.29 }),
    mouth: Object.freeze({ small: 0.30, large: 0.42, corner: 0.045 }),
    chin: Object.freeze({ pointed: 0.50, wide: 0.68 }),
    nose: Object.freeze({ narrow: 0.18, wide: 0.25, curvature: 0.018 }),
    eyebrow: Object.freeze({ arched: 0.08, sparse: 0.12, dense: 0.48 }),
    hair: Object.freeze({ minimumCoverage: 0.12, frontalLossCoverage: 0.28, graySaturation: 0.12, grayLuminance: 105, blackLuminance: 48, blondLuminance: 118, wavyVariance: 850, curlyVariance: 1900 }),
    facialHair: Object.freeze({ beardDense: 0.50, beardMedium: 0.30, beardShort: 0.17, beardDenseVariance: 160, beardMediumVariance: 110, beardShortVariance: 80, mustacheDense: 0.48, mustacheSparse: 0.25 }),
});

function finite(value, fallback = 0) {
    return Number.isFinite(value) ? value : fallback;
}

export function classifyEyeSizeRatio(ratio) {
    const value = finite(ratio);
    if (value < THRESHOLDS.eyeSize.small) return "Mici";
    if (value > THRESHOLDS.eyeSize.large) return "Mari";
    return "Mijlocii";
}

export function classifyIrisHsv(hsv) {
    if (!hsv || !Number.isFinite(hsv.h) || !Number.isFinite(hsv.s) || !Number.isFinite(hsv.v)) return "Nedeterminată";
    if (hsv.v < 0.23) return "Negri";
    if (hsv.s < 0.13) return "Cenușii";
    if (hsv.h >= 175 && hsv.h <= 265) return "Albaștri";
    if (hsv.h >= 65 && hsv.h < 175) return "Verzi";
    return "Căprui";
}

export function classifyForeheadRatios(widthRatio, heightRatio) {
    const width = finite(widthRatio);
    const height = finite(heightRatio);
    const widthLabel = width < THRESHOLDS.forehead.narrow ? "Îngustă" : width > THRESHOLDS.forehead.wide ? "Lată" : "Mijlocie";
    const heightLabel = height < THRESHOLDS.forehead.low ? "Scundă" : height > THRESHOLDS.forehead.high ? "Înaltă" : "Mijlocie";
    return {
        tip: widthLabel,
        detalii: widthLabel === heightLabel ? widthLabel : `${widthLabel}, ${heightLabel}`,
    };
}

export function classifyFaceShapeMetrics({ ratio, jawRatio, foreheadRatio, taper, cheekDominance = false }) {
    const lengthWidth = finite(ratio);
    const jaw = finite(jawRatio);
    const forehead = finite(foreheadRatio);
    const lowerTaper = finite(taper, 1);
    if (lengthWidth >= 1.48 && jaw >= 0.82) return "Dreptunghiulară";
    if (lengthWidth >= 1.34 && cheekDominance) return "Romboidă";
    if (lengthWidth >= 1.30 && lowerTaper < 0.62 && forehead > jaw) return "Triunghiulară";
    if (lengthWidth >= 1.26) return "Ovală";
    if (jaw >= 0.88 && forehead >= 0.84) return "Pătrată";
    return "Rotundă";
}

export function classifyMouthMetrics(mouthRatio, normalizedCornerDelta) {
    const width = finite(mouthRatio);
    const delta = finite(normalizedCornerDelta);
    const marime = width < THRESHOLDS.mouth.small ? "Mică" : width > THRESHOLDS.mouth.large ? "Mare" : "Mijlocie";
    let colturi = "Liniare";
    if (delta < -THRESHOLDS.mouth.corner) colturi = "Colțuri ridicate";
    else if (delta > THRESHOLDS.mouth.corner) colturi = "Colțuri coborâte";
    return { marime, colturi };
}

export function classifyChinTaper(taper) {
    const value = finite(taper, 1);
    if (value < THRESHOLDS.chin.pointed) return "Ascuțită";
    if (value > THRESHOLDS.chin.wide) return "Lată / plată";
    return "Normală";
}

export function classifyNoseWidthRatio(ratio) {
    const value = finite(ratio);
    if (value < THRESHOLDS.nose.narrow) return "Îngust";
    if (value > THRESHOLDS.nose.wide) return "Lat";
    return "Mijlociu";
}

export function classifyNoseCurvature(curvature) {
    const value = finite(curvature);
    if (value > THRESHOLDS.nose.curvature) return "Convex";
    if (value < -THRESHOLDS.nose.curvature) return "Concav";
    return "Rectiliniu";
}

export function classifyHairMetrics({ coverage, luminance, hue, saturation, textureVariance }) {
    const cov = finite(coverage);
    if (cov < THRESHOLDS.hair.minimumCoverage) {
        return { culoare: "Nedeterminată", textura: "Nedeterminată", calvitie: "Posibilă calviție — de verificat" };
    }

    const lum = finite(luminance);
    const sat = finite(saturation);
    const h = finite(hue);
    let culoare;
    if (sat < THRESHOLDS.hair.graySaturation && lum > THRESHOLDS.hair.grayLuminance) culoare = "Cărunt";
    else if (lum < THRESHOLDS.hair.blackLuminance) culoare = "Negru";
    else if (lum > THRESHOLDS.hair.blondLuminance && h >= 18 && h <= 70) culoare = "Blond";
    else culoare = "Șaten";

    const texture = finite(textureVariance);
    let textura = "Drept / neted";
    if (texture > THRESHOLDS.hair.curlyVariance) textura = "Creț / foarte texturat";
    else if (texture > THRESHOLDS.hair.wavyVariance) textura = "Ondulat / texturat";

    const calvitie = cov < THRESHOLDS.hair.frontalLossCoverage ? "Posibilă calviție frontală — de verificat" : "Fără indicii clare de calviție";
    return { culoare, textura, calvitie };
}

export function classifyEyebrowMetrics(curvature, darkRatio) {
    const forma = finite(curvature) > THRESHOLDS.eyebrow.arched ? "Arcuite" : "Drepte";
    const density = finite(darkRatio);
    const densitate = density < THRESHOLDS.eyebrow.sparse ? "Rare / slab vizibile" : density > THRESHOLDS.eyebrow.dense ? "Dese" : "Medii";
    return [forma, densitate];
}

export function classifyFacialHairMetrics({ beardDark, beardVariance, mustacheDark }) {
    const dark = finite(beardDark);
    const variance = finite(beardVariance);
    let barba = "Fără indicii clare de barbă";
    if (dark > THRESHOLDS.facialHair.beardDense && variance > THRESHOLDS.facialHair.beardDenseVariance) barba = "Barbă deasă";
    else if (dark > THRESHOLDS.facialHair.beardMedium && variance > THRESHOLDS.facialHair.beardMediumVariance) barba = "Barbă medie";
    else if (dark > THRESHOLDS.facialHair.beardShort && variance > THRESHOLDS.facialHair.beardShortVariance) barba = "Barbă scurtă / rară";

    const mustache = finite(mustacheDark);
    let mustata = "Fără indicii clare de mustață";
    if (mustache > THRESHOLDS.facialHair.mustacheDense) mustata = "Mustață groasă";
    else if (mustache > THRESHOLDS.facialHair.mustacheSparse) mustata = "Mustață subțire / rară";
    return { barba, mustata };
}

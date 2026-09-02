import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
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
} from "./classifier-rules.js";
import { getPath, setPath, valuesEqual, recordCorrection } from "./result-audit.js";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MAX_PROCESS_DIMENSION = 2048;
const STORAGE_PREFIX = "semnalmente:";
const ENGINE_VERSION = "3.0";

const LM = Object.freeze({
    TOP_FACE: 10,
    FOREHEAD_LEFT: 54,
    FOREHEAD_RIGHT: 284,
    TEMPLE_LEFT: 234,
    TEMPLE_RIGHT: 454,
    JAW_LEFT: 172,
    JAW_RIGHT: 397,
    LOWER_JAW_LEFT: 176,
    LOWER_JAW_RIGHT: 400,
    CHIN: 152,
    RIGHT_EYE_OUTER: 33,
    RIGHT_EYE_INNER: 133,
    LEFT_EYE_INNER: 362,
    LEFT_EYE_OUTER: 263,
    RIGHT_IRIS_CENTER: 468,
    RIGHT_IRIS_EDGE: [469, 470, 471, 472],
    LEFT_IRIS_CENTER: 473,
    LEFT_IRIS_EDGE: [474, 475, 476, 477],
    RIGHT_BROW_OUTER: 70,
    RIGHT_BROW_TOP: 65,
    RIGHT_BROW_INNER: 107,
    LEFT_BROW_OUTER: 300,
    LEFT_BROW_TOP: 295,
    LEFT_BROW_INNER: 336,
    NOSE_TIP: 1,
    NOSE_BRIDGE_TOP: 6,
    NOSE_BRIDGE_MID: 168,
    NOSE_BRIDGE_BOTTOM: 2,
    RIGHT_NOSTRIL: 45,
    LEFT_NOSTRIL: 275,
    MOUTH_RIGHT: 61,
    MOUTH_LEFT: 291,
    MOUTH_TOP: 13,
    MOUTH_BOTTOM: 14,
    RIGHT_CHEEK_SKIN: 116,
    LEFT_CHEEK_SKIN: 345,
    FOREHEAD_SKIN: 8,
    UPPER_LIP_SKIN: 164,
});

const FIELD_SCHEMA = Object.freeze([
    { card: "Fruntea", label: "Tip", path: "frunte.tip", options: ["Îngustă", "Mijlocie", "Lată", "Nedeterminată"] },
    { card: "Fruntea", label: "Detalii", path: "frunte.detalii", freeText: true },
    { card: "Nasul", label: "Profil", path: "nas.tip", options: ["Rectiliniu", "Convex", "Concav", "Nedeterminat — necesită profil", "Nedeterminat"] },
    { card: "Nasul", label: "Lățime", path: "nas.latime", options: ["Îngust", "Mijlociu", "Lat", "Nedeterminată"] },
    { card: "Ochii", label: "Culoare", path: "ochi.culoare", options: ["Negri", "Căprui", "Verzi", "Albaștri", "Cenușii", "Posibilă heterocromie — de verificat", "Nedeterminată"] },
    { card: "Ochii", label: "Mărime", path: "ochi.marime", options: ["Mici", "Mijlocii", "Mari", "Nedeterminată"] },
    { card: "Gura", label: "Colțuri", path: "gura.colturi", options: ["Colțuri ridicate", "Liniare", "Colțuri coborâte", "Nedeterminate"] },
    { card: "Gura", label: "Mărime", path: "gura.marime", options: ["Mică", "Mijlocie", "Mare", "Nedeterminată"] },
    { card: "Bărbia", label: "Formă", path: "barbie.tip", options: ["Ascuțită", "Normală", "Lată / plată", "Nedeterminată"] },
    { card: "Tipul feței", label: "Formă", path: "tipFata.tip", options: ["Ovală", "Rotundă", "Pătrată", "Dreptunghiulară", "Triunghiulară", "Romboidă", "Nedeterminată"] },
    { card: "Părul", label: "Culoare", path: "par.culoare", options: ["Negru", "Șaten", "Blond", "Cărunt", "Nedeterminată"] },
    { card: "Părul", label: "Textură", path: "par.textura", options: ["Drept / neted", "Ondulat / texturat", "Creț / foarte texturat", "Nedeterminată"] },
    { card: "Părul", label: "Calviție", path: "par.calvitie", options: ["Fără indicii clare de calviție", "Posibilă calviție frontală — de verificat", "Posibilă calviție — de verificat", "Nedeterminată"] },
    { card: "Sprâncenele", label: "Formă", path: "sprancene.0", options: ["Drepte", "Arcuite", "Nedeterminate"] },
    { card: "Sprâncenele", label: "Densitate", path: "sprancene.1", options: ["Rare / slab vizibile", "Medii", "Dese", "Nedeterminată"] },
    { card: "Barba", label: "Evaluare", path: "barba", options: ["Fără indicii clare de barbă", "Barbă scurtă / rară", "Barbă medie", "Barbă deasă", "Nedeterminată"] },
    { card: "Mustața", label: "Evaluare", path: "mustata", options: ["Fără indicii clare de mustață", "Mustață subțire / rară", "Mustață groasă", "Nedeterminată"] },
    { card: "Urechile", label: "Formă", path: "urechi.forma", options: ["Ovală", "Rotundă", "Dreptunghiulară", "Triunghiulară", "Neregulată", "Nedeterminată"] },
    { card: "Urechile", label: "Mărime", path: "urechi.marime", options: ["Mici", "Medii", "Mari", "Nedeterminată"] },
    { card: "Urechile", label: "Lob", path: "urechi.lob", options: ["Lob liber", "Lob lipit", "Nedeterminat"] },
]);

let faceLandmarker = null;
let modelInitPromise = null;
let currentResults = null;
let frontalFile = null;
let profileFile = null;
let objectUrls = new Set();
let isAnalyzing = false;

function $(id) { return document.getElementById(id); }
function ensureEditorStyles() {
    if (document.querySelector('link[data-semnalmente-editor]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "editor.css";
    link.dataset.semnalmenteEditor = "true";
    document.head.appendChild(link);
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function mean(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function median(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function deepClone(value) {
    if (value == null || typeof value !== "object") return value;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}
function medianColor(colors) {
    if (!colors.length) return null;
    return { r: median(colors.map(c => c.r)), g: median(colors.map(c => c.g)), b: median(colors.map(c => c.b)) };
}
function luminance(color) { return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b; }
function variance(values) {
    if (values.length < 2) return 0;
    const avg = mean(values);
    return mean(values.map(value => (value - avg) ** 2));
}
function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * (((b - r) / d) + 2);
        else h = 60 * (((r - g) / d) + 4);
    }
    if (h < 0) h += 360;
    return { h, s: max === 0 ? 0 : d / max, v: max };
}
function hueDistance(a, b) {
    const delta = Math.abs(a - b) % 360;
    return Math.min(delta, 360 - delta);
}
function pointPx(landmark, canvas) {
    return { x: landmark.x * canvas.width, y: landmark.y * canvas.height, z: landmark.z ?? 0 };
}
function distancePx(a, b, canvas) {
    const p = pointPx(a, canvas), q = pointPx(b, canvas);
    return Math.hypot(p.x - q.x, p.y - q.y);
}
function signedDistanceToLine(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    return ((dx * (point.y - start.y)) - (dy * (point.x - start.x))) / length;
}
function safeLandmark(landmarks, index) { return landmarks?.[index] || null; }

function setStatus(message, type = "info") {
    const element = $("status");
    element.className = `status ${type}`;
    element.textContent = message;
}

async function initFaceLandmarker() {
    if (faceLandmarker) return faceLandmarker;
    if (modelInitPromise) return modelInitPromise;
    modelInitPromise = (async () => {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        const common = {
            runningMode: "IMAGE",
            numFaces: 1,
            minFaceDetectionConfidence: 0.65,
            minFacePresenceConfidence: 0.65,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
        };
        try {
            faceLandmarker = await FaceLandmarker.createFromOptions(vision, { ...common, baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" } });
        } catch (gpuError) {
            console.warn("GPU indisponibil; se folosește CPU.", gpuError);
            faceLandmarker = await FaceLandmarker.createFromOptions(vision, { ...common, baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" } });
        }
        return faceLandmarker;
    })().catch(error => {
        modelInitPromise = null;
        throw error;
    });
    return modelInitPromise;
}

function replacePreviewUrl(preview, file) {
    const old = preview.dataset.objectUrl;
    if (old) {
        URL.revokeObjectURL(old);
        objectUrls.delete(old);
    }
    const url = URL.createObjectURL(file);
    objectUrls.add(url);
    preview.dataset.objectUrl = url;
    preview.src = url;
    preview.classList.add("visible");
}

function clearPreview(prefix) {
    const preview = $(`preview-${prefix}`);
    const old = preview.dataset.objectUrl;
    if (old) {
        URL.revokeObjectURL(old);
        objectUrls.delete(old);
    }
    preview.removeAttribute("src");
    delete preview.dataset.objectUrl;
    preview.classList.remove("visible");
    $(`remove-${prefix}`).classList.remove("visible");
    $(`file-${prefix}`).value = "";
}

function setupUploadZone(prefix, setter) {
    const zone = $(`drop-${prefix}`);
    const input = $(`file-${prefix}`);
    const preview = $(`preview-${prefix}`);
    const remove = $(`remove-${prefix}`);
    zone.addEventListener("click", event => {
        if (event.target.closest("button")) return;
        input.click();
    });
    input.addEventListener("change", () => {
        const file = input.files?.[0] || null;
        if (!file) return;
        replacePreviewUrl(preview, file);
        remove.classList.add("visible");
        setter(file);
        updateAnalyzeButton();
    });
    remove.addEventListener("click", event => {
        event.stopPropagation();
        clearPreview(prefix);
        setter(null);
        updateAnalyzeButton();
    });
    zone.addEventListener("dragover", event => { event.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", event => {
        event.preventDefault();
        zone.classList.remove("dragover");
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;
        try {
            const transfer = new DataTransfer();
            transfer.items.add(file);
            input.files = transfer.files;
        } catch { /* Safari: state is still updated below. */ }
        replacePreviewUrl(preview, file);
        remove.classList.add("visible");
        setter(file);
        updateAnalyzeButton();
    });
}

function updateAnalyzeButton() {
    const button = $("btn-analyze");
    const text = $("analyze-text");
    button.disabled = isAnalyzing || !frontalFile;
    if (isAnalyzing) text.textContent = "Se analizează…";
    else text.textContent = frontalFile ? "Analizează fotografiile" : "Încarcă poza din față";
}

async function decodeImage(file) {
    const objectUrl = URL.createObjectURL(file);
    objectUrls.add(objectUrl);
    try {
        const image = new Image();
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error("Imaginea nu poate fi decodată de acest browser."));
            image.src = objectUrl;
        });
        const scale = Math.min(1, MAX_PROCESS_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas 2D indisponibil.");
        ctx.drawImage(image, 0, 0, width, height);
        return { image, canvas, ctx, objectUrl, originalWidth: image.naturalWidth, originalHeight: image.naturalHeight };
    } catch (error) {
        URL.revokeObjectURL(objectUrl);
        objectUrls.delete(objectUrl);
        throw error;
    }
}

function purgeImageData(data) {
    if (!data) return;
    try {
        data.ctx?.clearRect(0, 0, data.canvas.width, data.canvas.height);
        data.canvas.width = 0;
        data.canvas.height = 0;
        data.image?.removeAttribute("src");
        if (data.objectUrl) {
            URL.revokeObjectURL(data.objectUrl);
            objectUrls.delete(data.objectUrl);
        }
    } catch (error) {
        console.warn("Curățare imagine incompletă.", error);
    }
}

async function detectFace(data) {
    await initFaceLandmarker();
    const result = faceLandmarker.detect(data.image);
    const landmarks = result.faceLandmarks?.[0] || null;
    if (!landmarks || landmarks.length < 468) return null;
    return landmarks;
}

function faceBounds(landmarks) {
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const point of landmarks.slice(0, 468)) {
        minX = Math.min(minX, point.x); minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y);
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function assessPose(landmarks, canvas, expected) {
    const rightEye = {
        x: (landmarks[LM.RIGHT_EYE_OUTER].x + landmarks[LM.RIGHT_EYE_INNER].x) / 2,
        y: (landmarks[LM.RIGHT_EYE_OUTER].y + landmarks[LM.RIGHT_EYE_INNER].y) / 2,
    };
    const leftEye = {
        x: (landmarks[LM.LEFT_EYE_OUTER].x + landmarks[LM.LEFT_EYE_INNER].x) / 2,
        y: (landmarks[LM.LEFT_EYE_OUTER].y + landmarks[LM.LEFT_EYE_INNER].y) / 2,
    };
    const roll = Math.atan2((leftEye.y - rightEye.y) * canvas.height, (leftEye.x - rightEye.x) * canvas.width) * 180 / Math.PI;
    const nose = landmarks[LM.NOSE_TIP];
    const leftTemple = landmarks[LM.TEMPLE_LEFT];
    const rightTemple = landmarks[LM.TEMPLE_RIGHT];
    const leftDistance = Math.abs(nose.x - leftTemple.x);
    const rightDistance = Math.abs(rightTemple.x - nose.x);
    const yawAsymmetry = Math.abs(leftDistance - rightDistance) / Math.max(leftDistance + rightDistance, 0.001);
    const bounds = faceBounds(landmarks);
    const faceCoverage = bounds.width * bounds.height;
    const warnings = [];
    if (Math.abs(roll) > 10) warnings.push(`cap înclinat aproximativ ${Math.round(Math.abs(roll))}°`);
    if (faceCoverage < 0.12) warnings.push("fața ocupă o zonă mică din fotografie");
    if (bounds.minX < 0.01 || bounds.maxX > 0.99 || bounds.minY < 0.01 || bounds.maxY > 0.99) warnings.push("fața este foarte aproape de marginea cadrului");
    if (expected === "frontal" && yawAsymmetry > 0.16) warnings.push("fotografia frontală este prea rotită lateral");
    if (expected === "profil" && yawAsymmetry < 0.10) warnings.push("fotografia de profil pare prea apropiată de o vedere frontală");
    let grade = "Bună";
    if (warnings.length >= 2 || Math.abs(roll) > 18 || (expected === "frontal" && yawAsymmetry > 0.24)) grade = "Slabă";
    else if (warnings.length === 1) grade = "Acceptabilă";
    return { grade, warnings, roll: Number(roll.toFixed(1)), yawAsymmetry: Number(yawAsymmetry.toFixed(3)), faceCoverage: Number(faceCoverage.toFixed(3)) };
}

function sampleAtPoints(canvas, ctx, points, radius = 2) {
    const samples = [];
    for (const point of points.filter(Boolean)) {
        const cx = Math.round(point.x * canvas.width);
        const cy = Math.round(point.y * canvas.height);
        const x0 = clamp(cx - radius, 0, canvas.width - 1);
        const y0 = clamp(cy - radius, 0, canvas.height - 1);
        const x1 = clamp(cx + radius, 0, canvas.width - 1);
        const y1 = clamp(cy + radius, 0, canvas.height - 1);
        const data = ctx.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1).data;
        for (let i = 0; i < data.length; i += 4) samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
    return samples;
}

function skinReference(landmarks, canvas, ctx) {
    const points = [LM.RIGHT_CHEEK_SKIN, LM.LEFT_CHEEK_SKIN, LM.FOREHEAD_SKIN].map(index => landmarks[index]);
    return medianColor(sampleAtPoints(canvas, ctx, points, 3)) || { r: 160, g: 130, b: 115 };
}

function sampleAnnulus(canvas, ctx, center, edgePoints) {
    if (!center || !edgePoints.length) return [];
    const c = pointPx(center, canvas);
    const radii = edgePoints.map(point => distancePx(center, point, canvas));
    const radius = median(radii);
    if (!radius || radius < 2) return [];
    const inner = radius * 0.42;
    const outer = radius * 0.88;
    const x0 = clamp(Math.floor(c.x - outer), 0, canvas.width - 1);
    const y0 = clamp(Math.floor(c.y - outer), 0, canvas.height - 1);
    const x1 = clamp(Math.ceil(c.x + outer), 0, canvas.width - 1);
    const y1 = clamp(Math.ceil(c.y + outer), 0, canvas.height - 1);
    const image = ctx.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    const samples = [];
    for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
            const d = Math.hypot(x - c.x, y - c.y);
            if (d < inner || d > outer) continue;
            const offset = ((y - y0) * image.width + (x - x0)) * 4;
            const color = { r: image.data[offset], g: image.data[offset + 1], b: image.data[offset + 2] };
            const lum = luminance(color);
            if (lum > 28 && lum < 225) samples.push(color);
        }
    }
    return samples;
}

function classifyEyes(landmarks, canvas, ctx, faceWidth) {
    const rightWidth = distancePx(landmarks[LM.RIGHT_EYE_OUTER], landmarks[LM.RIGHT_EYE_INNER], canvas);
    const leftWidth = distancePx(landmarks[LM.LEFT_EYE_OUTER], landmarks[LM.LEFT_EYE_INNER], canvas);
    const eyeRatio = mean([rightWidth, leftWidth]) / faceWidth;
    const marime = classifyEyeSizeRatio(eyeRatio);
    const rightColor = medianColor(sampleAnnulus(canvas, ctx, landmarks[LM.RIGHT_IRIS_CENTER], LM.RIGHT_IRIS_EDGE.map(i => safeLandmark(landmarks, i))));
    const leftColor = medianColor(sampleAnnulus(canvas, ctx, landmarks[LM.LEFT_IRIS_CENTER], LM.LEFT_IRIS_EDGE.map(i => safeLandmark(landmarks, i))));
    const rightHsv = rightColor ? rgbToHsv(rightColor.r, rightColor.g, rightColor.b) : null;
    const leftHsv = leftColor ? rgbToHsv(leftColor.r, leftColor.g, leftColor.b) : null;
    const rightLabel = classifyIrisHsv(rightHsv);
    const leftLabel = classifyIrisHsv(leftHsv);
    let culoare = rightLabel !== "Nedeterminată" ? rightLabel : leftLabel;
    let observatie = null;
    if (rightHsv && leftHsv && rightLabel !== leftLabel) {
        const meaningfulDifference = hueDistance(rightHsv.h, leftHsv.h) > 45 && Math.max(rightHsv.s, leftHsv.s) > 0.18;
        if (meaningfulDifference) {
            culoare = "Posibilă heterocromie — de verificat";
            observatie = `${rightLabel} / ${leftLabel}`;
        } else {
            culoare = rightHsv.s >= leftHsv.s ? rightLabel : leftLabel;
            observatie = "Diferență mică între cei doi ochi; posibil efect de iluminare.";
        }
    }
    return { culoare, marime, observatie, raportOchi: Number(eyeRatio.toFixed(3)) };
}

function classifyForehead(landmarks, canvas, faceWidth) {
    const top = pointPx(landmarks[LM.TOP_FACE], canvas);
    const browY = mean([landmarks[LM.RIGHT_BROW_TOP].y, landmarks[LM.LEFT_BROW_TOP].y]) * canvas.height;
    const faceHeight = distancePx(landmarks[LM.TOP_FACE], landmarks[LM.CHIN], canvas);
    const foreheadHeight = Math.max(0, browY - top.y);
    const foreheadWidth = distancePx(landmarks[LM.FOREHEAD_LEFT], landmarks[LM.FOREHEAD_RIGHT], canvas);
    const heightRatio = foreheadHeight / faceHeight;
    const widthRatio = foreheadWidth / faceWidth;
    return { ...classifyForeheadRatios(widthRatio, heightRatio), raportLatime: Number(widthRatio.toFixed(3)), raportInaltime: Number(heightRatio.toFixed(3)) };
}

function classifyFaceType(landmarks, canvas) {
    const foreheadW = distancePx(landmarks[LM.FOREHEAD_LEFT], landmarks[LM.FOREHEAD_RIGHT], canvas);
    const cheekW = distancePx(landmarks[LM.TEMPLE_LEFT], landmarks[LM.TEMPLE_RIGHT], canvas);
    const jawW = distancePx(landmarks[LM.JAW_LEFT], landmarks[LM.JAW_RIGHT], canvas);
    const lowerJawW = distancePx(landmarks[LM.LOWER_JAW_LEFT], landmarks[LM.LOWER_JAW_RIGHT], canvas);
    const faceH = distancePx(landmarks[LM.TOP_FACE], landmarks[LM.CHIN], canvas);
    const ratio = faceH / cheekW;
    const jawRatio = jawW / cheekW;
    const foreheadRatio = foreheadW / cheekW;
    const taper = lowerJawW / jawW;
    const cheekDominance = cheekW > foreheadW * 1.06 && cheekW > jawW * 1.08;
    const tip = classifyFaceShapeMetrics({ ratio, jawRatio, foreheadRatio, taper, cheekDominance });
    return { tip, raportLungimeLatime: Number(ratio.toFixed(3)), raportMaxilar: Number(jawRatio.toFixed(3)), raportFrunte: Number(foreheadRatio.toFixed(3)) };
}

function classifyMouth(landmarks, canvas, faceWidth) {
    const mouthW = distancePx(landmarks[LM.MOUTH_RIGHT], landmarks[LM.MOUTH_LEFT], canvas);
    const mouthRatio = mouthW / faceWidth;
    const cornerY = mean([landmarks[LM.MOUTH_RIGHT].y, landmarks[LM.MOUTH_LEFT].y]) * canvas.height;
    const lipCenterY = mean([landmarks[LM.MOUTH_TOP].y, landmarks[LM.MOUTH_BOTTOM].y]) * canvas.height;
    const normalizedDelta = (cornerY - lipCenterY) / mouthW;
    return { ...classifyMouthMetrics(mouthRatio, normalizedDelta), raportGura: Number(mouthRatio.toFixed(3)), inclinareColturi: Number(normalizedDelta.toFixed(3)) };
}

function classifyChin(landmarks, canvas) {
    const jawW = distancePx(landmarks[LM.JAW_LEFT], landmarks[LM.JAW_RIGHT], canvas);
    const lowerW = distancePx(landmarks[LM.LOWER_JAW_LEFT], landmarks[LM.LOWER_JAW_RIGHT], canvas);
    const taper = lowerW / jawW;
    return { tip: classifyChinTaper(taper), raportConicitate: Number(taper.toFixed(3)) };
}

function classifyNose(frontalLandmarks, frontalCanvas, profileLandmarks, profileCanvas) {
    const frontalFaceWidth = distancePx(frontalLandmarks[LM.TEMPLE_LEFT], frontalLandmarks[LM.TEMPLE_RIGHT], frontalCanvas);
    const noseWidth = distancePx(frontalLandmarks[LM.RIGHT_NOSTRIL], frontalLandmarks[LM.LEFT_NOSTRIL], frontalCanvas) / frontalFaceWidth;
    const latime = classifyNoseWidthRatio(noseWidth);
    if (!profileLandmarks || !profileCanvas) {
        return { tip: "Nedeterminat — necesită profil", latime, sursaAnaliza: "frontal", precizieRedusa: true, raportLatime: Number(noseWidth.toFixed(3)) };
    }
    const a = pointPx(profileLandmarks[LM.NOSE_BRIDGE_TOP], profileCanvas);
    const m = pointPx(profileLandmarks[LM.NOSE_BRIDGE_MID], profileCanvas);
    const b = pointPx(profileLandmarks[LM.NOSE_BRIDGE_BOTTOM], profileCanvas);
    const tipPoint = pointPx(profileLandmarks[LM.NOSE_TIP], profileCanvas);
    const profileFaceWidth = distancePx(profileLandmarks[LM.TEMPLE_LEFT], profileLandmarks[LM.TEMPLE_RIGHT], profileCanvas) || profileCanvas.width * 0.25;
    const midDistance = signedDistanceToLine(m, a, b);
    const tipDistance = signedDistanceToLine(tipPoint, a, b);
    const outwardSign = Math.sign(tipDistance) || 1;
    const curvature = (midDistance * outwardSign) / profileFaceWidth;
    return { tip: classifyNoseCurvature(curvature), latime, sursaAnaliza: "profil", precizieRedusa: false, curburaProfil: Number(curvature.toFixed(3)), raportLatime: Number(noseWidth.toFixed(3)) };
}

function sampleHairRegion(landmarks, canvas, ctx) {
    const top = landmarks[LM.TOP_FACE];
    const left = landmarks[LM.FOREHEAD_LEFT];
    const right = landmarks[LM.FOREHEAD_RIGHT];
    const faceHeight = distancePx(landmarks[LM.TOP_FACE], landmarks[LM.CHIN], canvas);
    const points = [];
    for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            const x = left.x + (right.x - left.x) * (col / 8);
            const yOffsetPx = faceHeight * (0.06 + row * 0.045);
            points.push({ x, y: clamp(top.y - yOffsetPx / canvas.height, 0.01, 0.98) });
        }
    }
    return sampleAtPoints(canvas, ctx, points, 2);
}

function classifyHair(landmarks, canvas, ctx, skin) {
    const samples = sampleHairRegion(landmarks, canvas, ctx);
    if (!samples.length) return { culoare: "Nedeterminată", textura: "Nedeterminată", calvitie: "Nedeterminată" };
    const skinLum = luminance(skin);
    const candidates = samples.filter(color => {
        const hsv = rgbToHsv(color.r, color.g, color.b);
        return luminance(color) < skinLum - 16 || hsv.s > 0.16;
    });
    const coverage = candidates.length / samples.length;
    const color = medianColor(candidates) || { r: 0, g: 0, b: 0 };
    const hsv = rgbToHsv(color.r, color.g, color.b);
    const features = {
        coverage,
        luminance: luminance(color),
        hue: hsv.h,
        saturation: hsv.s,
        textureVariance: variance(candidates.map(luminance)),
    };
    return { ...classifyHairMetrics(features), acoperirePar: Number(coverage.toFixed(3)) };
}

function classifyEyebrows(landmarks, canvas, ctx, skin) {
    const groups = [
        [LM.RIGHT_BROW_OUTER, LM.RIGHT_BROW_TOP, LM.RIGHT_BROW_INNER],
        [LM.LEFT_BROW_OUTER, LM.LEFT_BROW_TOP, LM.LEFT_BROW_INNER],
    ];
    const curvatures = groups.map(indices => {
        const [outer, top, inner] = indices.map(index => pointPx(landmarks[index], canvas));
        const baseY = (outer.y + inner.y) / 2;
        return Math.abs(top.y - baseY) / Math.max(Math.abs(inner.x - outer.x), 1);
    });
    const samples = sampleAtPoints(canvas, ctx, groups.flat().map(index => landmarks[index]), 4);
    const threshold = luminance(skin) - Math.max(22, luminance(skin) * 0.16);
    const darkRatio = samples.length ? samples.filter(color => luminance(color) < threshold).length / samples.length : 0;
    return classifyEyebrowMetrics(mean(curvatures), darkRatio);
}

function classifyFacialHair(landmarks, canvas, ctx, skin) {
    const skinLum = luminance(skin);
    const beardPoints = [172, 136, 150, 149, 152, 378, 379, 365, 397].map(index => landmarks[index]);
    const beardSamples = sampleAtPoints(canvas, ctx, beardPoints, 4);
    const beardThreshold = skinLum - Math.max(24, skinLum * 0.18);
    const beardDark = beardSamples.length ? beardSamples.filter(color => luminance(color) < beardThreshold).length / beardSamples.length : 0;
    const beardVariance = variance(beardSamples.map(luminance));
    const right = landmarks[LM.MOUTH_RIGHT], left = landmarks[LM.MOUTH_LEFT], upper = landmarks[LM.UPPER_LIP_SKIN];
    const mustachePoints = [];
    for (let t = 0; t <= 1.001; t += 0.125) mustachePoints.push({ x: right.x + (left.x - right.x) * t, y: upper.y - 0.004 });
    const mustacheSamples = sampleAtPoints(canvas, ctx, mustachePoints, 3);
    const mustacheThreshold = skinLum - Math.max(22, skinLum * 0.16);
    const mustacheDark = mustacheSamples.length ? mustacheSamples.filter(color => luminance(color) < mustacheThreshold).length / mustacheSamples.length : 0;
    return classifyFacialHairMetrics({ beardDark, beardVariance, mustacheDark });
}

function classifyEars(profileLandmarks, profileCanvas) {
    if (!profileLandmarks || !profileCanvas) return { forma: "Nedeterminată", marime: "Nedeterminată", lob: "Nedeterminat", observatie: "Necesită fotografie de profil și evaluare manuală." };
    return {
        forma: "Nedeterminată",
        marime: "Nedeterminată",
        lob: "Nedeterminat",
        observatie: "Reperele MediaPipe nu sunt suficiente pentru o clasificare automată robustă a pavilionului auricular. Completează manual pe baza fotografiei de profil.",
    };
}

function automaticSnapshot(results) {
    const snapshot = deepClone(normalizeBase(results));
    snapshot.semneParticulare = "";
    return snapshot;
}

function correctionCount() {
    return Object.keys(currentResults?.manualCorrections || {}).length;
}

function updateReviewSummary() {
    const count = correctionCount();
    const countElement = $("manual-correction-count");
    if (countElement) countElement.textContent = String(count);
    const state = $("review-state");
    if (state) state.textContent = count ? `${count} câmp${count === 1 ? "" : "uri"} corectat${count === 1 ? "" : "e"} manual` : "Nicio corecție manuală";
}

function applyEdit(path, value, field) {
    if (!currentResults) return;
    const automatic = getPath(currentResults.automaticResults, path);
    setPath(currentResults, path, value);
    currentResults.manualCorrections = recordCorrection(
        currentResults.manualCorrections,
        path,
        automatic,
        value,
    );
    refreshFieldState(field, automatic, value);
    currentResults.operatorReview = { ...(currentResults.operatorReview || {}), lastModifiedAt: new Date().toISOString() };
    updateReviewSummary();
}

function refreshFieldState(field, automatic, current) {
    const corrected = !valuesEqual(automatic, current);
    field.classList.toggle("is-corrected", corrected);
    const badge = field.querySelector(".edit-state-badge");
    if (badge) {
        badge.textContent = corrected ? "CORECTAT" : "AUTO";
        badge.classList.toggle("corrected", corrected);
    }
    const auto = field.querySelector(".automatic-value");
    if (auto) {
        auto.hidden = !corrected;
        auto.textContent = `Automat: ${automatic ?? "Nedeterminat"}`;
    }
    const revert = field.querySelector(".revert-field");
    if (revert) revert.hidden = !corrected;
}

function editableField(schema) {
    const wrapper = document.createElement("div");
    wrapper.className = "field editable-field";
    wrapper.dataset.resultPath = schema.path;
    const header = document.createElement("div");
    header.className = "field-label-row";
    const label = document.createElement("label");
    label.className = "field-label";
    const controlId = `field-${schema.path.replace(/\./g, "-")}`;
    label.htmlFor = controlId;
    label.textContent = schema.label;
    const badge = document.createElement("span");
    badge.className = "edit-state-badge";
    header.append(label, badge);

    const automatic = getPath(currentResults.automaticResults, schema.path) ?? "Nedeterminat";
    const current = getPath(currentResults, schema.path) ?? automatic;
    let control;
    if (schema.freeText) {
        control = document.createElement("input");
        control.type = "text";
        control.value = current;
    } else {
        control = document.createElement("select");
        const options = [...new Set([String(current), String(automatic), ...(schema.options || [])])];
        for (const value of options) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            control.appendChild(option);
        }
        control.value = current;
    }
    control.id = controlId;
    control.className = "result-editor";
    control.dataset.autoValue = String(automatic);
    control.addEventListener(schema.freeText ? "input" : "change", () => applyEdit(schema.path, control.value.trim(), wrapper));

    const footer = document.createElement("div");
    footer.className = "edit-meta";
    const autoValue = document.createElement("span");
    autoValue.className = "automatic-value";
    const revert = document.createElement("button");
    revert.type = "button";
    revert.className = "revert-field";
    revert.textContent = "Revino la automat";
    revert.addEventListener("click", () => {
        control.value = automatic;
        applyEdit(schema.path, automatic, wrapper);
        control.focus();
    });
    footer.append(autoValue, revert);
    wrapper.append(header, control, footer);
    refreshFieldState(wrapper, automatic, current);
    return wrapper;
}

function noteField(text) {
    if (!text) return null;
    const paragraph = document.createElement("p");
    paragraph.className = "result-note";
    paragraph.textContent = text;
    return paragraph;
}

function textField(label, value) {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const labelElement = document.createElement("span");
    labelElement.className = "field-label";
    labelElement.textContent = label;
    const valueElement = document.createElement("span");
    valueElement.className = "field-value";
    valueElement.textContent = value ?? "Nedeterminat";
    wrapper.append(labelElement, valueElement);
    return wrapper;
}

function createCard(title, fields, className = "") {
    const card = document.createElement("div");
    card.className = `result-card ${className}`.trim();
    const titleElement = document.createElement("div");
    titleElement.className = "card-title";
    titleElement.textContent = title;
    card.appendChild(titleElement);
    fields.filter(Boolean).forEach(field => card.appendChild(field));
    return card;
}

function renderResults(results) {
    const grid = $("results-grid");
    grid.replaceChildren();

    const review = document.createElement("div");
    review.className = "review-summary";
    review.innerHTML = `<div><strong>Revizuire operator</strong><span id="review-state"></span></div><div class="review-count"><span id="manual-correction-count">0</span> corecții</div>`;
    const confirm = document.createElement("label");
    confirm.className = "review-confirmation";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "review-confirmed";
    checkbox.checked = Boolean(results.operatorReview?.confirmed);
    checkbox.addEventListener("change", () => {
        currentResults.operatorReview = { ...(currentResults.operatorReview || {}), confirmed: checkbox.checked, confirmedAt: checkbox.checked ? new Date().toISOString() : null };
    });
    confirm.append(checkbox, document.createTextNode(" Am verificat manual valorile pe fotografiile originale."));
    review.appendChild(confirm);
    grid.appendChild(review);

    const cards = new Map();
    for (const schema of FIELD_SCHEMA) {
        if (!cards.has(schema.card)) cards.set(schema.card, []);
        cards.get(schema.card).push(editableField(schema));
    }
    for (const [title, fields] of cards) {
        if (title === "Nasul" && results.nas.precizieRedusa) fields.push(noteField("Forma profilului nazal nu poate fi dedusă fiabil din fotografia frontală; poate fi completată manual."));
        if (title === "Ochii" && results.ochi.observatie) fields.push(noteField(results.ochi.observatie));
        if (title === "Urechile" && results.urechi.observatie) fields.push(noteField(results.urechi.observatie));
        grid.appendChild(createCard(title, fields));
    }

    const manual = document.createElement("div");
    manual.className = "field";
    const semneLabel = document.createElement("label");
    semneLabel.className = "field-label";
    semneLabel.htmlFor = "semne-text";
    semneLabel.textContent = "Tatuaje, cicatrici, alunițe sau alte observații";
    const textarea = document.createElement("textarea");
    textarea.id = "semne-text";
    textarea.rows = 3;
    textarea.placeholder = "Completează manual…";
    textarea.value = results.semneParticulare || "";
    textarea.addEventListener("input", () => { currentResults.semneParticulare = textarea.value; });
    manual.append(semneLabel, textarea);
    grid.appendChild(createCard("Semne particulare", [manual]));

    const warnings = [...(results.calitate.frontal?.warnings || []), ...(results.calitate.profil?.warnings || [])];
    const qualityFields = [textField("Fotografie frontală", results.calitate.frontal?.grade || "Nedeterminată")];
    if (results.calitate.profil) qualityFields.push(textField("Fotografie profil", results.calitate.profil.grade));
    qualityFields.push(noteField(warnings.length ? `Atenționări: ${warnings.join("; ")}.` : "Nu au fost identificate probleme majore de încadrare/orientare prin verificările geometrice automate."));
    qualityFields.push(noteField("Valorile AUTO provin din motor. Valorile marcate CORECTAT sunt intervenții manuale și sunt păstrate separat în JSON pentru trasabilitate."));
    grid.appendChild(createCard("Calitatea analizei", qualityFields, "quality-card"));
    updateReviewSummary();
}

function normalizeBase(data = {}) {
    return {
        frunte: data.frunte || { tip: "Nedeterminată", detalii: "Nedeterminate" },
        nas: data.nas || { tip: "Nedeterminat", latime: "Nedeterminată", precizieRedusa: true },
        ochi: data.ochi || { culoare: "Nedeterminată", marime: "Nedeterminată" },
        gura: data.gura || { colturi: "Nedeterminate", marime: "Nedeterminată" },
        barbie: data.barbie || { tip: "Nedeterminată" },
        tipFata: data.tipFata || { tip: "Nedeterminată" },
        par: data.par || { culoare: "Nedeterminată", textura: "Nedeterminată", calvitie: "Nedeterminată" },
        sprancene: Array.isArray(data.sprancene) ? data.sprancene : ["Nedeterminate", "Nedeterminată"],
        barba: data.barba || "Nedeterminată",
        mustata: data.mustata || "Nedeterminată",
        urechi: data.urechi || { forma: "Nedeterminată", marime: "Nedeterminată", lob: "Nedeterminat" },
        semneParticulare: data.semneParticulare || "",
        calitate: data.calitate || { frontal: { grade: "Necunoscută", warnings: ["Fișă creată cu o versiune anterioară a motorului."] }, profil: null },
    };
}

function normalizeLoadedData(data) {
    const effective = normalizeBase(data);
    const automatic = data.automaticResults ? normalizeBase(data.automaticResults) : normalizeBase(data);
    return {
        ...effective,
        automaticResults: automaticSnapshot(automatic),
        manualCorrections: data.manualCorrections && typeof data.manualCorrections === "object" ? data.manualCorrections : {},
        operatorReview: data.operatorReview || { confirmed: false, confirmedAt: null },
        dataAnaliza: data.dataAnaliza,
        engineVersion: data.engineVersion || "legacy",
    };
}

function collectResults() {
    if (!currentResults) return null;
    const output = deepClone(currentResults);
    output.semneParticulare = $("semne-text")?.value?.trim() || "";
    output.dataAnaliza = new Date().toISOString();
    output.engineVersion = ENGINE_VERSION;
    output.operatorReview = {
        ...(output.operatorReview || {}),
        confirmed: Boolean($("review-confirmed")?.checked),
        manualCorrectionsCount: Object.keys(output.manualCorrections || {}).length,
        automaticBaselinePreserved: true,
    };
    return output;
}

function saveResults() {
    const data = collectResults();
    if (!data) return alert("Nu există rezultate de salvat.");
    try {
        const key = `${STORAGE_PREFIX}${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(data));
        renderSavedList();
        setStatus(data.operatorReview.confirmed ? "Fișa verificată a fost salvată local." : "Fișa a fost salvată local, dar nu este marcată ca verificată de operator.", data.operatorReview.confirmed ? "success" : "info");
    } catch (error) {
        alert(`Eroare la salvare: ${error.message}`);
    }
}

function exportResults() {
    const data = collectResults();
    if (!data) return alert("Nu există rezultate de exportat.");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `semnalmente_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function savedKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    return keys.sort().reverse();
}

function renderSavedList() {
    const container = $("saved-items");
    container.replaceChildren();
    const keys = savedKeys();
    if (!keys.length) {
        const empty = document.createElement("p");
        empty.style.cssText = "color:var(--text-secondary);font-size:.85rem;";
        empty.textContent = "Nicio fișă salvată.";
        container.appendChild(empty);
        return;
    }
    for (const key of keys) {
        let data;
        try { data = JSON.parse(localStorage.getItem(key)); } catch { data = null; }
        const item = document.createElement("div");
        item.className = "saved-item";
        const info = document.createElement("span");
        const strong = document.createElement("strong");
        strong.textContent = key;
        const date = document.createElement("span");
        date.className = "saved-date";
        const parsedDate = data?.dataAnaliza ? new Date(data.dataAnaliza) : null;
        const correctionTotal = Object.keys(data?.manualCorrections || {}).length;
        const reviewState = data?.operatorReview?.confirmed ? "verificată" : "neverificată";
        date.textContent = `${parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleString("ro-RO") : "dată necunoscută"} · ${reviewState} · ${correctionTotal} corecții`;
        info.append(strong, document.createElement("br"), date);
        const actions = document.createElement("div");
        actions.className = "saved-actions";
        const load = document.createElement("button");
        load.type = "button";
        load.textContent = "Încarcă";
        load.addEventListener("click", () => data && loadSavedData(data));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete";
        remove.textContent = "Șterge";
        remove.addEventListener("click", () => {
            if (!confirm("Ștergi această fișă?")) return;
            localStorage.removeItem(key);
            renderSavedList();
        });
        actions.append(load, remove);
        item.append(info, actions);
        container.appendChild(item);
    }
}

function loadSavedData(data) {
    currentResults = normalizeLoadedData(deepClone(data));
    renderResults(currentResults);
    $("results-section").classList.add("visible");
    const source = currentResults.engineVersion === "legacy" ? "motor anterior" : `motor ${currentResults.engineVersion}`;
    setStatus(`Fișă încărcată (${source}); valorile automate și corecțiile existente sunt păstrate separat.`, "info");
    $("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetCurrent() {
    if (!confirm("Resetezi analiza curentă? Fișele deja salvate rămân în arhiva locală.")) return;
    currentResults = null;
    frontalFile = null;
    profileFile = null;
    clearPreview("frontal");
    clearPreview("profil");
    $("results-section").classList.remove("visible");
    $("results-grid").replaceChildren();
    $("status").className = "status";
    $("status").textContent = "";
    updateAnalyzeButton();
}

async function runAnalysis() {
    if (isAnalyzing || !frontalFile) return;
    isAnalyzing = true;
    updateAnalyzeButton();
    $("analyze-spinner").style.display = "inline-block";
    $("results-section").classList.remove("visible");
    currentResults = null;
    setStatus("Se detectează reperele faciale și se verifică geometria fotografiilor…", "info");
    let frontal = null;
    let profile = null;
    try {
        frontal = await decodeImage(frontalFile);
        const frontalLandmarks = await detectFace(frontal);
        if (!frontalLandmarks) throw new Error("Nu a fost detectată o singură față suficient de clară în fotografia frontală.");
        const frontalQuality = assessPose(frontalLandmarks, frontal.canvas, "frontal");
        let profileLandmarks = null;
        let profileQuality = null;
        if (profileFile) {
            try {
                profile = await decodeImage(profileFile);
                profileLandmarks = await detectFace(profile);
                if (profileLandmarks) profileQuality = assessPose(profileLandmarks, profile.canvas, "profil");
                else profileQuality = { grade: "Slabă", warnings: ["nu au fost detectate repere faciale în fotografia de profil"] };
            } catch (error) {
                console.warn("Fotografia de profil nu a putut fi folosită.", error);
                profileQuality = { grade: "Slabă", warnings: [error.message] };
            }
        }
        const faceWidth = distancePx(frontalLandmarks[LM.TEMPLE_LEFT], frontalLandmarks[LM.TEMPLE_RIGHT], frontal.canvas);
        if (faceWidth < 40) throw new Error("Fața este prea mică în fotografie pentru o analiză utilă.");
        const skin = skinReference(frontalLandmarks, frontal.canvas, frontal.ctx);
        const facialHair = classifyFacialHair(frontalLandmarks, frontal.canvas, frontal.ctx, skin);
        const automatic = {
            frunte: classifyForehead(frontalLandmarks, frontal.canvas, faceWidth),
            nas: classifyNose(frontalLandmarks, frontal.canvas, profileLandmarks, profile?.canvas || null),
            ochi: classifyEyes(frontalLandmarks, frontal.canvas, frontal.ctx, faceWidth),
            gura: classifyMouth(frontalLandmarks, frontal.canvas, faceWidth),
            barbie: classifyChin(frontalLandmarks, frontal.canvas),
            tipFata: classifyFaceType(frontalLandmarks, frontal.canvas),
            par: classifyHair(frontalLandmarks, frontal.canvas, frontal.ctx, skin),
            sprancene: classifyEyebrows(frontalLandmarks, frontal.canvas, frontal.ctx, skin),
            barba: facialHair.barba,
            mustata: facialHair.mustata,
            urechi: classifyEars(profileLandmarks, profile?.canvas || null),
            semneParticulare: "",
            calitate: { frontal: frontalQuality, profil: profileQuality },
        };
        currentResults = {
            ...deepClone(automatic),
            automaticResults: automaticSnapshot(automatic),
            manualCorrections: {},
            operatorReview: { confirmed: false, confirmedAt: null, lastModifiedAt: null },
            engineVersion: ENGINE_VERSION,
        };
        renderResults(currentResults);
        $("results-section").classList.add("visible");
        const degraded = frontalQuality.grade === "Slabă" || profileQuality?.grade === "Slabă";
        setStatus(degraded ? "Analiza a fost finalizată, dar există probleme de calitate. Corectează manual câmpurile neconvingătoare și verifică fotografia originală." : "Analiza a fost finalizată. Fiecare câmp poate fi corectat manual; valoarea automată rămâne păstrată în fișă.", degraded ? "info" : "success");
        $("results-section").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        console.error(error);
        setStatus(`Analiza nu a putut fi finalizată: ${error.message}`, "error");
    } finally {
        purgeImageData(frontal);
        purgeImageData(profile);
        isAnalyzing = false;
        $("analyze-spinner").style.display = "none";
        updateAnalyzeButton();
    }
}

async function initApp() {
    ensureEditorStyles();
    setupUploadZone("frontal", file => { frontalFile = file; });
    setupUploadZone("profil", file => { profileFile = file; });
    $("btn-analyze").addEventListener("click", runAnalysis);
    $("btn-save").addEventListener("click", saveResults);
    $("btn-export").addEventListener("click", exportResults);
    $("btn-reset").addEventListener("click", resetCurrent);
    renderSavedList();
    updateAnalyzeButton();
    try {
        await initFaceLandmarker();
        console.info(`Motorul de analiză ${ENGINE_VERSION} este pregătit.`);
    } catch (error) {
        console.error("MediaPipe nu a putut fi inițializat.", error);
        setStatus("Modelul MediaPipe nu a putut fi încărcat. Verifică accesul la internet/CDN și reîncarcă pagina.", "error");
    }
}

window.addEventListener("beforeunload", () => {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls.clear();
    try { faceLandmarker?.close?.(); } catch { /* no-op */ }
});

initApp();

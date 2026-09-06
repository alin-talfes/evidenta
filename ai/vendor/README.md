# Dependențe locale pentru AI Documente

Modulul AI folosește o strategie **local-first**. Dacă fișierele de mai jos există, sunt utilizate înaintea fallback-urilor CDN. Dacă lipsesc, aplicația rămâne funcțională și folosește versiunile externe fixate, cu Cache Storage pentru scripturi și cache IndexedDB Tesseract pentru modelul lingvistic.

Structura așteptată:

```text
ai/vendor/
├── pdfjs/
│   ├── pdf.min.js
│   └── pdf.worker.min.js
├── tesseract/
│   ├── tesseract.min.js
│   └── worker.min.js
├── tesseract-core/
│   ├── tesseract-core.wasm.js
│   ├── tesseract-core-simd.wasm.js
│   ├── tesseract-core-lstm.wasm.js
│   ├── tesseract-core-simd-lstm.wasm.js
│   ├── tesseract-core-relaxedsimd.wasm.js
│   └── tesseract-core-relaxedsimd-lstm.wasm.js
└── tessdata-best/
    └── ron.traineddata.gz
```

Versiuni țintă:
- PDF.js 3.11.174
- Tesseract.js 7.0.0
- tesseract.js-core 7.0.0
- `ron.traineddata.gz` din profilul `4.0.0_best`

Nu se schimbă motorul juridic. Aceste fișiere servesc exclusiv stratul PDF/OCR.

Important: pentru `corePath`, păstrarea tuturor variantelor disponibile este preferabilă indicării unui singur core, deoarece Tesseract.js selectează implementarea potrivită în funcție de capabilitățile WASM/SIMD ale browserului. După adăugarea asset-urilor binare, aplicația le va detecta automat fără altă schimbare în controller.

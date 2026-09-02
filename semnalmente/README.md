# Semnalmente — analiză facială asistată

Aplicație web client-side pentru generarea asistată a unei fișe descriptive de semnalmente faciale, pornind de la o fotografie frontală și, opțional, una din profil.

## Motor 3.0 și revizuire auditabilă

Motorul activ păstrează corecțiile geometrice introduse în v2 și folosește reguli de clasificare separate și testabile. Fiecare rezultat automat poate fi corectat direct în fișă. JSON-ul păstrează simultan valoarea efectivă, `automaticResults` (baseline-ul motorului) și `manualCorrections` (câmp, valoare automată, valoare corectată și momentul modificării).

Operatorul poate marca explicit că a verificat valorile pe fotografiile originale. Salvarea este permisă și fără această confirmare, dar fișa rămâne marcată ca neverificată.

## Benchmark 1.4

`benchmark.html` oferă evaluarea separată a motorului pe cazuri etalon. Sunt calculate accuracy micro/macro, coverage/abstention, macro-F1, matrice de confuzie, performanță pe versiune și pe calitatea fotografiei.

Versiunea 1.4 adaugă:

- acord inter-evaluatori prin acord brut și Cohen's kappa, pe pereche de evaluatori și categorie;
- diagnostic automat al celor mai frecvente confuzii, claselor cu recall redus și categoriilor cu abstention ridicat;
- extragerea unor metrici numerice din `automaticResults` în câmpul `features`, fără imagini sau landmark-uri;
- căutarea exploratorie a pragurilor candidate pentru clasificatoarele unidimensionale;
- comparație între pragul actual și candidat prin macro-F1 și accuracy;
- interdicție arhitecturală de aplicare automată: modulul de benchmark nu scrie și nu modifică `classifier-rules.js`.

Cazurile vechi fără `features` rămân compatibile pentru toate metricile de performanță, dar nu participă la optimizarea pragurilor.

## Testare

Pragurile categorice sunt centralizate în `classifier-rules.js`. `result-audit.js` conține logica pură pentru trasabilitatea corecțiilor. `calibration-metrics.js` calculează benchmark-ul de bază, iar `advanced-calibration.js` calculează acordul inter-evaluatori, hotspot-urile și propunerile de prag.

Rulează local:

```bash
npm test
```

GitHub Actions rulează aceleași teste la fiecare push și pull request pe `main`.

## Calibrare

`docs/CALIBRATION.md` descrie protocolul recomandat, iar `calibration-schema.json` definește formatul cazurilor. `reference` reprezintă referința finală/adjudicată. Câmpul opțional `ratings` poate conține evaluări independente, iar `features` poate conține numai metricile numerice necesare analizei pragurilor.

Testele unitare demonstrează stabilitatea implementării, nu acuratețe biometrică sau criminalistică. Orice concluzie despre acuratețe trebuie obținută pe un set de referință independent și reprezentativ.

## Funcționalități

- fotografie frontală obligatorie și profil opțional;
- MediaPipe Face Landmarker cu fallback GPU → CPU;
- verificări geometrice de calitate a fotografiei;
- clasificări pentru frunte, nas, ochi, gură, bărbie, tipul feței, păr, sprâncene, barbă și mustață;
- urechi completabile manual atunci când modelul nu oferă repere suficiente;
- toate câmpurile descriptive pot fi corectate manual;
- baseline automat și corecții manuale păstrate separat;
- confirmare explicită a revizuirii de către operator;
- salvare în `localStorage`, import/export JSON, copiere și tipărire;
- benchmark local și export de rapoarte agregate;
- compatibilitate cu fișele produse de versiunile anterioare;
- temă dark/light și interfață responsive.

## Structură

- `index.html` — interfața aplicației;
- `style.css`, `editor.css` — stilurile aplicației și editorului;
- `engine-v2.js` — bootstrap de compatibilitate;
- `engine-v3.js` — motorul activ;
- `classifier-rules.js` — reguli categorice pure și praguri de producție;
- `result-audit.js` — auditarea corecțiilor;
- `benchmark.html`, `benchmark.js`, `benchmark.css` — benchmark-ul;
- `calibration-metrics.js` — metricile de bază;
- `advanced-calibration.js`, `advanced-benchmark.css` — diagnostic statistic avansat;
- `tests/` — teste unitare;
- `.github/workflows/tests.yml` — CI;
- `docs/CALIBRATION.md` — protocol de calibrare;
- `calibration-schema.json` — schema cazurilor;
- `version.json` — versiunea afișată.

## MediaPipe și confidențialitate

Aplicația este momentan fixată pe `@mediapipe/tasks-vision 0.10.14`; upgrade-ul major al dependenței trebuie făcut separat și testat regresiv.

Fotografiile sunt analizate în browser și aplicația nu le trimite către un backend propriu. Browserul descarcă biblioteca MediaPipe și modelul din resurse externe. Rezultatele sunt euristice, nu identificare facială și nu un instrument forensic validat. Orice utilizare operațională necesită verificarea rezultatului pe fotografia originală.

## Rulare

Servește proiectul prin HTTP(S), de exemplu GitHub Pages. Deschiderea directă prin `file://` nu este recomandată deoarece aplicația folosește module ES, import map și resurse externe.

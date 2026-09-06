# Changelog

## 1.0.1 — 2026-09-06

Pachet Security & Privacy concentrat pe documentele reale încărcate în modulul AI.

### Securitate AI Documente
- PDF.js securizat la versiunea 6.2.108.
- `isEvalSupported`, scripting, XFA și WASM PDF.js dezactivate explicit la parsarea documentelor.
- CSP dedicată pentru pagina AI; vechiul CDN PDF.js nu mai este permis de politica paginii.
- Selectorul de documente rămâne blocat până la inițializarea PDF/OCR.
- Preflight PDF: magic-header `%PDF-` și blocarea elementelor active JavaScript/OpenAction/Launch/EmbeddedFile/RichMedia/SubmitForm.
- După selectarea unui document se blochează conexiunile externe din thread-ul principal al paginii AI.
- Datele sensibile din DOM sunt golite la părăsirea paginii; documentele nu sunt salvate de modulul AI.
- Fixture-urile publice de benchmark au fost înlocuite cu valori complet sintetice.
- Extractorul pentru deduceri mixte din documentele benchmark este activ și în runtime-ul paginii AI.

### Domeniu
- GitHub Pages și celelalte module rămân publice și fără login.
- Modulele obișnuite sunt destinate datelor fictive/de test; hardening-ul 1.0.1 vizează fluxul PDF/imagine din AI Documente.

## 1.0.0 — 2026-09-06

Prima versiune stabilă a suitei Evidență PPL.

### Stabilizat
- Modulul Pedepse: expirare, deduceri, fracții LC, praguri de vârstă, VCP/pre-L.140/1996 și reanalizare de regim.
- VCP art. 55¹: prag efectiv 20 ani, respectiv 15 ani după 60 ani pentru bărbați / 55 ani pentru femei.
- Reanalizare art. 53 pentru mai multe pedepse, raportată la pedeapsa cea mai mare și data de referință specifică.
- Reținere 24 h = 1 zi; arest preventiv și arest la domiciliu = interval inclusiv.
- Modulul Contopiri și spețele de regresie pentru principalele operații implementate.
- Persistența spețelor, exporturile și controalele de regresie CI.
- Design-system comun și verificări responsive/mobile.

### Experimental
- AI Documente rămâne **ALPHA** și are propriul gate pentru promovarea la BETA. Versiunea 1.0.0 a suitei nu schimbă statutul experimental al acestui modul.

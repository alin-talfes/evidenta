# Changelog

## 1.0.5 — 2026-09-07

Patch de robustețe pentru selecția documentelor din AI.

### AI Documente
- Detectează local fișierele încărcate de două ori folosind SHA-256 calculat în browser.
- Elimină numai duplicatele byte-identice; fișierele diferite cu același nume sau aceeași dimensiune sunt păstrate.
- Fișierele duplicate sunt ignorate înainte de OCR, pentru a evita dublarea surselor, a textului extras și a câmpurilor juridice.
- Hash-urile sunt utilizate numai în sesiunea curentă și nu sunt încărcate sau persistate de modulul AI.
- Benchmark-ul păstrează 15 documente reale unice; fotografia repetată este folosită drept test de consistență/duplicare, nu ca document nou.

## 1.0.4 — 2026-09-07

Patch de benchmark pentru un MEPI simplu cu ștampilă de intrare și rubrică de deduceri necompletată.

### AI Documente
- Recunoaște formula explicită `urmând ca acesta să execute ...` ca sursă pentru pedeapsa finală, cu protecție OCR sub 80% și conflict fail-closed.
- Recunoaște ștampile de intrare de tip `Intrare Nr. ... / zz.ll.aaaa` și `Ziua ... luna ... aaaa`; data este folosită numai ca dată a primirii în penitenciar/centru.
- Data primirii nu este copiată și nu este presupusă ca dată a începerii executării.
- O rubrică de deduceri de tip `de la --- până la ---` este tratată explicit ca necompletată și nu generează nicio perioadă dedusă.
- Date calendaristice aflate ulterior în text nu pot fi absorbite accidental în rubrica de deduceri goală.
- Conflictele între o dată textuală de primire și ștampila de intrare rămân fail-closed.
- Fixture-ul de benchmark este complet sintetic și nu conține identificatori sau date personale din sursa reală.

## 1.0.3 — 2026-09-07

Patch de consistență Pedepse/AI și hardening al contopirilor.

### AI Documente
- Rezultatele sunt afișate pe aceleași secțiuni vizuale ca în modulul Pedepse: detalii mandat/pedeapsă, fracții LC, reanalizare regim și carantină.
- Reanalizarea **1/5** este calculată și afișată explicit pentru pedepsele determinate, cu aceeași formulă comună ca în Pedepse.
- Auditul aritmetic al contopirilor verifică independent componentele, pedeapsa cea mai grea, sporul, rezultanta concursului și rezultanta finală; neconcordanțele generează avertizare critică, fără corectarea automată a hotărârii.
- Parserul de audit păstrează corect zilele din cuantumuri de tip `1 an 6 luni și 20 de zile` și nu confundă `descontopește` cu o nouă operațiune de contopire.
- Fixture-urile publice folosite pentru benchmark sunt complet sintetice și nu păstrează identificatorii documentelor reale.

### Carantină
- Regula este centralizată și comună pentru Pedepse și AI.
- Ziua primirii este **ZIUA 1**.
- **ZIUA 21** este ultima zi de carantină.
- Din **ZIUA 22** poate fi stabilit provizoriu regimul.

## 1.0.2 — 2026-09-06

Patch de benchmark pentru modulul AI Documente.

### AI Documente
- Recunoaște ștampilele de intrare de forma `Intrarea Nr. … Ziua … luna …`, inclusiv ani OCR de forma `20 26`.
- Data primirii din ștampilă este blocată automat dacă pagina are OCR sub 80%.
- Conflictele dintre data primirii extrasă textual și ștampila de intrare sunt tratate fail-closed.
- Clasificarea documentului principal nu mai confundă un MEPI cu sentințele/deciziile doar citate în cuprins.
- Benchmark-ul Lot 1 verifică acum explicit aceste cazuri prin fixture-uri complet sintetice.

## 1.0.1 — 2026-09-06

Pachet Security & Privacy concentrat pe documentele reale încărcate în modulul AI.

### Securitate AI Documente
- PDF.js securizat la versiunea 6.2.108.
- `isEvalSupported`, scripting, XFA și WASM PDF.js dezactivate explicit la parsarea documentelor.
- CSP dedicată pentru pagina AI, cu `connect-src 'self'`; pagina nu mai are acces direct la CDN-uri.
- PDF.js, Tesseract.js, worker-ele, variantele Tesseract Core/WASM și modelul românesc sunt expuse printr-un Service Worker limitat la `/ai/`, cu allowlist și verificare SHA-256 înainte de cache/utilizare.
- Selectorul de documente rămâne blocat până la inițializarea PDF/OCR prin runtime-ul verificat.
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
# Evidență PPL

**Evidență PPL (Inmate Pocket Calculator)** este o aplicație web progresivă (PWA), în limba română, pentru sprijinirea activităților de evidență a persoanelor private de libertate. Reunește instrumente de calcul al pedepselor și termenelor, consultare procedurală, profilare și transfer, pregătirea activității comisiei de transfer, instructaj juridic și procedural, descrierea semnalmentelor și statistici de utilizare.

- **Aplicație:** https://alin-talfes.github.io/evidenta/
- **Repository:** https://github.com/alin-talfes/evidenta
- **Ramură:** main
- **Găzduire:** GitHub Pages
- **Versiune:** urmărită prin version.json și js/version.js.

> Aplicația este un instrument auxiliar. Rezultatele de calcul și informațiile procedurale trebuie confruntate cu actele oficiale, situația juridică individuală și legislația în vigoare la data operațiunii. Aplicația nu înlocuiește verificarea și asumarea operațiunilor de către personalul competent.

## Cuprins

1. [Modulele aplicației](#modulele-aplicației)
2. [Funcționalități comune](#funcționalități-comune)
3. [Arhitectură și tehnologii](#arhitectură-și-tehnologii)
4. [Structura repository-ului](#structura-repository-ului)
5. [Stocarea datelor și confidențialitate](#stocarea-datelor-și-confidențialitate)
6. [Instalare și rulare locală](#instalare-și-rulare-locală)
7. [Testare și verificări](#testare-și-verificări)
8. [Publicare și actualizare](#publicare-și-actualizare)
9. [Documente și pagini informative](#documente-și-pagini-informative)
10. [Limitări și utilizare responsabilă](#limitări-și-utilizare-responsabilă)

## Modulele aplicației

### 1. Pedepse, liberare condiționată și alte calcule

**Adresă:** [pagina principală](https://alin-talfes.github.io/evidenta/)

Modulul central pentru introducerea datelor de executare și calcularea termenelor. Interfața separă două moduri de lucru: **Calcul pedeapsă** și **Alte calcule**.

**Date generale și date privind executarea**
- sexul și data nașterii persoanei;
- durata pedepsei în ani, luni și zile;
- data începerii executării;
- data primirii în penitenciar/centru, care poate fi diferită de data începerii executării;
- observații opționale;
- perioadele deduse, introduse ca intervale distincte.

**Calculul pedepsei și al liberării condiționate**
- selectarea algoritmului juridic corespunzător regimului temporal și normei indicate în interfață;
- opțiuni pentru dispozițiile relevante din Codul penal actual, Codul penal anterior și reglementările anterioare modificărilor legislative indicate de aplicație;
- tratarea distinctă a detențiunii pe viață;
- evidența perioadelor deduse;
- introducerea separată a zilelor aferente recursului compensatoriu;
- evidența perioadelor care nu se consideră executate;
- calculul restului rămas de executat, pornind de la data liberării condiționate introdusă;
- afișarea rezultatelor sintetice, alertelor, cronologiei termenelor și pașilor de calcul.

Situațiile suplimentare sunt prezentate progresiv și pot fi deschise numai când sunt aplicabile speței. O perioadă dedusă, o zi considerată executată și o perioadă care nu se consideră executată au efecte juridice diferite și nu trebuie confundate.

**Alte calcule**
- calculul termenelor aferente măsurilor preventive, prin raportare la o dată de referință și un număr de zile;
- presetări pentru intervale de 30 și 60 de zile, precum și introducerea manuală a duratei;
- calculul datei rezultate pentru amânarea liberării condiționate, pe baza datei comisiei și a numărului de luni de amânare;
- validarea valorii introduse pentru amânare, în limita afișată de aplicație.

**Rezultate și operațiuni**
- calcul și afișare a rezultatului;
- mesaje de eroare și avertizări;
- cronologia termenelor;
- explicația etapelor și a regulilor de calcul;
- copierea rezultatului;
- salvarea, încărcarea și resetarea cazurilor;
- exportul procesului-verbal de încarcerare în format PDF.

**Fișiere principale:** index.html, js/app.js, js/rules.js, js/utils.js, js/ui.js, js/storage.js, js/deduction-ui.js, js/export.js, js/quarantine-rules.js și js/quarantine-ui.js.

### 2. Contopiri de pedepse

**Adresă:** [Contopiri](https://alin-talfes.github.io/evidenta/contopiri/)

Modulul este destinat calculului pedepsei rezultante în cazul pluralității de infracțiuni și al operațiunilor de contopire introduse de utilizator.

Funcționalități:
- introducerea pedepselor componente și a datelor necesare calculului;
- selectarea/indicarea încadrării și a regulii de contopire aplicabile;
- calcularea componentei rezultante și a sporului, potrivit regulilor implementate;
- prezentarea etapelor și a rezultatului pentru verificare;
- tratarea valorilor invalide și a duratelor care nu pot fi convertite în siguranță;
- interfață adaptată desktopului și dispozitivelor mobile.

Motorul de calcul este separat de codul interfeței, pentru a permite testarea regulilor independent de afișare. Rezultatul trebuie confruntat cu hotărârile definitive și cu legea aplicabilă fiecărei infracțiuni.

**Fișiere principale:** contopiri/index.html, js/contopiri-core.js, js/contopiri.js și js/operational-contopiri.js.

Fișierul contopiri.html este o rută de compatibilitate care redirecționează către contopiri/.

### 3. Transfer și profilare

**Adresă:** [Transfer și profilare](https://alin-talfes.github.io/evidenta/transfer/)

Modulul ajută la identificarea unităților compatibile pe baza situației juridice, categoriei persoanei și criteriilor de transfer/profilare. Pagina principală oferă trei moduri distincte:

- **Afaceri judiciare** — identificarea unei destinații pentru transferul temporar în vederea prezentării la organele judiciare; județul organului judiciar este un criteriu central;
- **Custodie A.P. permanentă** — căutarea destinației în situația custodiei arestaților preventiv, cu particularitățile acestui mod;
- **Executare pedeapsă** — identificarea unităților în raport cu regimul și situația de executare.

Criteriile introduse includ, după modul selectat:
- județul relevant pentru solicitare;
- sexul;
- categoria de vârstă (minor, tânăr sau major);
- situația juridică/regimul de executare;
- existența unui risc pentru siguranța penitenciarului, acolo unde criteriul este disponibil.

Rezultatul este calculat pe baza regulilor și datelor incluse în aplicație. Pagina principală precizează că profilarea din anexa principală, primirea de la poliție, regimul provizoriu și anexele speciale reprezintă operațiuni juridice distincte și sunt tratate separat în pagina de reguli.

**Submodul: Decizie profilare / Reguli transfer**

**Adresă:** [Decizie profilare](https://alin-talfes.github.io/evidenta/transfer/rules/)

Pagină separată pentru consultarea regulilor, condițiilor și anexelor relevante pentru profilare și transfer. Este destinată verificării criteriilor care stau la baza încadrării și a identificării destinației. Documentele și anexele sunt organizate într-o pagină proprie, fără a fi amestecate cu formularul de căutare a destinației.

**Submodul: Comisie transfer**

**Adresă:** [Comisie transfer](https://alin-talfes.github.io/evidenta/transfer/comisie/)

Asistent operațional pentru comisia care analizează cererile și propunerile de transfer. Include:
- încadrarea situației procedurale: cerere formulată de persoana condamnată, propunere a administrației, transfer după stabilirea provizorie a regimului, solicitare a unui organ judiciar, cerere formulată de aparținător/alt terț și situații speciale;
- ghid de flux de lucru;
- criterii și verificări pentru analiza individualizată;
- secțiune privind avizele și consultările interstructurale;
- urmărirea termenului de soluționare a petiției;
- modele și instrumente de lucru;
- orientări privind motivarea avizului și delimitarea avizului comisiei de soluția finală a autorității competente.

Interfața este organizată pe file tematice: **Flux de lucru**, **Criterii și verificări**, **Avize / consultări**, **Termen petiție** și **Modele**. Conținutul procedural trebuie confruntat cu forma actualizată a actelor normative și cu instrucțiunile interne aplicabile.

**Fișiere principale:** transfer/index.html, transfer/app.js, transfer/rules.js, transfer/rules-page.js, transfer/rules/index.html, transfer/comisie/index.html, transfer/comisie/committee.js și transfer/comisie/committee.css.

### 4. Instructaj juridic și procedural

**Adresă:** [Instructaj](https://alin-talfes.github.io/evidenta/instructaj/)

Modulul organizează materiale de instruire și consultare pentru activitățile de evidență și executare. Include explicații, trasee de învățare și conținut procedural structurat pe teme și acte normative.

Printre temele documentate în modul se regăsesc:
- hotărârile penale: sentință, decizie, încheiere și caracterul definitiv;
- rămânerea definitivă și punerea în executare a hotărârilor;
- mandatul de executare a pedepsei închisorii și documentele aferente;
- citația și procedura de citare a persoanelor private de libertate;
- perioadele deduse, perioadele considerate executate și perioadele care nu se consideră executate;
- liberarea la termen și liberarea condiționată;
- regimurile de executare și operațiunile de evidență;
- transferul și verificările documentare/procedurale;
- noțiuni, termeni și explicații juridice utile activității curente.

Conținutul este susținut de trimiteri la acte normative, inclusiv Legea nr. 254/2013, HG nr. 157/2016, OMJ nr. 2.188/C/2022, Codul penal și Codul de procedură penală. Referințele din aplicație sunt materiale de instruire; înainte de aplicare trebuie consultată forma oficială în vigoare și verificată existența modificărilor ulterioare.

**Fișiere principale:**
- instructaj/index.html — interfața și structura modulului;
- instructaj/app.js — logica de navigare și interacțiune;
- instructaj/data.js — conținutul informativ și datele structurate;
- instructaj/omj2188-completari.js — completări tematice aferente instrucțiunilor;
- instructaj/styles.css, instructaj/styles-legacy.css și instructaj/audit-enhancements.css — stiluri și îmbunătățiri vizuale;
- instructaj/tests.mjs și instructaj/tests-transfer.mjs — verificări automate pentru conținutul și comportamentul acoperit de teste.

### 5. Descrierea semnalmentelor

**Adresă:** [Semnalmente](https://alin-talfes.github.io/evidenta/semnalmente/)

Modulul generează asistat o fișă descriptivă a trăsăturilor faciale, pornind de la imagini încărcate de operator.

**Flux de lucru**
1. Încărcarea fotografiei frontale, obligatorie.
2. Încărcarea fotografiei din profil, recomandată și necesară pentru anumite caracteristici care nu pot fi evaluate frontal.
3. Analiza imaginilor în browser.
4. Verificarea și, unde este necesar, corectarea manuală a caracteristicilor.
5. Copierea, tipărirea, salvarea locală sau exportul fișei.

**Funcționalități**
- previzualizarea fotografiilor și eliminarea lor din sesiunea curentă;
- acceptarea formatelor de imagine indicate în interfață și verificarea limitelor de dimensiune;
- analiză asistată a caracteristicilor faciale și a reperelor vizuale;
- generarea unei fișe cu descrieri pe categorii;
- corectarea manuală a rezultatelor propuse;
- copierea fișei și tipărirea acesteia;
- salvarea fișelor în browser;
- exportul unei fișe în JSON, importul unei fișe JSON și exportul tuturor fișelor salvate;
- ștergerea fișelor locale.

Motorul folosește componente de analiză vizuală și reguli de clasificare. Rezultatele automate sunt estimative, pot fi influențate de unghi, lumină, rezoluție, expresie, ocluzii și calitatea fotografiei și trebuie verificate de operator. Modulul nu stabilește identitatea persoanei, nu realizează identificare biometrică și nu înlocuiește o constatare sau expertiză criminalistică.

**Confidențialitatea imaginilor:** pagina modulului precizează că fotografiile sunt analizate local în browser și nu sunt încărcate de aplicație pe un backend propriu. Componentele externe de analiză și resursele lor pot avea propriile condiții și politici tehnice; acestea trebuie consultate separat.

**Fișiere principale:** semnalmente/index.html, semnalmente/script.js, semnalmente/engine-v2.js, semnalmente/engine-v3.js, semnalmente/classifier-rules.js, semnalmente/enhancements.js, semnalmente/result-audit.js, semnalmente/advanced-calibration.js, semnalmente/calibration-metrics.js, semnalmente/calibration-schema.json, semnalmente/style.css și semnalmente/editor.css. Documentația tehnică a motorului și a calibrării se află în semnalmente/docs/.

### 6. Statistici de utilizare

**Adresă:** [Panou statistici](https://alin-talfes.github.io/evidenta/analytics/)

Zona administrativă prezintă statistici agregate privind utilizarea aplicației. Pagina este separată de interfața publică și este marcată pentru a nu fi indexată de motoarele de căutare.

Funcționalități:
- autentificare administrator;
- verificarea rolului de acces configurat în serviciul backend;
- afișarea indicatorilor de utilizare;
- analiză pe dispozitive, sesiuni și module;
- filtrarea/consultarea perioadelor și indicatorilor disponibili în panou;
- închiderea sesiunii administrative.

Colectarea evenimentelor este condiționată de consimțământul utilizatorului, potrivit mecanismului de analytics implementat. Zona administrativă utilizează Supabase pentru autentificare și acces la date. Accesul nu este public doar pentru că pagina este găzduită pe GitHub Pages.

**Fișiere principale:** analytics/index.html, analytics/app.js, analytics/styles.css și js/analytics.js.

## Funcționalități comune

### Interfață și navigare
- interfață în limba română;
- navigare între module și acces la paginile secundare;
- temă vizuală adaptivă și control al temei;
- componente și reguli vizuale comune;
- layout-uri adaptate desktopului, tabletei și telefonului;
- formulare cu validare, mesaje de eroare și avertizări;
- afișarea progresivă a informațiilor suplimentare, pentru reducerea aglomerării vizuale;
- etichete de formular, navigare cu tastatura și legătură de salt la conținut, acolo unde sunt implementate.

### Salvare, import și export
- salvarea locală a cazurilor în modulele care oferă această funcție;
- încărcarea cazurilor salvate și resetarea datelor introduse;
- copierea rezultatelor;
- exporturi PDF/JSON în modulele care le implementează;
- importul fișierelor JSON acolo unde interfața oferă această funcție.

### PWA și cache
- manifest pentru instalarea aplicației;
- pictogramă și scurtături către module;
- Service Worker pentru gestionarea resurselor statice;
- cache pentru resursele configurate și mecanism de actualizare a versiunii;
- acces la resurse memorate anterior, în limita cache-ului disponibil.

## Arhitectură și tehnologii

Aplicația este construită în principal cu tehnologii web standard:
- **HTML5** — structură și conținut;
- **CSS3** — sistem vizual, componente, teme și layout responsive;
- **JavaScript** — reguli de calcul, logică de interfață, stocare și interacțiuni;
- **Web App Manifest** — instalare PWA;
- **Service Worker / Cache Storage** — cache și actualizare;
- **Node.js / npm** — rularea instrumentelor și testelor de dezvoltare;
- **Playwright** — teste end-to-end în browsere;
- **Supabase** — autentificarea și datele zonei de statistici;
- **MediaPipe Tasks Vision** — componentă externă utilizată de modulul de descriere a semnalmentelor.

Aplicația principală și modulele sale sunt livrate ca pagini statice prin GitHub Pages. Logica obișnuită de calcul rulează în browser. Unele funcții administrative sau resurse externe au dependențe distincte, descrise în secțiunile modulelor respective.

## Structura repository-ului

    evidenta/
    ├── .github/workflows/    # fluxuri automate GitHub Actions
    ├── analytics/            # panou administrativ de statistici
    ├── contopiri/            # interfața modulului de contopiri
    ├── css/                  # stiluri comune, responsive și specifice
    ├── descriere-semnalmente/ # rută/pagină auxiliară pentru semnalmente
    ├── e2e/                  # scenarii de testare end-to-end în browser
    ├── instructaj/           # modul de instructaj și conținutul său
    ├── js/                   # logică și servicii JavaScript comune
    ├── semnalmente/          # modul descriptiv, motor, reguli și documentație
    ├── tests/                # teste automate de logică și interfață
    ├── transfer/             # destinație, reguli și comisie de transfer
    ├── index.html            # intrarea principală în aplicație
    ├── manifest.json         # manifestul PWA
    ├── package.json          # scripturi npm
    ├── package-lock.json     # versiuni fixate ale dependențelor npm
    ├── playwright.config.mjs # configurarea Playwright
    ├── sw.js                 # Service Worker principal
    ├── version.json          # informații despre versiunea aplicației
    └── README.md             # documentația generală

### Fișiere și directoare de la rădăcină

| Fișier / director | Rol |
|---|---|
| index.html | Pagina principală pentru calculul pedepselor și accesul la funcțiile de calcul. |
| manifest.json | Numele aplicației, pictograma, limba, ruta de pornire, modul de afișare și scurtăturile PWA. |
| sw.js | Service Worker principal; gestionează resursele și cache-ul aplicației. |
| version.json | Informații de versiune folosite la verificarea actualizărilor. |
| favicon-ev-2.svg, favicon-ipc.svg | Resurse grafice pentru identificarea vizuală a aplicației. |
| package.json | Scripturi npm pentru testare și verificarea sintaxei. |
| package-lock.json | Fixează versiunile dependențelor instalate prin npm. |
| playwright.config.mjs | Definește proiectele de testare, browserele, serverul local și capturile la eșec. |
| CHANGELOG.md | Istoricul modificărilor și al versiunilor. |
| RELEASE_GATE.md | Criterii și verificări asociate pregătirii unei versiuni. |
| SECURITY_PRIVACY.md | Document tehnic privind securitatea și confidențialitatea. |
| COMPLIANCE_RELEASE_CHECKLIST.md | Listă de verificare pentru aspectele de conformitate înainte de publicare. |
| compliance-audit.html | Pagină internă cu constatări și acțiuni de conformitate. |
| accessibility.html | Declarație și informații privind accesibilitatea. |
| privacy-policy.html | Politica de confidențialitate. |
| cookie-policy.html | Informații despre cookie-uri și stocarea locală. |
| terms.html | Termeni și condiții. |
| refund-policy.html | Politica privind rambursarea și retragerea. |
| contopiri.html | Rută de compatibilitate care redirecționează către modulul Contopiri. |
| descriere-semnalmente/ | Rută auxiliară asociată paginii de descriere a semnalmentelor. |
| .github/workflows/ | Definițiile fluxurilor automate de verificare la modificări. |

### Rolul directoarelor comune

**js/ — logică JavaScript comună**

Conține codul reutilizat de paginile aplicației. Principalele responsabilități sunt:
- app.js — coordonarea interacțiunilor și calculului din pagina principală;
- rules.js — reguli și funcții de calcul pentru pedepse și termene;
- utils.js — funcții utilitare pentru date, durate și operații comune;
- ui.js — actualizarea elementelor de interfață și afișarea rezultatelor;
- storage.js — salvarea și încărcarea datelor locale;
- export.js — copierea și generarea exporturilor disponibile;
- deduction-ui.js — gestionarea interfeței pentru perioade și deduceri;
- contopiri-core.js, contopiri.js — motorul și interfața pentru contopiri;
- quarantine-rules.js, quarantine-ui.js — reguli și afișare pentru calculul perioadei de carantină;
- legal.js, legal-footer.js — elemente și referințe juridice comune;
- theme.js — administrarea temei;
- pwa-register.js — înregistrarea Service Worker-ului;
- version.js — verificarea/afișarea versiunii;
- analytics.js — gestionarea evenimentelor de analiză în condițiile consimțământului;
- scripturile operational-*.js — comportamente comune și particularizări de navigare/experiență pentru module.

**css/ — stiluri comune**

Include sistemul de design, stilurile de bază, componentele de interfață, adaptările pentru desktop și mobil, compatibilitatea între browsere, paginile informative, modulele și corecțiile de layout. Fișierele sunt încărcate în ordinea definită de fiecare pagină HTML; ordinea poate influența cascadele CSS și nu trebuie modificată fără testarea paginilor dependente.

**tests/ și e2e/ — verificări**

- tests/ conține teste automate pentru logica de calcul, comportamentele interfeței, stocare, navigare, responsive, reguli de regresie și funcționarea componentelor comune.
- e2e/ conține scenarii care rulează aplicația într-un browser real prin Playwright, inclusiv verificări pentru dispozitive mobile și audituri vizuale.

**.github/workflows/ — integrare continuă**

Fluxurile GitHub Actions rulează verificări automate la evenimentele configurate în repository. Acestea instalează mediul Node.js, verifică sintaxa, rulează testele și pot executa scenarii de browser și păstra rapoarte/capturi ca artefacte.

## Stocarea datelor și confidențialitate

Modulele care oferă salvare locală utilizează mecanismele de stocare ale browserului. Datele salvate sunt legate de browserul și dispozitivul utilizat; nu trebuie presupusă sincronizarea automată între dispozitive.

- ștergerea datelor site-ului poate elimina cazurile salvate, preferințele și cache-ul;
- modul privat/incognito poate limita persistența datelor;
- schimbarea browserului sau a dispozitivului nu transferă automat datele;
- folosiți exportul disponibil pentru a păstra datele necesare, în condiții de securitate.

Modulul Semnalmente analizează imaginile în browser, conform informării din pagina sa; resursele externe utilizate pentru analiză au propriile condiții tehnice. Panoul de statistici folosește Supabase pentru autentificare și datele administrative. Evenimentele de analiză sunt condiționate de mecanismul de consimțământ.

Nu introduceți date reale, confidențiale sau date referitoare la persoane private de libertate într-un mediu public decât dacă există temei legal, autorizare instituțională și aprobările de securitate și protecție a datelor necesare. Pentru utilizare instituțională trebuie respectate procedurile interne și instrucțiunile responsabililor competenți.

## Instalare și rulare locală

### Cerințe

- Git;
- Node.js 22 (conform fluxurilor CI) și npm;
- Python 3 pentru serverul HTTP local folosit de configurația Playwright;
- browserele instalate de Playwright pentru testele end-to-end.

### Clonare și instalarea dependențelor

    git clone https://github.com/alin-talfes/evidenta.git
    cd evidenta
    npm install

### Server local

Din rădăcina repository-ului:

    python3 -m http.server 4173

Accesați apoi http://localhost:4173/.

Nu deschideți direct fișierele HTML cu file:// pentru verificarea funcțiilor care depind de rute relative, module JavaScript, Service Worker sau cache.

## Testare și verificări

Comenzile declarate în package.json:

**Verificarea sintaxei JavaScript**

    npm run check:syntax

**Suita de teste**

    npm test

**Teste end-to-end**

    npx playwright install --with-deps webkit chromium
    npm run test:e2e

**Teste specifice modulului Instructaj**

    node instructaj/tests.mjs
    node instructaj/tests-transfer.mjs

**Teste specifice modulului Semnalmente**

    cd semnalmente
    npm test

Testele verifică numai comportamentele și cazurile incluse în scenariile lor. Trecerea testelor nu echivalează cu validarea juridică exhaustivă a tuturor situațiilor și nici cu certificarea de securitate sau compatibilitate universală.

## Publicare și actualizare

Aplicația este publicată prin GitHub Pages din repository-ul alin-talfes/evidenta, ramura main, la baza de rută /evidenta/.

Flux recomandat:
1. modificați fișierele păstrând căile și dependențele existente;
2. verificați paginile și modulele afectate;
3. rulați verificarea de sintaxă și testele relevante;
4. testați interfața pe desktop și mobil;
5. integrați modificările în main;
6. urmăriți rezultatul fluxurilor GitHub Actions;
7. verificați versiunea publicată pe GitHub Pages.

La schimbarea fișierelor HTML, JavaScript sau CSS trebuie verificate referințele cu parametri de versiune și listele de precache ale Service Worker-ului. O resursă nouă trebuie să fie referită corect și inclusă în mecanismul de actualizare dacă acesta o gestionează explicit.

## Documente și pagini informative

- [Istoricul modificărilor](CHANGELOG.md)
- [Criterii de publicare](RELEASE_GATE.md)
- [Lista de verificare pentru conformitate](COMPLIANCE_RELEASE_CHECKLIST.md)
- [Securitate și confidențialitate](SECURITY_PRIVACY.md)
- [Audit de conformitate](compliance-audit.html)
- [Politica de confidențialitate](privacy-policy.html)
- [Politica privind cookie-urile și stocarea locală](cookie-policy.html)
- [Termeni și condiții](terms.html)
- [Politica de rambursare și retragere](refund-policy.html)
- [Declarație de accesibilitate](accessibility.html)

Aceste documente trebuie actualizate atunci când se schimbă funcționarea aplicației, serviciile externe, tipurile de date prelucrate sau cadrul juridic aplicabil.

## Limitări și utilizare responsabilă

- Corectitudinea calculelor depinde de exactitatea datelor introduse și de selectarea regulii juridice corespunzătoare.
- Datele de referință și perioadele trebuie reconstruite din documentele oficiale, nu estimate.
- Aplicația nu verifică autenticitatea hotărârilor, mandatelor, citațiilor sau a altor documente.
- Informațiile de instructaj nu înlocuiesc consultarea actelor normative în forma consolidată și în vigoare.
- Rezultatele descrierii semnalmentelor sunt orientative și necesită verificare umană.
- Disponibilitatea offline este limitată la paginile și resursele deja memorate în cache.
- GitHub Pages este o platformă de găzduire statică; disponibilitatea și comportamentul serviciilor externe depind de furnizorii respectivi.
- Utilizarea instituțională și prelucrarea datelor reale necesită verificări juridice, tehnice și de securitate distincte.

## Licență și drepturi

În repository nu este indicată o licență care să acorde în mod expres drepturi generale de reutilizare, redistribuire sau exploatare comercială. În lipsa unei licențe explicite, nu trebuie presupus că aceste drepturi sunt acordate.

---

**Evidență PPL — instrumente digitale pentru activități de evidență, calcul și consultare procedurală.**

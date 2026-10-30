# Evidență PPL

**Evidență PPL** este o aplicație web progresivă (PWA) destinată sprijinirii activităților de evidență a persoanelor private de libertate. Reunește instrumente de calcul juridic, consultare procedurală și operațiuni administrative într-o interfață unitară, adaptată utilizării pe desktop, tabletă și telefon.

**Aplicație publicată:** https://alin-talfes.github.io/evidenta/  
**Repository:** https://github.com/alin-talfes/evidenta  
**Ramură principală:** `main`  
**Versiunea aplicației:** gestionată prin fișierele `version.json` și `js/version.js`.

> Aplicația este un instrument auxiliar. Rezultatele trebuie confruntate cu actele oficiale, documentarul penal și normele aplicabile situației concrete. Aplicația nu înlocuiește verificarea și asumarea operațiunilor de către personalul competent.

## Cuprins

- [Module și funcționalități](#module-și-funcționalități)
- [Accesarea aplicației](#accesarea-aplicației)
- [Structura repository-ului](#structura-repository-ului)
- [Tehnologii și arhitectură](#tehnologii-și-arhitectură)
- [Stocarea datelor și confidențialitate](#stocarea-datelor-și-confidențialitate)
- [Instalare și dezvoltare locală](#instalare-și-dezvoltare-locală)
- [Verificări automate](#verificări-automate)
- [Publicare](#publicare)
- [Documente și politici](#documente-și-politici)
- [Limitări și utilizare responsabilă](#limitări-și-utilizare-responsabilă)
- [Licență](#licență)

## Module și funcționalități

### 1. Calculul pedepselor și al termenelor

Pagina principală este disponibilă la [evidenta/](https://alin-talfes.github.io/evidenta/).

Modulul permite introducerea datelor privind persoana și pedeapsa, stabilirea datei de început a executării și calcularea termenelor relevante. Interfața include:

- introducerea duratei pedepsei în ani, luni și zile;
- stabilirea datei începerii executării și, separat, a datei primirii în penitenciar/centru;
- evidența perioadelor deduse;
- înregistrarea situațiilor suplimentare, precum recursul compensatoriu, perioadele care nu se consideră executate și restul rămas;
- calculul fracțiilor și termenelor de liberare condiționată, în funcție de configurația selectată;
- calculul măsurilor preventive și al termenelor de amânare;
- afișarea rezultatului sintetic, a alertelor, cronologiei și pașilor de calcul;
- salvarea și reîncărcarea cazurilor locale;
- copierea rezultatelor și exportul procesului-verbal de încarcerare în format PDF.

Datele introduse trebuie verificate în raport cu actele din dosar. În special, datele de referință, perioadele deduse, natura măsurilor preventive și dispozițiile hotărârilor nu trebuie presupuse.

### 2. Calculul contopirii pedepselor

Disponibil la [contopiri/](https://alin-talfes.github.io/evidenta/contopiri/).

Modulul permite introducerea pedepselor pe categorii juridice și calcularea pedepsei rezultante potrivit regulilor implementate. Interfața prezintă rezultatul și componentele calculului, pentru a permite verificarea operațiunilor aritmetice.

Motorul de calcul verifică tipurile și valorile numerice introduse, respinge duratele invalide și protejează operațiile împotriva depășirilor numerice. Încadrarea juridică a fiecărei pedepse și alegerea regulii aplicabile rămân operațiuni care necesită verificarea hotărârilor și a legii aplicabile.

Adresa veche [contopiri.html](https://alin-talfes.github.io/evidenta/contopiri.html) redirecționează către ruta principală a modulului.

### 3. Transfer și profilare

Disponibil la [transfer/](https://alin-talfes.github.io/evidenta/transfer/).

Modulul sprijină identificarea unităților compatibile cu situația juridică și criteriile de transfer introduse. Include moduri distincte de lucru și instrumente de consultare a regulilor aplicabile.

Secțiunile principale sunt:

- **Destinație transfer și profilare** — selectarea criteriilor și filtrarea unităților;
- **Decizie profilare** — consultarea regulilor și anexelor aferente profilării;
- **Comisie transfer** — instrument separat pentru pregătirea și structurarea informațiilor necesare activității comisiei.

Acces direct:
- [Decizie profilare](https://alin-talfes.github.io/evidenta/transfer/rules/)
- [Comisie transfer](https://alin-talfes.github.io/evidenta/transfer/comisie/)

Modulul este un instrument de sprijin. Compatibilitatea afișată trebuie verificată în raport cu documentele persoanei, criteriile în vigoare și competențele instituționale.

### 4. Instructaj

Disponibil la [instructaj/](https://alin-talfes.github.io/evidenta/instructaj/).

Modulul organizează informații juridice și procedurale într-un traseu de învățare și consultare. Conținutul este structurat pe categorii, proceduri, acte normative și glosar. Include căutare, filtrare și pagini explicative pentru operațiuni specifice.

Sursele normative indicate în modul includ, între altele, Legea nr. 254/2013, HG nr. 157/2016, OMJ nr. 2.188/C/2022, Codul penal și Codul de procedură penală. Datele de verificare afișate în aplicație se referă la verificarea efectuată pentru conținutul respectiv; forma în vigoare trebuie consultată în sursele oficiale înainte de utilizare.

### 5. Descrierea semnalmentelor

Disponibil la [semnalmente/](https://alin-talfes.github.io/evidenta/semnalmente/).

Modulul permite generarea asistată a unei fișe descriptive a trăsăturilor faciale, pornind de la o fotografie frontală și, opțional, una de profil. Motorul analizează repere faciale și caracteristici vizuale, propune clasificări și permite corectarea manuală a rezultatelor.

Fișa poate păstra separat rezultatele automate și corecțiile operatorului, astfel încât modificările să poată fi urmărite. Rezultatele sunt descriptive și orientative; nu reprezintă identificare biometrică, stabilire certă a identității sau expertiză criminalistică. Calitatea fotografiei, unghiul, iluminarea și ocluziile pot influența rezultatul.

### 6. Statistici de utilizare

Zona [analytics/](https://alin-talfes.github.io/evidenta/analytics/) oferă un panou administrativ pentru indicatori de utilizare, precum dispozitive, accesări, sesiuni, distribuția pe tipuri de dispozitive și module accesate. Accesul este condiționat de autentificarea și rolurile configurate în serviciul backend asociat.

Statistica este opțională și depinde de consimțământul utilizatorului, conform implementării interfeței de colectare a evenimentelor.

## Accesarea aplicației

Aplicația poate fi utilizată direct în browser, fără instalarea unui program pe calculator. Pentru acces repetat, poate fi instalată ca PWA, folosind opțiunea de instalare oferită de browser.

PWA oferă:
- afișare în fereastră proprie, fără interfața obișnuită a browserului;
- pictogramă și scurtături către modulele principale;
- cache pentru resursele statice și acces mai rapid la paginile vizitate;
- posibilitatea utilizării unor resurse deja memorate local, în limita disponibilității acestora.

Pentru a primi ultima versiune, browserul trebuie să poată verifica și descărca resursele publicate. În caz de afișare a unei versiuni vechi, reîncărcați aplicația și verificați actualizarea Service Worker-ului sau a datelor site-ului din browser.

## Structura repository-ului

Repository-ul este organizat pe module funcționale și resurse comune:

```text
evidenta/
├── .github/
│   └── workflows/       # fluxuri GitHub Actions pentru verificare automată
├── analytics/           # interfața și logica panoului statistic
├── contopiri/           # pagina modulului de contopire
├── css/                 # sistem vizual și stiluri comune/responsive
├── descriere-semnalmente/ # rută de compatibilitate pentru o adresă anterioară
├── e2e/                 # teste de interacțiune în browser
├── instructaj/          # conținut juridic și procedural pentru instructaj
├── js/                  # logica comună a aplicației
├── semnalmente/         # modul descriptiv și motorul de analiză facială
├── tests/               # teste automate de logică și interfață
├── transfer/            # profilare, reguli și comisie de transfer
├── index.html           # pagina principală: calculul pedepselor
├── manifest.json        # configurarea PWA
├── package.json         # scripturi de dezvoltare și verificare
├── package-lock.json    # versiuni fixate ale dependențelor npm
├── playwright.config.mjs # configurarea testelor în browser
├── sw.js                # Service Worker al aplicației principale
├── version.json         # informații despre versiunea publicată
└── README.md            # documentația repository-ului
```

În repository există și pagini de informare, fișiere de configurare, documente de mentenanță și resurse grafice. Căile și numele fișierelor sunt păstrate pentru compatibilitatea referințelor din cod.

### Resurse comune

Directorul `js/` conține logica reutilizată: reguli de calcul, interfață, utilitare pentru date calendaristice, stocare locală, export, navigare, temă, înregistrarea PWA și actualizarea versiunii.

Directorul `css/` conține sistemul vizual comun, componentele de interfață și regulile de afișare pentru desktop și dispozitive mobile. Stilurile specifice modulelor completează stilurile comune.

Fiecare modul are o pagină HTML de intrare și propriile resurse JavaScript/CSS. Paginile folosesc căi relative raportate la baza GitHub Pages `/evidenta/`; la adăugarea sau mutarea resurselor trebuie verificate toate referințele către acestea.

## Tehnologii și arhitectură

Proiectul folosește tehnologii web standard:

- **HTML5** pentru structura paginilor;
- **CSS3** pentru sistemul vizual, layout și adaptarea la ecrane;
- **JavaScript** pentru logica modulelor și interacțiunile din browser;
- **Web App Manifest** pentru instalarea ca aplicație;
- **Service Worker** și Cache Storage pentru cache-ul resurselor și actualizarea aplicației;
- **Node.js** pentru rularea verificărilor automate;
- **Playwright** pentru testele end-to-end în browsere și configurații mobile.

Aplicația principală este publicată ca site static prin GitHub Pages. Nu există un server propriu al aplicației principale care să execute calculele juridice; acestea sunt efectuate în browser. Panoul statistic utilizează un serviciu backend separat pentru autentificare și datele de analiză.

## Stocarea datelor și confidențialitate

Modulele care oferă salvarea cazurilor folosesc stocarea browserului. Aceste date sunt asociate profilului local al browserului și dispozitivului pe care au fost introduse. Ele nu trebuie considerate automat sincronizate sau disponibile pe alt dispozitiv.

Consecințe practice:
- ștergerea datelor site-ului din browser poate elimina cazurile, preferințele și cache-ul;
- modul privat/incognito poate limita sau șterge stocarea la închiderea sesiunii;
- schimbarea dispozitivului sau a browserului nu transferă automat datele;
- exportați și păstrați în siguranță informațiile necesare, acolo unde modulul oferă funcții de export.

Nu introduceți date reale, confidențiale sau date referitoare la persoane private de libertate într-un mediu public decât dacă există temei legal, autorizare instituțională și aprobările de securitate și protecție a datelor necesare. Pentru utilizare instituțională, consultați procedurile interne și responsabilul cu protecția datelor/securitatea informațiilor.

Documentele publice privind confidențialitatea și securitatea descriu implementarea cunoscută la momentul redactării. Ele nu reprezintă certificare de securitate și nu substituie verificarea configurației efective a furnizorilor externi.

## Instalare și dezvoltare locală

### Cerințe

- Git;
- Node.js 22 sau o versiune compatibilă cu scripturile proiectului;
- npm;
- Python 3 pentru serverul local utilizat de configurația Playwright;
- browserele instalate de Playwright pentru testele end-to-end.

### Clonare

```bash
git clone https://github.com/alin-talfes/evidenta.git
cd evidenta
npm install
```

### Pornirea serverului local

Pentru o previzualizare simplă:

```bash
python3 -m http.server 4173
```

Deschideți apoi `http://localhost:4173/` dacă serverul este pornit direct din rădăcina repository-ului.

Unele funcții PWA, Service Worker și rute relative trebuie testate printr-un server HTTP local, nu prin deschiderea directă a fișierelor cu protocolul `file://`.

## Verificări automate

Scripturile principale sunt declarate în `package.json`.

Verificarea sintaxei JavaScript:

```bash
npm run check:syntax
```

Rularea suitei de teste:

```bash
npm test
```

Testele end-to-end:

```bash
npx playwright install --with-deps webkit chromium
npm run test:e2e
```

Testele modulului Semnalmente:

```bash
cd semnalmente
npm test
```

Testele verifică, în funcție de scenariu, calcule și reguli de regresie, comportamentul interfeței, persistența, rutele, aspectul responsive, accesibilitatea structurală și funcționarea pe browsere/dispozitive simulate.

Un test trecut confirmă numai scenariile acoperite de acel test. Nu constituie validare juridică a tuturor spețelor și nu garantează compatibilitatea cu orice dispozitiv sau versiune de browser.

## Publicare

Publicarea este realizată prin GitHub Pages din repository-ul `alin-talfes/evidenta`, folosind ramura `main` și ruta de bază `/evidenta/`.

Flux recomandat pentru modificări:

1. modificați fișierele necesare păstrând structura și căile utilizate de aplicație;
2. rulați verificările de sintaxă și testele relevante;
3. verificați manual rutele afectate pe desktop și mobil;
4. transmiteți modificările în ramura `main`;
5. urmăriți fluxurile GitHub Actions și verificați versiunea publicată pe GitHub Pages.

La modificarea fișierelor HTML, JavaScript sau CSS, actualizați parametrii de versiune din referințele către resurse atunci când mecanismul de cache al aplicației o impune. Verificați și listele de precache din Service Worker, pentru ca resursele noi să fie publicate și actualizate corect.

## Documente și politici

Documentele de mentenanță și informare sunt păstrate separat de module:

- [Istoricul modificărilor](CHANGELOG.md)
- [Criterii de publicare](RELEASE_GATE.md)
- [Lista de verificare pentru conformitate](COMPLIANCE_RELEASE_CHECKLIST.md)
- [Securitate și confidențialitate](SECURITY_PRIVACY.md)
- [Politica de confidențialitate](privacy-policy.html)
- [Politica privind cookie-urile și stocarea locală](cookie-policy.html)
- [Termeni și condiții](terms.html)
- [Politica de rambursare și retragere](refund-policy.html)
- [Declarație de accesibilitate](accessibility.html)

Paginile de informare trebuie menținute în concordanță cu implementarea efectivă, furnizorii utilizați și cadrul normativ aplicabil.

## Limitări și utilizare responsabilă

- Corectitudinea rezultatului depinde de completitudinea și exactitatea datelor introduse.
- Aplicarea unei reguli juridice depinde de data faptelor, legea aplicabilă, hotărârile relevante și situația particulară.
- Aplicația nu verifică autenticitatea actelor introduse de utilizator.
- Rezultatele trebuie confruntate cu actele oficiale și cu legislația consolidată la data operațiunii.
- Modulele care utilizează clasificări sau măsurători automate pot produce rezultate incerte; verificarea umană este obligatorie.
- Disponibilitatea offline este limitată la paginile și resursele care au fost deja încărcate și memorate în cache.
- GitHub Pages este un serviciu de găzduire statică; comportamentul de securitate și disponibilitatea depind și de furnizorii de hosting și servicii externe.

## Licență

Repository-ul afișează mențiunea de drepturi de autor a autorului. În lipsa unui fișier de licență care să acorde drepturi suplimentare, nu se presupune că utilizatorii au permisiunea de a redistribui, modifica sau exploata comercial codul și materialele repository-ului.

---

**Evidență PPL — instrumente digitale pentru activități de evidență și calcul.**

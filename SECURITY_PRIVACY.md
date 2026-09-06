# Security & Privacy — Evidență PPL

## Domeniu

Aplicația rămâne o aplicație publică GitHub Pages, cu execuție în browser. Modulele obișnuite sunt destinate datelor fictive/de test. Modulul **AI Documente** este singurul flux proiectat pentru încărcarea locală a unui PDF sau a unor imagini reale.

## Regula de confidențialitate pentru AI Documente

- Fișierul selectat nu este trimis unui backend al aplicației și nu este încărcat în repository.
- PDF-ul/imaginea este păstrat(ă) numai în memoria sesiunii browserului pentru citire, OCR și previzualizare.
- Modulul AI nu scrie PDF-ul, imaginea sau textul OCR în `localStorage`/`sessionStorage`.
- La `RESET` se elimină selecția curentă; la părăsirea paginii, câmpurile sensibile din DOM sunt golite.
- După selectarea unui document, fereastra AI blochează conexiunile externe din thread-ul principal (`fetch`, XHR, WebSocket, EventSource și `sendBeacon`).
- CSP-ul paginii permite `connect-src 'self'`; pagina AI nu are permisiune directă de conectare la CDN-uri.

## Dependențe verificate criptografic

PDF.js, Tesseract.js, worker-ele, variantele Tesseract Core/WASM și modelul românesc `ron.traineddata.gz` sunt fixate la versiuni exacte. Ele sunt accesate de pagină numai prin URL-uri virtuale same-origin din `/ai/_secure/`.

Un Service Worker limitat la scope-ul `/ai/`:

1. mapează numai resursele aflate într-un allowlist explicit;
2. descarcă resursa sursă fără credențiale și fără referrer;
3. verifică lungimea și SHA-256 față de valorile fixate în cod;
4. respinge resursa dacă există orice neconcordanță;
5. după verificare, o expune paginii ca resursă same-origin și o păstrează într-un cache versionat.

Astfel, o modificare a conținutului servit de furnizorul extern nu este acceptată automat de aplicație.

## Protecții PDF

În versiunea 1.0.1, runtime-ul AI folosește PDF.js **6.2.108**. Încărcarea PDF este forțată cu:

- `isEvalSupported: false`;
- `enableScripting: false`;
- `enableXfa: false`;
- `useWasm: false` pentru parserul PDF.js.

Înainte de parsare se verifică magic-header-ul `%PDF-` și se blochează documentele care expun în structură elemente active precum JavaScript, OpenAction, Launch, EmbeddedFile, RichMedia sau SubmitForm.

Pagina AI aplică o Content Security Policy dedicată, fără `object`, fără `frame` și cu conexiuni de pagină limitate la aceeași origine.

## Inițializarea OCR

Componentele PDF/OCR sunt încărcate prin proxy-ul de integritate și inițializate înainte ca selectorul de fișiere să devină disponibil. Documentul real nu poate fi ales înainte ca runtime-ul verificat să fie pregătit.

După selecție se activează suplimentar blocarea conexiunilor externe din fereastra AI. OCR-ul rămâne în browser; modelul românesc este utilizat local de Tesseract.

## Date publice de test

Fixture-urile de benchmark păstrate în repository sunt complet sintetice. Ele reproduc numai structuri juridice necesare testelor de regresie și nu trebuie să conțină valori preluate din persoane sau documente reale.

## Cadrul juridic relevant

Pentru o utilizare instituțională cu date reale ale persoanelor private de libertate trebuie avute în vedere, în funcție de scop și calitatea operatorului, în special:

- Legea nr. 363/2018 privind protecția datelor prelucrate de autoritățile competente în scopul prevenirii, descoperirii, cercetării, urmăririi penale, combaterii infracțiunilor sau executării pedepselor;
- Legea nr. 254/2013, inclusiv regula de confidențialitate a datelor persoanelor condamnate;
- HG nr. 157/2016 privind regulamentul de aplicare a Legii nr. 254/2013, inclusiv obligațiile privind confidențialitatea dosarului și protecția aplicațiilor informatice;
- normele interne aplicabile operatorului și instrucțiunile responsabilului cu protecția datelor/securitatea cibernetică.

Această pagină documentează arhitectura aplicației și nu substituie autorizarea instituțională, evaluarea de impact sau procedurile interne atunci când aplicația este folosită într-un cadru oficial.

## Limitări tehnice

GitHub Pages rămâne un hosting static și nu permite administrarea tuturor headerelor HTTP ca pe un server propriu. CSP-ul specific modulului AI este impus în document, iar stratul de integritate al dependențelor este implementat în browser. Pentru cerințe instituționale suplimentare, nivelul următor rămâne un hosting administrat centralizat cu headere HTTP și politici organizaționale proprii.

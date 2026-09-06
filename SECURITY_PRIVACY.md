# Security & Privacy — Evidență PPL

## Domeniu

Aplicația rămâne o aplicație publică GitHub Pages, cu execuție în browser. Modulele obișnuite sunt destinate datelor fictive/de test. Modulul **AI Documente** este singurul flux proiectat pentru încărcarea locală a unui PDF sau a unor imagini reale.

## Regula de confidențialitate pentru AI Documente

- Fișierul selectat nu este trimis unui backend al aplicației și nu este încărcat în repository.
- PDF-ul/imaginea este păstrat(ă) numai în memoria sesiunii browserului pentru citire, OCR și previzualizare.
- Modulul AI nu scrie PDF-ul, imaginea sau textul OCR în `localStorage`/`sessionStorage`.
- La `RESET` se elimină selecția curentă; la părăsirea paginii, câmpurile sensibile din DOM sunt golite.
- După selectarea unui document, fereastra AI blochează conexiunile externe din thread-ul principal (`fetch`, XHR, WebSocket, EventSource și `sendBeacon`).

## Protecții PDF

În versiunea 1.0.1, runtime-ul AI folosește PDF.js **6.2.108**, versiune care include remedierea pentru CVE-2026-16633. Încărcarea PDF este forțată cu:

- `isEvalSupported: false`;
- `enableScripting: false`;
- `enableXfa: false`;
- `useWasm: false` pentru parserul PDF.js.

Înainte de parsare se verifică magic-header-ul `%PDF-` și se blochează documentele care expun în structură elemente active precum JavaScript, OpenAction, Launch, EmbeddedFile, RichMedia sau SubmitForm.

Pagina AI aplică o Content Security Policy dedicată, fără `object`, fără `frame`, cu scripturi executabile numai de pe aceeași origine sau din Blob-uri create de runtime.

## Inițializarea OCR

Componentele OCR sunt încărcate și inițializate înainte ca selectorul de fișiere să devină disponibil. Astfel, documentul real nu poate fi ales înainte ca runtime-ul tehnic să fie pregătit. După selecție se activează blocarea conexiunilor externe din fereastra AI.

## Date publice de test

Fixture-urile de benchmark păstrate în repository sunt complet sintetice. Ele reproduc numai structuri juridice necesare testelor de regresie și nu trebuie să conțină valori preluate din persoane sau documente reale.

## Cadrul juridic relevant

Pentru o utilizare instituțională cu date reale ale persoanelor private de libertate trebuie avute în vedere, în funcție de scop și calitatea operatorului, în special:

- Legea nr. 363/2018 privind protecția datelor prelucrate de autoritățile competente în scopul prevenirii, descoperirii, cercetării, urmăririi penale, combaterii infracțiunilor sau executării pedepselor;
- Legea nr. 254/2013, inclusiv regula de confidențialitate a datelor persoanelor condamnate;
- HG nr. 157/2016 privind regulamentul de aplicare a Legii nr. 254/2013, inclusiv obligațiile privind confidențialitatea dosarului și protecția aplicațiilor informatice;
- normele interne aplicabile operatorului și instrucțiunile responsabilului cu protecția datelor/securitatea cibernetică.

Această pagină documentează arhitectura aplicației și nu substituie autorizarea instituțională, evaluarea de impact sau procedurile interne atunci când aplicația este folosită într-un cadru oficial.

## Limitare tehnică

GitHub Pages este un hosting static. Runtime-ul OCR folosește componente terțe versionate care sunt inițializate înainte de selectarea documentului. Pentru un mediu cu cerințe instituționale mai stricte, nivelul următor este self-hosting-ul integral al tuturor binarelor OCR/PDF în același origin și publicarea cu headere HTTP administrate centralizat.

(function () {
  "use strict";

  const data = window.INSTRUCTAJ_DATA;
  if (!data || !Array.isArray(data.workflows)) {
    throw new Error("INSTRUCTAJ_DATA trebuie încărcat înainte de fișa de verificare a dosarului transferat.");
  }

  const workflow = {
    id: "verificare-dosar-transfer",
    category: "Regim și transfer",
    title: "Verificarea dosarului sosit prin transfer",
    summary: "Control integral al identității, titlului de deținere, hotărârilor, calculelor, deducerilor, interdicțiilor, situațiilor speciale și termenelor după sosirea dosarului prin transfer.",
    legal: [
      "OMJ nr. 2.188/C/2022: art. 17–24, 68–82, 190–197 și 229–230",
      "Cod penal: art. 65–66, 72–73 și 100",
      "Legea nr. 169/2017 — fostul art. 55¹ din Legea nr. 254/2013, numai pentru situațiile istorice în care continuă să producă efecte",
      "CCR, Decizia nr. 293/17.05.2022 — art. 55¹ alin. (5) lit. b) din Legea nr. 254/2013",
      "Legea nr. 240/2019 — abrogarea mecanismului compensatoriu și dispozițiile tranzitorii"
    ],
    trigger: "La primirea documentarului penal/dosarului individual al unei persoane sosite prin transfer și ori de câte ori dosarul este completat ulterior cu acte care schimbă situația juridică.",
    responsible: "Lucrătorul de evidență căruia îi este repartizat documentarul efectuează controlul integral; calculele și operările se supun verificării persoanei competente potrivit circuitului unității.",
    documents: [
      "documentul de identitate și copia scanată",
      "MEPI, sentința penală în extenso, decizia penală și hotărârile anterioare relevante",
      "situația juridică, fișa de evidență a zilelor, cazierul și documentele privind deducerile",
      "dosarele/perioadele anterioare conexabile, actele de extrădare/transfer internațional și eventualele garanții",
      "opisurile dosarului, registrul de termene și documentele privind munca, obligațiile civile, interdicțiile și tratamentul medical"
    ],
    deadline: "Controlul se face imediat după repartizarea dosarului, înainte ca datele preluate să fie folosite pentru comisie, liberare condiționată, regim, transfer, prezentare ori punere în libertate.",
    result: "Dosarul, aplicația și registrele conțin aceeași situație juridică, susținută de documente, iar toate lipsurile sau neconcordanțele au fost identificate, solicitate și urmărite până la remediere.",
    steps: [
      "1. IDENTITATE. Confruntă datele din aplicație cu documentul de identitate și cu actele judiciare. Corectează numai erorile proprii de evidență pe baza documentului-sursă și încarcă în aplicație documentul de identitate scanat, potrivit circuitului tehnic al unității.",
      "2. TITLUL DE DEȚINERE ȘI HOTĂRÂRILE. Verifică MEPI, sentința penală în extenso și decizia penală, dacă există; decizia se citește în extenso mai ales când modifică sentința. Dacă hotărârea executată revocă/anulează o soluție anterioară ori preia resturi/revocări succesive, solicită și hotărârile din lanțul juridic necesare pentru a putea reconstitui executarea. Confruntă data începerii și data expirării cu dosarul și situația juridică. Verifică existența scanului MEPI în aplicație.",
      "3. DATA FAPTEI, LEGEA APLICABILĂ ȘI MENȚIUNILE DIN CONDAMNARE. Verifică data săvârșirii faptei și legea penală aplicată prin hotărâre. Data de 01.02.2014 este reperul intrării în vigoare a noului Cod penal, dar nu se stabilește mecanic legea liberării condiționate numai din această dată; se verifică hotărârea definitivă și regulile de drept tranzitoriu/lege penală mai favorabilă aplicabile cauzei. Dacă există obligații civile, consemnează cuantumul și creditorul conform hotărârii și asigură documentarea necesară analizei art. 100 alin. (1) lit. c) Cod penal. Verifică pedepsele accesorii/complementare și dreptul de vot exact cum rezultă din dispozitiv: în Codul penal actual dreptul de a alege este art. 66 alin. (1) lit. d); pentru condamnările supuse Codului penal anterior se citește exact interdicția stabilită în hotărâre, fără conversii automate. Înregistrează toate interdicțiile. Dacă există interdicția de a comunica/de a se apropia de anumite persoane, înscrie informația și în mențiunile speciale și transmite informarea către sectorul vizită conform circuitului intern. Dacă hotărârea impune tratament medical, înscrie mențiunea specială și informează cabinetul medical. Verifică starea de recidivă indicată în mandat/hotărâre; pentru neconcordanțe solicită lămuriri instanței emitente.",
      "4. REST DINTR-O PEDEAPSĂ ANTERIOARĂ. Dacă pedeapsa actuală include un rest rămas neexecutat dintr-o condamnare anterioară, solicită hotărârea din care provine restul și actele care explică modul de preluare. Verifică și obligațiile civile din hotărârea anterioară, în măsura în care sunt relevante situației actuale, și păstrează descrierea completă a faptelor/obligațiilor în evidența internă.",
      "5. SUSPENDARE SAU AMÂNAREA APLICĂRII PEDEPSEI. Dacă executarea actuală rezultă din revocarea/anularea unei suspendări ori din anularea/revocarea amânării aplicării pedepsei, solicită hotărârile inițiale și hotărârile care au produs efectul executoriu. Nu trata o pedeapsă încă suspendată sau o amânare încă activă ca pedeapsă aflată în executare.",
      "6. PERIOADE DEDUSE ȘI ZILE CONSIDERATE EXECUTATE. Pentru fiecare perioadă dedusă stabilește locul și natura privării de libertate: reținere, arest preventiv, arest la domiciliu, detenție în străinătate ori perioadă executată într-un penitenciar. Dacă perioada a fost executată în penitenciar, verifică dacă documentarul vechi este conexat; dacă nu, solicită-l. Verifică zilele considerate executate ca urmare a muncii și informează structura de organizare a muncii când lipsurile pot influența calculul sau intrarea în analiza pentru liberare condiționată. Pentru perioadele istorice relevante mecanismului compensatoriu, verifică intervalele, condițiile de detenție, calculul deja acordat și efectele jurisprudenței obligatorii; nu acorda administrativ «încă o dată» același beneficiu doar din presupunere. Dacă există dubiu privind valorificarea anterioară ori efectul asupra pedepsei, solicită lămuriri/actul instanței competente. Dacă lipsesc datele despre condițiile de detenție din centrele de reținere și arestare preventivă, solicită informațiile autorității care deține evidența. Verifică concordanța dintre fișa de evidență a zilelor și aplicație.",
      "7. EXTRĂDARE / CONTINUAREA EXECUTĂRII DIN STRĂINĂTATE. Dacă persoana a fost extrădată, înscrie în mențiuni speciale statul de predare, de exemplu «EXTRĂDAT DIN GERMANIA»; dacă executarea continuă în România după o perioadă executată în străinătate, folosește o formulare care indică ambele elemente, de tipul «EXTRĂDAT / CONTINUARE DIN GERMANIA». Pentru extrădările cu garanții, verifică documentele de garanție și operează exact condițiile comunicate oficial. Mențiunea internă «ATENȚIE G — GERMANIA CU INFORMARE ANP» se folosește numai dacă rezultă din actele/îndrumările ANP aplicabile persoanei concrete. Dacă fișa urmăritului sau alte acte arată o perioadă de detenție în vederea extrădării care nu este reflectată în titlul de executare, verifică existența unei hotărâri/contestații privind deducerea; persoana poate fi informată asupra posibilității de a solicita instanței deducerea, însă structura de evidență nu deduce din proprie inițiativă o perioadă pe care titlul executoriu nu o valorifică.",
      "8. CAZIER. Verifică informațiile din cazier și corelează-le cu situația juridică și condamnările deja introduse. Evită dublarea aceleiași condamnări sau a aceleiași mențiuni sub denumiri diferite.",
      "9. OPIS DOSAR. Verifică existența și actualizarea fișelor de opis ale documentarului — opis 1/opis 2, după structura utilizată — și concordanța dintre opis și actele efectiv existente. Orice document nou se introduce în partea corectă și se înscrie în opis.",
      "10. RECHIZITORIU / CAUZĂ PENALĂ NOUĂ. La primirea unui rechizitoriu într-o cauză nouă, introdu informația în mențiuni speciale și verifică dacă persoana muncește; dacă noua calitate procesuală, citarea ori audierea poate afecta programarea/prezentarea, informează organizarea muncii și celelalte structuri interesate potrivit circuitului intern. Procedează similar la o citație/audiere în calitate de suspect sau inculpat într-un alt dosar decât cele deja cunoscute. Actualizează mențiunea când situația evoluează — condamnare, achitare, încetarea procesului, clasare ori altă soluție comunicată oficial — fără a șterge istoricul necesar trasabilității.",
      "11. PROBE BIOLOGICE. Dacă hotărârea definitivă dispune prelevarea probelor biologice, introdu dispoziția în modulul «Situație juridică → Condamnări definitive» și verifică executarea/comunicarea operațiunii potrivit circuitului aplicabil.",
      "12. REGISTRUL DE TERMENE. După toate verificările și eventualele recalculări, actualizează registrul de termene: expirarea pedepsei, fracțiile și datele relevante pentru liberarea condiționată, reanalizările și orice alt termen modificat de actele identificate. Compară registrul cu aplicația și documentarul înainte de închiderea controlului."
    ],
    checks: [
      "Identitatea, MEPI, hotărârile și datele de executare sunt concordante între dosar și aplicație.",
      "Pentru fiecare deducere există un document și este cunoscut locul în care perioada a fost executată.",
      "Resturile, revocările/anulările și condamnările anterioare pot fi reconstruite din hotărârile existente în dosar.",
      "Obligațiile civile, interdicțiile, tratamentul medical, extrădarea/garanțiile și probele biologice sunt operate în toate modulele/fluxurile în care trebuie să producă efecte.",
      "Cazierul și situația juridică nu conțin dubluri.",
      "Opisurile sunt actualizate, iar registrul de termene coincide cu calculul verificat."
    ],
    pitfalls: [
      "A considera automat că orice faptă după 01.02.2014 impune NCP la liberarea condiționată, fără verificarea legii aplicabile cauzei.",
      "A transforma vechiul art. 64 Cod penal în art. 66 Cod penal prin echivalare automată, în loc să operezi exact dispozitivul hotărârii.",
      "A acorda de două ori zile compensatorii ori a modifica restul pedepsei fără un temei juridic clar și fără actul competent.",
      "A deduce administrativ detenția în vederea extrădării dacă aceasta nu rezultă din titlul executoriu sau dintr-o hotărâre competentă.",
      "A omite notificarea structurilor operative atunci când o interdicție, tratamentul medical ori o nouă cauză penală necesită măsuri practice.",
      "A actualiza aplicația fără actualizarea simultană a documentarului și registrului de termene."
    ],
    legalRules: [
      "OMJ nr. 2.188/C/2022 impune verificarea documentelor care justifică deținerea, corelarea situației juridice și păstrarea documentarului complet și trasabil; transferul nu înlătură obligația unității primitoare de a verifica dosarul primit.",
      "Cod penal art. 100 alin. (1) lit. c): îndeplinirea integrală a obligațiilor civile stabilite prin hotărârea de condamnare este una dintre condițiile liberării condiționate, cu excepția imposibilității dovedite de îndeplinire.",
      "Cod penal art. 66 alin. (1) lit. d) identifică, în regimul actual, dreptul de a alege; interdicțiile se preiau exact din hotărârea judecătorească aplicabilă.",
      "Legea nr. 169/2017 a introdus fostul art. 55¹ privind compensarea pentru condiții necorespunzătoare; mecanismul a fost ulterior abrogat prin Legea nr. 240/2019, dar poate rămâne relevant în situații tranzitorii istorice.",
      "CCR, Decizia nr. 293/17.05.2022 a constatat neconstituționalitatea fostului art. 55¹ alin. (5) lit. b), care excludea perioada «în tranzit» din calculul condițiilor necorespunzătoare. Efectele concrete asupra unui calcul istoric se stabilesc prin raportare la actele persoanei și jurisprudența obligatorie aplicabilă, nu prin dublarea automată a unui beneficiu deja valorificat.",
      "Operațiunile precum mențiunea specială, nota către vizită/cabinet medical/organizarea muncii și marcajele ANP sunt prezentate ca proceduri operaționale interne și se aplică numai în măsura în care corespund circuitului aprobat al unității și instrucțiunilor ANP în vigoare."
    ],
    stop: "Oprește finalizarea controlului și cere actele/lămuririle necesare dacă nu poți reconstitui titlul de deținere, lanțul hotărârilor, perioadele deduse, calculul zilelor, efectul unei extrădări/garanții sau dacă aplicația contrazice documentele judiciare.",
    practice: "Folosește fișa în ordinea 1–12 și notează distinct: verificat, lipsă document, adresă de solicitat, recalcul necesar și informare internă. Un punct bifat trebuie să poată fi demonstrat ulterior prin documentul-sursă."
  };

  if (!data.workflows.some(item => item.id === workflow.id)) {
    const transferIndex = data.workflows.findIndex(item => item.id === "transfer-anp");
    if (transferIndex >= 0) data.workflows.splice(transferIndex + 1, 0, workflow);
    else data.workflows.push(workflow);
  }

  if (!data.codeReferences.some(item => item.code === "CCR nr. 293/2022")) {
    data.codeReferences.push({
      code: "CCR nr. 293/2022",
      articles: "fostul art. 55¹ alin. (5) lit. b) din Legea nr. 254/2013",
      role: "A constatat neconstituțională excluderea perioadei «în tranzit» din mecanismul compensatoriu istoric. Pentru dosarele în care problema mai produce efecte se verifică situația individuală și actele/jurisprudența aplicabile."
    });
  }

  if (!data.codeReferences.some(item => item.code === "Legea nr. 169/2017 / Legea nr. 240/2019")) {
    data.codeReferences.push({
      code: "Legea nr. 169/2017 / Legea nr. 240/2019",
      articles: "fostul art. 55¹ din Legea nr. 254/2013 și dispozițiile tranzitorii",
      role: "Cadru istoric pentru zilele compensatorii acordate pentru condiții necorespunzătoare; mecanismul nu mai generează zile pentru detenția ulterioară abrogării."
    });
  }
})();

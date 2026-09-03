window.INSTRUCTAJ_DATA = {
  verifiedAt: "03.09.2026",
  categories: ["Primire și verificare", "Calcul și liberare", "Regim și transfer", "Situații speciale", "Minori", "Documente și comunicări"],
  workflows: [
    {
      id: "control-zilnic", category: "Primire și verificare", title: "Controlul zilnic al legalității deținerii", summary: "Verificarea termenelor și a actelor care pot modifica sau înceta privarea de libertate.",
      legal: ["OMJ 2188/C/2022: art. 3–9, art. 21, art. 92, art. 229–230"],
      trigger: "La începutul programului și ori de câte ori intră un act privind situația juridică.",
      steps: ["Consultă registrul de termene și aplicația informatică; compară alertele cu documentarele penale.", "Identifică expirările, termenele de comisie, verificările arestării preventive și reanalizările apropiate.", "Verifică toate actele sosite de la organele judiciare înainte de operare: emitent, persoană, dosar, măsură, caracter executoriu și autenticitate.", "Actualizează coerent documentarul penal, aplicația și registrul relevant; semnează operațiunea potrivit competenței.", "Escaladează imediat orice risc de deținere fără temei sau de liberare tardivă."],
      checks: ["Termenele din aplicație coincid cu registrul.", "Există document justificativ pentru fiecare schimbare.", "Operațiunile supuse verificării ierarhice sunt contrasemnate."],
      pitfalls: ["A te baza numai pe alerta aplicației.", "A amâna verificarea unui act până la sfârșitul programului."]
    },
    {
      id: "primire-condamnat", category: "Primire și verificare", title: "Primirea unei persoane condamnate", summary: "Controlul dosarului de predare, al identității și al mandatului înainte de înregistrare.",
      legal: ["OMJ 2188/C/2022: art. 10–16", "CPP: art. 556 alin. (2^1)"],
      trigger: "La predarea din libertate, arest la domiciliu sau dintr-un centru de reținere și arestare preventivă.",
      steps: ["Primește persoana în echipa prevăzută de Instrucțiuni și identifică exact ruta de proveniență.", "Confruntă identitatea declarată, actul de identitate, datele din mandat și semnalmentele; tratează orice neconcordanță ca incident de clarificat.", "Verifică existența mandatului și a documentelor cerute pentru ruta concretă de primire; forma transmisă la distanță trebuie să permită stabilirea autenticității.", "Dacă există erori materiale, stabilește dacă actul permite totuși identificarea certă și cunoașterea măsurii; solicită rectificarea fără a modifica tu actul.", "Atribuie numerele matricole, constituie/reia evidența și predă dosarul lucrătorului desemnat."],
      checks: ["Identitatea este certă.", "Mandatul privește persoana predată și este executoriu.", "Lipsurile documentare sunt consemnate și solicitate în termenul aplicabil."],
      pitfalls: ["Confundarea unei erori materiale remediabile cu lipsa temeiului de deținere.", "Primirea pe baza unei copii a cărei autenticitate nu poate fi verificată."],
      codeNote: "Art. 556 CPP reglementează punerea în executare a mandatului de executare a pedepsei. În practică, justifică transmiterea înscrisului prin mijloace care produc un document scris și permit verificarea autenticității."
    },
    {
      id: "prelucrare-dosar", category: "Primire și verificare", title: "Prelucrarea documentarului penal după primire", summary: "Operațiunile inițiale care transformă dosarul primit într-o evidență juridică verificată.",
      legal: ["OMJ 2188/C/2022: art. 17–21", "CP: art. 66 alin. (1) lit. c) și l)"],
      trigger: "Imediat după repartizarea dosarului individual.",
      steps: ["Verifică autenticitatea, legalitatea și caracterul executoriu al fiecărui act legal de deținere.", "Compară dispozitivul hotărârii, mandatul și perioadele deduse; solicită sentințele/deciziile lipsă când mandatul nu oferă datele necesare.", "Caută evidențele anterioare și listele speciale înainte de deschiderea sau reactivarea poziției informatice.", "Înscrie cronologic situația juridică, expirarea, fracțiile și celelalte termene; completează fișele și comunicările impuse.", "Înregistrează pedepsele accesorii/complementare, măsurile de siguranță, obligațiile civile și eventualele dispoziții privind probe biologice.", "Supune calculul și operările controlului persoanelor competente și transmite confirmarea de primire emitentului."],
      checks: ["Hotărârea și mandatul nu sunt citite izolat.", "Perioadele anterioare sunt susținute de dosarul vechi sau acte oficiale.", "Poziția «interni» este nouă ori reactivată corect."],
      pitfalls: ["Operarea înainte de verificarea evidențelor anterioare.", "Omiterea pedepselor complementare din aplicație."],
      codeNote: "Art. 66 CP enumeră drepturile a căror exercitare poate fi interzisă. Lit. c) privește dreptul străinului de a se afla pe teritoriul României, iar lit. l) dreptul de a se afla în anumite localități stabilite de instanță. Se operează exact dispozitivul hotărârii."
    },
    {
      id: "calcul-pedeapsa", category: "Calcul și liberare", title: "Calculul pedepsei, deducerilor și expirării", summary: "Stabilirea cronologică a perioadei ce trebuie executată, fără aproximări.",
      legal: ["OMJ 2188/C/2022: art. 20, art. 22–24, art. 26", "CP: art. 99–100"],
      trigger: "La primire și după orice act care schimbă pedeapsa ori perioadele considerate executate.",
      steps: ["Stabilește data începerii executării din actele oficiale, inclusiv momentul introducerii în arest când privarea a fost continuă.", "Transformă pedeapsa în interval calendaristic și aplică separat toate perioadele deduse sau adăugate, exact cum rezultă din acte.", "Calculează data expirării și apoi fracția obligatorie și fracția totală pentru liberare condiționată.", "Ia în calcul zilele considerate executate numai în condițiile și limitele legii; nu transforma o informație neverificată într-o deducere.", "Consemnează formula și rezultatul în toate evidențele cerute, apoi efectuează dublul control."],
      checks: ["Ziua de început și ziua de sfârșit sunt tratate conform art. 22.", "Nu există suprapuneri între perioadele deduse.", "Orice recalcul păstrează urma documentului care l-a determinat."],
      pitfalls: ["Rotunjirea fracțiilor fără temei.", "Deducerea aceleiași perioade de două ori.", "Confundarea expirării pedepsei cu data propozabilă pentru liberare."],
      codeNote: "Art. 99–100 CP stabilesc condițiile liberării condiționate. Împlinirea fracției este necesară, dar nu produce automat liberarea: instanța verifică și celelalte condiții legale."
    },
    {
      id: "liberare-conditionata", category: "Calcul și liberare", title: "Pregătirea liberării condiționate", summary: "De la identificarea persoanelor propozabile până la trimiterea lucrărilor instanței.",
      legal: ["OMJ 2188/C/2022: art. 26–34", "CP: art. 99–101", "CPP: art. 587"],
      trigger: "Înainte de împlinirea fracției sau la cererea persoanei private de libertate.",
      steps: ["Corelează registrul de termene cu tabelele privind zilele considerate executate și selectează persoanele ce trebuie analizate.", "Reverifică fracția, zilele câștigate, sancțiunile, recompensele, antecedentele și toate datele necesare procesului-verbal.", "Pregătește dosarul și procesul-verbal preconstituit pentru comisie; solicită/comasează documentele sectoarelor competente.", "Consemnează propunerea motivată a comisiei și termenul de reexaminare, dacă este cazul.", "Înaintează instanței competente procesul-verbal și înscrisurile; operează soluția definitivă numai după verificare."],
      checks: ["Fracția a fost recalculată la ziua analizei.", "Propunerea comisiei nu este prezentată drept hotărâre de liberare.", "Termenul de reexaminare este introdus în registru și aplicație."],
      pitfalls: ["A afirma că persoana «trebuie liberată» numai fiindcă a împlinit fracția.", "Omiterea persoanelor aflate în întrerupere sau temporar la MAI, când condițiile OMJ sunt îndeplinite."],
      codeNote: "Art. 101 CP permite instanței să stabilească măsuri de supraveghere și obligații când restul neexecutat este de cel puțin 2 ani. Art. 587 CPP reglementează sesizarea și judecarea liberării condiționate."
    },
    {
      id: "schimbare-juridica", category: "Situații speciale", title: "Înregistrarea unei schimbări în situația juridică", summary: "Gestionarea unei hotărâri noi, a unui mandat nou sau a unei căi de atac.",
      legal: ["OMJ 2188/C/2022: art. 35–44"],
      trigger: "La primirea oricărui act care modifică, suspendă, desființează sau completează situația juridică.",
      steps: ["Identifică efectul juridic exact al actului și momentul de la care produce efecte.", "Verifică autenticitatea, caracterul executoriu și corespondența cu persoana/dosarul.", "Înscrie mai întâi actul în documentarul penal și apoi efectuează operarea informatică și în registre.", "Recalculează expirarea, fracțiile și termenele afectate; păstrează distinct pedepsele necontopite.", "Informează structurile interesate și solicită instanței lămuriri ori aplicarea regulilor pluralității, când este necesar.", "Semnează și obține contrasemnarea verificării, potrivit Instrucțiunilor."],
      checks: ["Efectul este dedus din dispozitiv, nu din presupuneri.", "Vechea stare nu este ștearsă fără urmă; istoricul rămâne inteligibil.", "Toate termenele dependente au fost recalculate."],
      pitfalls: ["Activarea automată a ultimului mandat fără analiza ordinii de executare.", "Operarea minutei/hotărârii înainte de confirmarea autenticității."],
      codeNote: "Dacă în camera preliminară cauza este restituită la parchet în condițiile art. 346 alin. (3) CPP, clasificarea procesuală și regimul de executare pot necesita actualizare conform OMJ art. 35–36."
    },
    {
      id: "stabilire-regim", category: "Regim și transfer", title: "Stabilirea regimului de executare", summary: "Pregătirea primei comisii și punerea în aplicare a regimului stabilit.",
      legal: ["OMJ 2188/C/2022: art. 45–55"],
      trigger: "După finalizarea perioadei de carantină și observare sau în celelalte situații prevăzute de lege.",
      steps: ["Primește documentele de la secția de carantină în termenul operațional și verifică dacă dosarul este complet.", "Stabilește data comisiei și introdu componența în aplicație.", "Pregătește procesul-verbal și datele juridice relevante pentru individualizarea regimului.", "După ședință, consemnează regimul, comunică decizia persoanei și înregistrează eventuala plângere.", "Urmărește soluția judecătorului/instanței și emite actele de punere în aplicare numai la momentul legal."],
      checks: ["Regimul provizoriu este distinct de regimul stabilit de comisie.", "Comunicarea și termenul plângerii sunt documentate.", "Aplicația, documentarul și registrul de termene coincid."],
      pitfalls: ["Punerea în aplicare înainte de momentul prevăzut de lege.", "Omiterea efectului unei plângeri ori contestații." ]
    },
    {
      id: "schimbare-regim", category: "Regim și transfer", title: "Reanalizarea și schimbarea regimului", summary: "Fluxul periodic sau declanșat de conduită pentru menținerea ori schimbarea regimului.",
      legal: ["OMJ 2188/C/2022: art. 56–67"],
      trigger: "La termenul legal de reanalizare ori când intervine situația disciplinară/obiectivă prevăzută de lege.",
      steps: ["Înregistrează termenul de reanalizare și urmărește-l în registru și aplicație.", "Colectează hotărârile disciplinare, rapoartele și evaluările relevante.", "Pregătește tabelul și raportul comisiei, fără a omite situațiile ce impun analiză înainte de termen.", "Consemnează propunerea, decizia și motivarea; comunică persoanei sub semnătură.", "Înregistrează plângerea și soluția, apoi pune în aplicare regimul definitiv și fixează următorul termen."],
      checks: ["Temeiul reanalizării este identificat.", "Datele disciplinare sunt definitive și corect introduse.", "Următorul termen este calculat de la reperul legal corect."],
      pitfalls: ["Confundarea propunerii unui sector cu decizia comisiei.", "Calcularea următorului termen de la o dată greșită." ]
    },
    {
      id: "transfer-anp", category: "Regim și transfer", title: "Transferul între locuri de deținere ANP", summary: "Propunere, avizare, dispoziție, pregătire și primire la destinație.",
      legal: ["OMJ 2188/C/2022: art. 68–82"],
      trigger: "La stabilirea/schimbarea regimului, la cerere sau pentru un alt motiv legal de transfer.",
      steps: ["Stabilește ruta procedurală: propunere a comisiei, cerere a persoanei sau alt temei legal.", "Verifică impedimentele, cererile aflate în așteptare și datele necesare avizului consultativ.", "Înaintează lucrările către autoritatea competentă și urmărește răspunsul/dispoziția.", "Comunică soluția sub semnătură și verifică dacă dispoziția poate fi pusă în executare.", "Anterior plecării, actualizează aplicația, verifică termenele și pregătește documentarul/dosarele pentru predare sigură.", "La destinație, verifică persoana, documentele și integritatea dosarelor; confirmă primirea și activează evidența."],
      checks: ["Avizul comisiei este tratat ca aviz, nu ca dispoziție.", "Există control pentru acte urgente primite în timpul transferului.", "Dosarul individual însoțește persoana conform art. 81."],
      pitfalls: ["Transferul pe baza simplei cereri.", "Plecarea fără actualizarea termenelor apropiate sau fără predarea completă a documentelor." ]
    },
    {
      id: "transfer-crap", category: "Situații speciale", title: "Transfer temporar la un centru MAI și reprimirea", summary: "Măsuri excepționale pentru prezentarea la organele judiciare și continuitatea evidenței.",
      legal: ["OMJ 2188/C/2022: art. 83–88"],
      trigger: "La solicitarea transferării temporare într-un centru de reținere și arestare preventivă.",
      steps: ["Verifică existența temeiului și caracterul excepțional al transferului.", "Pregătește adresa, actele, situația juridică și termenele ce trebuie urmărite pe durata absenței.", "Marchează corect transferul temporar în aplicație; nu închide situația ca transfer definitiv.", "Menține circuitul pentru acte urgente și pentru o eventuală punere în libertate.", "La reprimire, verifică documentele noi, perioadele, incidentele și continuitatea privării de libertate; reactivează evidența corectă."],
      checks: ["Locul unde se află fizic persoana este mereu cunoscut.", "Actele primite în perioada transferului au fost prelucrate.", "Nu există zi lipsă ori dublată în cronologia executării."],
      pitfalls: ["Tratarea deplasării ca un transfer ANP obișnuit.", "Omiterea recalculării dacă situația juridică s-a schimbat în perioada absenței." ]
    },
    {
      id: "punere-libertate", category: "Calcul și liberare", title: "Punerea în libertate", summary: "Verificarea actului, controlul impedimentelor și închiderea completă a evidenței.",
      legal: ["OMJ 2188/C/2022: art. 89–96", "CP: art. 66 alin. (1) lit. c), l) și o)"],
      trigger: "La expirarea pedepsei sau la primirea unui act executoriu de punere în libertate.",
      steps: ["Confirmă autenticitatea și conținutul adresei/hotărârii cu organul emitent, potrivit circuitului stabilit.", "Verifică toate evidențele pentru alte mandate, măsuri preventive, sancțiuni privative sau impedimente.", "Efectuează controlul încrucișat al identității, datei și temeiului liberării.", "Obține aprobarea/semnăturile persoanelor competente și coordonează predarea către poliție când există o măsură ce trebuie executată.", "Închide situația în aplicație, completează documentarul, biletul și comunicările către autoritățile competente.", "Arhivează dovada comunicărilor și ora efectivă a liberării."],
      checks: ["Sunt verificate listele și evidențele pentru alte temeiuri de deținere.", "Actul transmis la distanță a fost confirmat.", "Măsurile de siguranță/pedepsele complementare au fost comunicate autorității competente."],
      pitfalls: ["Punerea în libertate doar pe baza unei convorbiri telefonice.", "Întârzierea nejustificată după primirea unui act executoriu autentic."],
      codeNote: "Drepturile interzise prin art. 66 CP se execută exact în limitele hotărârii. Unele impun comunicări și coordonare la liberare; structura de evidență nu extinde conținutul pedepsei."
    },
    {
      id: "intrerupere", category: "Situații speciale", title: "Întreruperea executării pedepsei", summary: "Punerea în libertate temporară, monitorizarea termenului și comunicările obligatorii.",
      legal: ["OMJ 2188/C/2022: art. 97–105"],
      trigger: "La comunicarea hotărârii definitive de întrerupere sau a prelungirii acesteia.",
      steps: ["Verifică autenticitatea, caracterul definitiv/executoriu și durata întreruperii.", "Calculează data la care persoana trebuie să se prezinte și înscrie termenul în registru și aplicație.", "Ia declarația de luare la cunoștință, întocmește actele de liberare și efectuează comunicările impuse.", "Înregistrează persoana în evidența specifică și verifică periodic apropierea expirării.", "La o nouă hotărâre, actualizează imediat data expirării și comunicările; nu suprascrie istoricul."],
      checks: ["Perioada de întrerupere nu este tratată ca perioadă executată.", "Data revenirii este comunicată persoanei.", "Prelungirile au acte distincte și sunt operate cronologic."],
      pitfalls: ["Scăderea întreruperii din pedeapsă ca și cum ar fi fost executată.", "Monitorizarea exclusiv în aplicație, fără registrul de termene." ]
    },
    {
      id: "reprimire-intrerupere", category: "Situații speciale", title: "Reprimirea din întreruperea executării", summary: "Reluarea legală a executării și tratarea prezentării tardive.",
      legal: ["OMJ 2188/C/2022: art. 106–111"],
      trigger: "La prezentarea voluntară sau aducerea persoanei după întrerupere.",
      steps: ["Stabilește identitatea și momentul exact al revenirii, în echipa de primire prevăzută.", "Verifică dacă revenirea este în termen și dacă au apărut mandate/hotărâri noi.", "Reactivează evidența ca o continuare a aceleiași situații juridice, dacă actele confirmă continuitatea.", "Adaugă perioada neexecutată și recalculează expirarea, fracțiile și toate termenele dependente.", "Pentru prezentarea tardivă, întocmește actele și comunicările speciale prevăzute de Instrucțiuni.", "Comunică instanței data reluării executării."],
      checks: ["Ziua plecării și ziua revenirii sunt tratate după regula OMJ.", "Perioada din libertate nu intră în executare.", "Noile acte sunt analizate înainte de reactivare."],
      pitfalls: ["Deschiderea unei poziții noi când situația este o continuare.", "Omiterea mandatului sosit în perioada întreruperii." ]
    },
    {
      id: "evadare", category: "Situații speciale", title: "Evadarea și reprimirea după evadare", summary: "Suspendarea cronologiei executării, documentarea incidentului și recalculul la reprimire.",
      legal: ["OMJ 2188/C/2022: art. 112–116", "CP: art. 99–100"],
      trigger: "La constatarea evadării sau la predarea persoanei prinse.",
      steps: ["Înregistrează imediat data și ora evadării pe baza procesului-verbal și efectuează informările operative.", "Actualizează situația în aplicație și registre fără a inventa data viitoarei reprimiri.", "La prindere, verifică identitatea și procesul-verbal de predare; stabilește locul de deținere competent.", "Calculează perioada neexecutată conform regulii speciale din OMJ și reface expirarea și fracțiile.", "Consemnează recalculul în documentar, aplicație și registre și supune-l dublului control."],
      checks: ["Există ore/date documentate pentru evenimente.", "Perioada de evadare este exclusă o singură dată.", "Fracțiile de liberare au fost recalculate."],
      pitfalls: ["Aplicarea regulii generale de calcul fără regula specială a art. 115.", "Estimarea datei prinderii din informații neoficiale." ]
    },
    {
      id: "primire-arest-preventiv", category: "Primire și verificare", title: "Primirea persoanei arestate preventiv în cursul judecății", summary: "Documente, identitate, înregistrare și relația cu mandatele din alte cauze.",
      legal: ["OMJ 2188/C/2022: art. 119–132", "CPP: art. 230 alin. (4^1) și (5), art. 16"],
      trigger: "La transferul din centrul MAI al persoanei aflate la dispoziția instanței.",
      steps: ["Confirmă faza procesuală; în penitenciar nu se primesc, ca regulă, arestații preventiv aflați în urmărire penală.", "Verifică mandatul, procesul-verbal, actul de identitate, adresa de predare și restul documentelor cerute.", "Stabilește identitatea și verifică autenticitatea mandatului transmis în forma permisă de CPP.", "Constituie documentarul, înscrie situația și termenele, apoi transmite confirmările și informările necesare.", "La un mandat/hotărâre nouă, stabilește dacă se activează condamnarea, se suspendă un regim ori se schimbă clasificarea procesuală."],
      checks: ["Faza procesuală este susținută de act oficial.", "Mandatul este valabil și executoriu.", "Nu se confundă cauza de arestare cu o altă cauză de condamnare."],
      pitfalls: ["Primirea unei persoane aflate în urmărire penală în afara excepțiilor legale.", "Închiderea automată a arestării la primirea unei hotărâri nedefinitive."],
      codeNote: "Art. 230 CPP privește mandatul de arestare preventivă și actele de executare. Art. 16 CPP enumeră cazurile care împiedică exercitarea acțiunii penale; efectul concret se preia numai din soluția organului judiciar."
    },
    {
      id: "termene-arest", category: "Calcul și liberare", title: "Urmărirea termenelor arestării preventive", summary: "Controlul verificărilor periodice și al duratei maxime în cursul judecății.",
      legal: ["OMJ 2188/C/2022: art. 133–141", "CPP: art. 239 alin. (1)"],
      trigger: "De la primirea persoanei arestate preventiv și după fiecare încheiere privind măsura.",
      steps: ["Înregistrează termenul fiecărei verificări periodice și termenul privind durata maximă în registru și aplicație.", "Stabilește reperul de început numai din actele procesuale indicate de lege și OMJ.", "Verifică zilnic termenele apropiate și solicită actele lipsă înainte de expirare.", "La primirea încheierii, verifică autenticitatea, caracterul definitiv/executoriu și soluția exactă.", "Dacă apar neclarități sau risc de încetare de drept, solicită de urgență lămuriri instanței și informează ierarhic; nu substitui instanța."],
      checks: ["Termenul periodic și durata maximă sunt evidențe distincte.", "Reperul inițial este documentat.", "Orice încetare/menținere este operată din act, nu din informații informale."],
      pitfalls: ["Confundarea termenului de verificare cu durata maximă.", "Calcularea automată a punerii în libertate fără actul și circuitul legal."],
      codeNote: "Art. 239 alin. (1) CPP limitează durata arestării preventive în cursul judecății în primă instanță: termen rezonabil, cel mult jumătate din maximul special al pedepsei pentru acuzație și, în orice caz, nu mai mult de 5 ani."
    },
    {
      id: "primire-minor", category: "Minori", title: "Primirea unei persoane cu măsură educativă privativă", summary: "Verificarea hotărârii de internare și constituirea evidenței în centru.",
      legal: ["OMJ 2188/C/2022: art. 142–153", "CPP: art. 514 alin. (1), art. 515 alin. (1)", "CP: art. 124–125 și art. 129"],
      trigger: "La predarea unei persoane față de care s-a dispus internarea într-un centru educativ sau de detenție.",
      steps: ["Verifică tipul măsurii, centrul competent și documentele care însoțesc persoana.", "Confruntă identitatea și hotărârea; dacă neconcordanța împiedică stabilirea certă a persoanei ori măsurii, motivează și clarifică potrivit OMJ.", "Verifică autenticitatea, legalitatea și caracterul executoriu al hotărârii/mandatului de internare.", "Stabilește data începerii executării și fracția de jumătate, ținând cont numai de perioade dovedite.", "Înregistrează situația, termenele și datele în documentar/aplicație; efectuează comunicările și dublul control.", "Dacă există sancțiuni multiple, sesizează problema pluralității și nu le contopi administrativ."],
      checks: ["Măsura educativă nu este tratată ca pedeapsă cu închisoarea.", "Fracția se raportează la măsura activă.", "Pluralitatea este soluționată de instanță."],
      pitfalls: ["Aplicarea directă a regulilor liberării condiționate pentru adulți.", "Unirea administrativă a mai multor sancțiuni."],
      codeNote: "Art. 514–515 CPP reglementează punerea în executare a internării. Art. 124–125 CP definesc cele două măsuri educative privative, iar art. 129 CP stabilește efectele pluralității de infracțiuni."
    },
    {
      id: "comisie-minor", category: "Minori", title: "Analiza la jumătatea măsurii educative", summary: "Pregătirea consiliului/comisiei pentru înlocuirea măsurii ori punerea în libertate.",
      legal: ["OMJ 2188/C/2022: art. 155–167", "CP: art. 123–125 și art. 129"],
      trigger: "La împlinirea jumătății măsurii sau la termenul de reanalizare.",
      steps: ["Selectează din registrul de termene persoanele ce împlinesc jumătatea și reverifică durata măsurii active.", "Pregătește fișa zilelor considerate executate și documentele consiliului/comisiei.", "Prezintă situația juridică distinct pentru fiecare măsură/pedeapsă nesoluționată prin regulile pluralității.", "Consemnează propunerea și înaintează lucrările instanței; propunerea nu produce singură liberarea sau înlocuirea.", "Operează soluția instanței și termenul următor, dacă este cazul; recalculează la orice modificare a sancțiunii."],
      checks: ["Jumătatea este calculată din sancțiunea în curs.", "Perioadele de suspendare/întrerupere sunt tratate corect.", "Instanța este sesizată pentru pluralitate când este necesar."],
      pitfalls: ["Adunarea fracțiilor măsurilor necontopite.", "Punerea în libertate pe baza procesului-verbal al comisiei."],
      codeNote: "Art. 123–125 CP descriu consecințele conduitei și regulile de înlocuire/prelungire pentru măsurile educative. Soluția aparține instanței, nu structurii de evidență."
    },
    {
      id: "schimbari-minor", category: "Minori", title: "Schimbări juridice și regim la măsuri educative", summary: "Hotărâri noi, arestare în altă cauză și individualizarea regimului.",
      legal: ["OMJ 2188/C/2022: art. 168–189", "CPP: art. 346 alin. (3)", "CP: art. 124–125 și art. 129"],
      trigger: "La o nouă hotărâre, mandat, restituire la parchet sau analiză de regim.",
      steps: ["Verifică actul și clasifică schimbarea: altă cauză, hotărâre definitivă, mandat preventiv, cale extraordinară sau schimbare a măsurii.", "Consemnează cronologic în documentar înaintea operării informatice.", "Stabilește efectul asupra regimului, centrului competent, măsurii active și termenelor.", "Solicită instanței aplicarea regulilor pluralității când sancțiunile coexistă fără soluție.", "Pregătește consiliul/comisia de regim, comunică actele și urmărește căile de atac.", "Recalculează toate datele și obține verificările/semnăturile cerute."],
      checks: ["Cauza nouă este distinctă de cea a internării.", "Suspendarea regimului nu este confundată cu încetarea măsurii.", "Istoricul sancțiunilor rămâne lizibil."],
      pitfalls: ["Schimbarea clasificării doar dintr-o informație telefonică.", "Aplicarea directă a pluralității fără hotărârea instanței." ]
    },
    {
      id: "dosar-consultare", category: "Documente și comunicări", title: "Gestionarea și consultarea dosarului individual", summary: "Structura dosarului, accesul controlat, confidențialitatea și arhivarea.",
      legal: ["OMJ 2188/C/2022: art. 190–197"],
      trigger: "La constituire, predare între lucrători, cerere de consultare sau arhivare.",
      steps: ["Păstrează cele cinci părți ale dosarului separat, cu opis actualizat și documentele în categoria corectă.", "Asigură accesul numai persoanelor autorizate și protejează datele confidențiale.", "Înregistrează cererea de consultare și verifică identitatea/calitatea solicitantului și acordul persoanei, când legea îl cere.", "Supraveghează consultarea și consemnează accesul; nu permite alterarea ori extragerea neautorizată a documentelor.", "La transfer, predă sub semnătură; la arhivare, reunește părțile și verifică integralitatea."],
      checks: ["Opisurile corespund conținutului real.", "Există temei pentru accesul fiecărui solicitant.", "Predarea dosarului are urmă documentară."],
      pitfalls: ["Divulgarea datelor unei terțe persoane fără acord/temei.", "Introducerea unui document în partea greșită sau fără înscriere în opis." ]
    },
    {
      id: "acte-procedura", category: "Documente și comunicări", title: "Comunicarea citațiilor și actelor de procedură", summary: "Înregistrarea, înmânarea, dovada comunicării și prezentarea la organul judiciar.",
      legal: ["OMJ 2188/C/2022: art. 198–209", "CPP: art. 262, art. 364 alin. (4)"],
      trigger: "La primirea unei citații, hotărâri sau a altui act ce trebuie adus la cunoștință.",
      steps: ["Înregistrează actul și verifică persoana, emitentul, dosarul, termenul și dacă este necesară prezentarea fizică.", "Adu actul la cunoștință sub semnătură și completează data reală a comunicării.", "Dacă persoana refuză, întocmește procesul-verbal; refuzul nu se transformă în semnătură fictivă.", "Completează dovada ori adeverința cu toate elementele cerute și restituie-o fără întârziere emitentului.", "Pentru judecarea în lipsă, aplică solicitarea persoanei numai în condițiile art. 364 alin. (4) CPP și ține cont de dispoziția instanței.", "Dacă persoana este transferată sau nu poate fi prezentată, redirecționează/informează urgent și păstrează dovada."],
      checks: ["Data comunicării este cea efectivă.", "Dovada are toate elementele art. 262 CPP.", "Instanța a fost informată despre videoconferință sau imposibilitatea obiectivă."],
      pitfalls: ["Antedatarea dovezii.", "A considera refuzul de primire drept necomunicare fără întocmirea procesului-verbal.", "A nu prezenta persoana doar pentru că a cerut judecarea în lipsă, deși instanța a dispus prezența."],
      codeNote: "Art. 262 CPP stabilește conținutul dovezii și al procesului-verbal de comunicare. Art. 364 alin. (4) CPP permite inculpatului privat de libertate să ceară în scris judecarea în lipsă, dar instanța îl poate aduce dacă apreciază prezența necesară."
    },
    {
      id: "straini", category: "Documente și comunicări", title: "Persoane străine, transfer internațional și azil", summary: "Informări, cereri, predare/preluare și comunicări către autorități.",
      legal: ["OMJ 2188/C/2022: art. 210–223", "CP: art. 66 alin. (1) lit. c)"],
      trigger: "La primirea unui cetățean străin/apatrid, a unei cereri de transfer ori de azil și înainte de liberare.",
      steps: ["Stabilește cetățenia, domiciliul, limba înțeleasă și dreptul la asistență consulară; consemnează opțiunea persoanei.", "Informează în scris despre posibilitatea transferării și transmite cererea autorității competente, fără a promite soluția.", "Pentru transfer internațional, urmărește data stabilită, predarea/preluarea, zilele rămase și comunicările către Ministerul Justiției/instanțe.", "Înregistrează individual cererea de azil și transmite-o de îndată Inspectoratului General pentru Imigrări, cu protejarea confidențialității.", "Înainte de liberare, efectuează notificările speciale și verifică existența pedepsei complementare privind dreptul străinului de a se afla în România.", "Predă persoana poliției numai pe baza temeiului și circuitului legal aplicabil."],
      checks: ["Informarea a fost făcută într-o limbă înțeleasă.", "Refuzul asistenței consulare este consemnat.", "Cererea de azil nu este confundată cu cererea de transfer."],
      pitfalls: ["Comunicarea datelor consulare împotriva opțiunii persoanei, în afara excepțiilor legale.", "Tratarea pedepsei complementare ca o expulzare automată."],
      codeNote: "Art. 66 alin. (1) lit. c) CP permite interzicerea dreptului străinului de a se afla pe teritoriul României. Conținutul și durata se preiau exact din hotărârea definitivă."
    },
    {
      id: "audit-anual", category: "Primire și verificare", title: "Verificarea anuală a documentarelor", summary: "Controlul integral al dosarelor, termenelor și concordanței cu aplicația.",
      legal: ["OMJ 2188/C/2022: art. 224–232"],
      trigger: "La începutul fiecărui an și ori de câte ori conducerea dispune control tematic.",
      steps: ["Inventariază toate documentarele active și repartizează verificarea astfel încât niciun dosar să nu rămână necontrolat.", "Compară act cu act situația juridică, calculele, termenele, identitatea și mențiunile cu aplicația și registrele.", "Deschide registrul de termene pentru noul an și preia termenele viitoare, păstrând trasabilitatea.", "Verifică actele de identitate expirate, schimbările de nume, permisiunile, dreptul de vot și comunicările speciale.", "Corectează numai erorile proprii de evidență pe baza documentelor; pentru erori ale actelor, solicită emitentului rectificarea.", "Întocmește dovada controlului, lista neconformităților, responsabilul și termenul de remediere."],
      checks: ["Numărul dosarelor inventariate coincide cu evidența activă.", "Fiecare corecție are document-suport și autor identificabil.", "Termenele din anul următor au fost preluate."],
      pitfalls: ["Control prin sondaj prezentat drept control integral.", "Modificarea datelor pentru a face aplicația să coincidă cu un calcul neverificat." ]
    }
  ],
  codeReferences: [
    {code:"Cod penal", articles:"art. 66 alin. (1) lit. c), l), o)", role:"Pedepse complementare relevante la evidență și la punerea în libertate; se aplică exclusiv cum sunt stabilite în hotărârea definitivă."},
    {code:"Cod penal", articles:"art. 99–101", role:"Condițiile liberării condiționate, diferența dintre detențiunea pe viață și închisoare, plus măsurile de supraveghere și obligațiile."},
    {code:"Cod penal", articles:"art. 123–125 și art. 129", role:"Măsuri educative privative, modificarea lor și pluralitatea de infracțiuni în cazul minorilor."},
    {code:"Cod procedură penală", articles:"art. 16", role:"Cazurile care împiedică punerea în mișcare sau exercitarea acțiunii penale; structura operează numai soluția comunicată de organul judiciar."},
    {code:"Cod procedură penală", articles:"art. 230 și art. 239", role:"Mandatul de arestare preventivă și limita duratei arestării în cursul judecății în primă instanță."},
    {code:"Cod procedură penală", articles:"art. 262", role:"Elementele obligatorii ale dovezii de primire și ale procesului-verbal de comunicare."},
    {code:"Cod procedură penală", articles:"art. 346 alin. (3)", role:"Restituirea cauzei la parchet în camera preliminară, cu efecte asupra clasificării și regimului persoanei deținute."},
    {code:"Cod procedură penală", articles:"art. 364 alin. (4)", role:"Cererea scrisă de judecare în lipsă a inculpatului privat de libertate și posibilitatea instanței de a dispune totuși aducerea."},
    {code:"Cod procedură penală", articles:"art. 514–515", role:"Punerea în executare a internării într-un centru educativ sau de detenție."},
    {code:"Cod procedură penală", articles:"art. 556 și art. 587", role:"Punerea în executare a mandatului de executare a pedepsei și procedura liberării condiționate."}
  ]
};

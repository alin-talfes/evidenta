(function () {
  "use strict";

  const data = window.INSTRUCTAJ_DATA;
  if (!data || !Array.isArray(data.workflows)) {
    throw new Error("INSTRUCTAJ_DATA trebuie încărcat înainte de completările OMJ nr. 2.188/C/2022.");
  }

  const range = (start, end = start) =>
    Array.from({ length: end - start + 1 }, (_, index) => start + index);

  function patchWorkflow(id, patch) {
    const workflow = data.workflows.find(item => item.id === id);
    if (!workflow) throw new Error(`Lipsește fișa ${id}`);
    Object.assign(workflow, patch);
  }

  function addWorkflow(workflow) {
    if (!data.workflows.some(item => item.id === workflow.id)) {
      data.workflows.push(workflow);
    }
  }

  const omj = data.sources.find(item => item.id === "omj");
  if (omj) {
    omj.verifiedAt = "04.09.2026";
    omj.status = "formă oficială verificată pentru acoperire integrală art. 1–230";
  }

  patchWorkflow("control-zilnic", { omjArticles: range(3, 9) });
  patchWorkflow("primire-condamnat", { omjArticles: range(10, 16) });
  patchWorkflow("prelucrare-dosar", { omjArticles: range(17, 21) });

  patchWorkflow("calcul-pedeapsa", {
    omjArticles: range(22, 24),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 20 și 22–24",
      "Legea nr. 254/2013: art. 95–96",
      "CP: art. 99–100"
    ],
    legalRules: [
      "OMJ art. 22–24 reglementează calculul duratei pedepsei, perioadele ce se deduc și modul de consemnare/verificare a calculului.",
      "Legea nr. 254/2013, art. 96 stabilește zilele considerate executate pentru muncă și instruire.",
      "CP art. 99–100 stabilește condițiile și fracțiile liberării condiționate; împlinirea fracției nu produce automat liberarea."
    ]
  });

  patchWorkflow("liberare-conditionata", {
    omjArticles: range(25, 34),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 25–34",
      "Legea nr. 254/2013: art. 95–97",
      "HG nr. 157/2016: art. 204–207",
      "CP: art. 99–101",
      "CPP: art. 587"
    ],
    legalRules: [
      "OMJ art. 25: la împlinirea fracției sunt analizate persoanele care execută una sau mai multe pedepse privative de libertate, inclusiv cele cercetate în alte cauze; înainte de fracție analiza are loc numai când instanța solicită expres acest lucru după informarea privind neîndeplinirea condițiilor.",
      "OMJ art. 26–34 reglementează pregătirea, verificarea, documentele, lucrările comisiei, sesizarea instanței și evidența termenelor de reexaminare.",
      "CPP art. 587: liberarea este hotărâtă de instanță; propunerea comisiei nu pune persoana în libertate."
    ]
  });

  patchWorkflow("schimbare-juridica", { omjArticles: range(35, 44) });
  patchWorkflow("stabilire-regim", { omjArticles: range(45, 55) });
  patchWorkflow("schimbare-regim", { omjArticles: range(56, 67) });

  patchWorkflow("transfer-anp", {
    omjArticles: range(68, 77),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 68–77",
      "Legea nr. 254/2013: art. 45",
      "HG nr. 157/2016: art. 108"
    ],
    title: "Transferul între locuri ANP — propuneri și cereri",
    summary: "Propunerea comisiei, cererea persoanei, avizarea, dispoziția de transfer și punerea ei în executare."
  });

  patchWorkflow("transfer-crap", { omjArticles: range(83, 88) });

  patchWorkflow("punere-libertate", {
    omjArticles: range(89, 95),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 89–95",
      "Legea nr. 254/2013: art. 53",
      "HG nr. 157/2016: art. 116",
      "CP: art. 66 alin. (1) lit. c), l) și o), dacă pedeapsa apare în hotărâre"
    ]
  });

  patchWorkflow("intrerupere", {
    omjArticles: range(96, 105),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 96–105",
      "CPP: art. 592–594"
    ]
  });

  patchWorkflow("reprimire-intrerupere", { omjArticles: range(106, 111) });
  patchWorkflow("evadare", { omjArticles: range(112, 116) });
  patchWorkflow("primire-arest-preventiv", { omjArticles: range(119, 132) });

  patchWorkflow("termene-arest", {
    omjArticles: range(133, 134),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 133–134",
      "Legea nr. 254/2013: art. 121",
      "CPP: art. 239 alin. (1)"
    ],
    title: "Urmărirea termenelor arestării preventive",
    summary: "Controlul zilnic al verificărilor periodice și al duratei maxime a arestării preventive în cursul judecății.",
    legalRules: [
      "OMJ art. 133 impune operarea termenelor în aplicație și registru, verificarea zilnică și solicitarea de lămuriri instanței când actele necesare nu au fost comunicate.",
      "Fără comunicarea încetării de drept ori a unei soluții definitive de revocare sau înlocuire, administrația locului de deținere nu pune persoana în libertate doar pe baza unui calcul intern.",
      "OMJ art. 134 stabilește reperul de la care se calculează termenul maxim de 5 ani prevăzut de art. 239 alin. (1) CPP."
    ]
  });

  patchWorkflow("primire-minor", {
    omjArticles: range(142, 154),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 142–154",
      "Legea nr. 254/2013: art. 135–136 și 156",
      "CPP: art. 514–515",
      "CP: art. 124–125 și 129"
    ],
    legalRules: [
      "OMJ art. 142–153 reglementează primirea, verificarea actelor, evidența și calculul inițial pentru măsurile educative privative de libertate.",
      "OMJ art. 154 prevede aplicarea corespunzătoare a art. 22–24 la calculul duratei internării.",
      "Măsura educativă nu se tratează ca pedeapsă cu închisoarea, iar pluralitatea este soluționată de instanță."
    ]
  });

  patchWorkflow("comisie-minor", { omjArticles: range(155, 167) });

  patchWorkflow("schimbari-minor", {
    omjArticles: range(168, 177),
    legal: [
      "OMJ nr. 2.188/C/2022: art. 168–177",
      "Legea nr. 254/2013: art. 147–153",
      "CP: art. 124–126 și 129",
      "CPP: art. 346 alin. (3) și 516–519, după situație"
    ],
    title: "Schimbări în situația juridică a persoanelor internate",
    summary: "Hotărâri și mandate noi, pluralitate, arestare în altă cauză și celelalte modificări juridice ale măsurii educative.",
    steps: [
      "Verifică autenticitatea, caracterul executoriu și persoana/cauza la care se referă noul act judiciar.",
      "Consemnează cronologic actul în documentarul penal înainte de modificarea evidențelor informatice.",
      "Stabilește efectul asupra măsurii active, duratei, fracției, locului de executare și eventualelor alte sancțiuni, fără contopire administrativă.",
      "Dacă există pluralitate ori un efect care nu rezultă clar din dispozitiv, sesizează sau solicită lămuriri instanței competente.",
      "Actualizează aplicația, registrul de termene și documentele operative, apoi comunică modificarea structurilor interesate.",
      "Supune operațiunile și recalculările verificării șefului structurii evidență."
    ],
    checks: [
      "Actul nou privește persoana și cauza corecte.",
      "Efectul juridic rezultă din dispozitiv, nu din presupuneri.",
      "Toate termenele afectate au fost recalculate și verificate."
    ],
    pitfalls: [
      "Aplicarea directă a regulilor pluralității fără hotărârea instanței.",
      "Confundarea suspendării unei modalități de executare cu încetarea măsurii educative."
    ],
    legalRules: [
      "OMJ art. 168–177 reglementează operarea schimbărilor de situație juridică pentru persoanele internate și corelarea lor cu actele instanței.",
      "Orice modificare se operează numai după verificarea actului și se păstrează cronologia situației juridice."
    ],
    responsible: "Lucrătorul de evidență verifică și operează actul; șeful structurii controlează operațiunile, iar instanța soluționează pluralitatea și neclaritățile juridice.",
    documents: [
      "noua hotărâre, încheiere sau mandat",
      "documentarul penal și istoricul măsurilor",
      "actele privind perioadele executate și termenele"
    ],
    deadline: "Fără întârziere după primirea și verificarea actului, cu respectarea termenelor speciale aplicabile.",
    result: "Situația juridică și toate termenele reflectă exact actele executorii în vigoare, cu istoric complet.",
    stop: "Nu modifica sancțiunea ori calculul când dispozitivul, caracterul executoriu sau raportul dintre sancțiuni nu sunt clare.",
    practice: "Separă întotdeauna cauza internării de orice cauză nouă și păstrează actele în ordine cronologică."
  });

  patchWorkflow("dosar-consultare", { omjArticles: range(190, 197) });
  patchWorkflow("acte-procedura", { omjArticles: range(198, 209) });
  patchWorkflow("straini", { omjArticles: range(210, 223) });
  patchWorkflow("audit-anual", { omjArticles: range(229, 230) });

  const supplemental = [
    {
      id: "domeniu-omj",
      category: "Primire și verificare",
      title: "Domeniul și scopul evidenței",
      summary: "Ce urmărește evidența nominală și statistică și ce categorii de persoane intră sub incidența Instrucțiunilor.",
      legal: ["OMJ nr. 2.188/C/2022: art. 1–2"],
      omjArticles: range(1, 2),
      trigger: "La instruirea inițială și înainte de încadrarea oricărei operațiuni într-un flux de evidență.",
      steps: [
        "Pornește de la scopul evidenței: legalitatea deținerii și actualizarea datelor care justifică privarea de libertate.",
        "Identifică regimul sau măsura care se execută și urmărește modificările produse pe durata deținerii.",
        "Încadrează persoana în categoria corectă: condamnată la închisoare/detențiune pe viață, arestată preventiv în cursul judecății ori internată în baza unei măsuri educative privative.",
        "Folosește evidența statistică pentru structura și dinamica populației custodiate, distinct de evidența nominală.",
        "Comunică date numai destinatarilor îndreptățiți și în condițiile legii; datele de evidență nu devin informații publice prin simpla lor existență."
      ],
      checks: [
        "Categoria juridică este stabilită dintr-un act oficial.",
        "Există un titlu legal identificabil pentru privarea de libertate.",
        "Fluxul ales corespunde categoriei și stadiului procesual."
      ],
      pitfalls: [
        "Aplicarea procedurii pentru condamnați unei persoane aflate numai în arest preventiv.",
        "Confundarea evidenței statistice cu temeiul individual al deținerii."
      ],
      responsible: "Personalul structurii evidență deținuți aplică Instrucțiunile în limita atribuțiilor, sub coordonarea și controlul șefului structurii.",
      documents: ["Instrucțiunile OMJ nr. 2.188/C/2022", "actul legal de deținere", "documentarul penal și aplicația informatică"],
      deadline: "Înaintea oricărei operări care depinde de categoria juridică a persoanei.",
      result: "Operațiunea este încadrată în fluxul corect, pe baza unui titlu legal verificat.",
      legalRules: [
        "Art. 1 definește activitatea de evidență și scopurile ei: legalitatea deținerii, executarea regimului/măsurii, structura și dinamica populației custodiate și comunicarea datelor către destinatarii îndreptățiți.",
        "Art. 2 stabilește categoriile de persoane private de libertate vizate de Instrucțiuni."
      ],
      stop: "Dacă titlul legal sau categoria juridică nu pot fi stabilite sigur, nu continua cu un flux ales prin presupunere.",
      practice: "Folosește art. 1–2 ca filtru de încadrare; temeiul concret al fiecărei operațiuni se caută apoi în capitolul aplicabil."
    },
    {
      id: "transfer-temporar-judiciar",
      category: "Regim și transfer",
      title: "Transfer temporar pentru activitatea unui organ judiciar",
      summary: "Solicitarea organului judiciar, verificarea situației, pregătirea transferului și primirea la destinație.",
      legal: ["OMJ nr. 2.188/C/2022: art. 78–82", "Legea nr. 254/2013: art. 45"],
      omjArticles: range(78, 82),
      trigger: "Când un organ judiciar solicită transferarea temporară a unei persoane private de libertate.",
      steps: [
        "Verifică autenticitatea și conformitatea solicitării și identifică locul în care se află persoana.",
        "Stabilește situația juridică și cauzele penale/civile aflate pe rol; la solicitări simultane se aplică ordinea de prioritate prevăzută de lege.",
        "Înainte de plecare, operează detaliile transferului în aplicație, tipărește tabelele și întocmește adresa privind motivul transferului și componentele dosarului individual.",
        "Transmite tabelul către sectoarele care gestionează componente ale dosarului cu 2 zile înainte; acestea predau componentele împachetate cu cel puțin o zi înainte.",
        "Informează telefonic destinația dacă sunt mai puțin de 30 de zile până la liberarea la termen ori există termen de judecată a doua zi/prima zi lucrătoare.",
        "La destinație, preia persoana în evidență, verifică actele legale de deținere, calculul, termenele judiciare și concordanța cu aplicația și registrele.",
        "Dosarul individual însoțește persoana; dacă pe traseu se comunică o hotărâre de liberare, se efectuează mai întâi lucrările de primire prin transfer și apoi cele de punere în libertate."
      ],
      checks: [
        "Solicitarea este autentică și competența organului judiciar este identificată.",
        "Dosarul individual și toate componentele lui sunt inventariate și însoțesc persoana.",
        "Termenele apropiate de liberare și de judecată au fost comunicate destinației."
      ],
      pitfalls: [
        "Plecarea fără operarea transferului și fără componentele dosarului.",
        "Ignorarea unei hotărâri de liberare primite în timpul transferului."
      ],
      responsible: "Directorul dispune transferul la solicitarea organului judiciar; structura evidență pregătește, operează, predă și verifică documentele la destinație.",
      documents: ["solicitarea organului judiciar", "tabelul nominal și adresa de transfer", "dosarul individual și documentele operative"],
      deadline: "Activitățile premergătoare se execută la termenele art. 79: tabelul către sectoare cu 2 zile înainte, componentele dosarului cu cel puțin o zi înainte.",
      result: "Transferul temporar este trasabil, dosarul este complet, iar destinația preia imediat evidența și termenele.",
      legalRules: [
        "Art. 78: transferul necesar activității unui organ judiciar este dispus de directorul locului de deținere la solicitarea organului judiciar; solicitările multiple se soluționează după criteriile legale de prioritate.",
        "Art. 79–82 stabilesc operațiunile de plecare, primire, însoțirea prin dosarul individual și situația unei liberări comunicate în timpul transferului."
      ],
      stop: "Nu executa transferul dacă solicitarea nu poate fi autentificată ori există un impediment neclarificat; informează de îndată ANP și organul judiciar când impedimentul intervine.",
      practice: "Înainte de închiderea mapei de transfer, verifică separat «sub 30 zile până la liberare» și «termen judiciar imediat»."
    },
    {
      id: "deces",
      category: "Situații speciale",
      title: "Decesul unei persoane private de libertate",
      summary: "Informările imediate, comunicările speciale și închiderea evidenței după primirea actului constatator.",
      legal: ["OMJ nr. 2.188/C/2022: art. 117–118"],
      omjArticles: range(117, 118),
      trigger: "La decesul unei persoane private de libertate și, ulterior, la primirea copiei actului constatator al decesului.",
      steps: [
        "Directorul locului de deținere informează de îndată judecătorul de supraveghere, organul judiciar competent, ANP și familia/persoana apropiată/reprezentantul legal.",
        "Pentru cetățean străin sau apatrid, se efectuează și comunicarea către reprezentanța diplomatică/consulară ori autoritatea națională competentă, potrivit situației.",
        "Dacă decesul are legătură cu munca, se informează și inspectoratul teritorial de muncă; familia este informată despre locul de unde poate ridica persoana decedată, documentele și bunurile.",
        "Dacă familia nu poate fi contactată, se aplică informarea autorității administrației publice locale prevăzută de Instrucțiuni.",
        "La primirea copiei actului constatator, lucrătorul de evidență întocmește comunicările către instanța de executare și organele judiciare interesate.",
        "Consemnează decesul în documentarul penal, actualizează registrul de termene și aplicația informatică și arhivează documentele de evidență specifice."
      ],
      checks: [
        "Toți destinatarii obligatorii au fost informați.",
        "Există copia actului constatator înainte de închiderea definitivă a evidenței.",
        "Documentarul, registrul și aplicația au aceeași dată și aceeași mențiune."
      ],
      pitfalls: [
        "Închiderea evidenței doar pe baza unei informații verbale.",
        "Omiterea comunicărilor speciale pentru cetățean străin/apatrid ori pentru deces legat de muncă."
      ],
      responsible: "Directorul efectuează informările prevăzute de art. 117; lucrătorul structurii evidență realizează operațiunile documentare și informatice prevăzute de art. 118.",
      documents: ["actul constatator al decesului", "documentarul penal", "dovezile comunicărilor către autorități și familie"],
      deadline: "Informările art. 117 se fac de îndată; operațiunile art. 118 se fac la primirea copiei actului constatator.",
      result: "Decesul este comunicat complet și evidența este închisă pe baza documentului oficial, cu trasabilitate.",
      legalRules: [
        "Art. 117 enumeră informările imediate și situațiile speciale de notificare.",
        "Art. 118 stabilește comunicările și actualizările documentarului penal, registrului de termene și aplicației după primirea actului constatator."
      ],
      stop: "Nu opera definitiv decesul în lipsa documentului oficial cerut de Instrucțiuni.",
      practice: "Folosește două momente distincte: informarea imediată și, separat, închiderea documentară după actul constatator."
    },
    {
      id: "transfer-arest-preventiv",
      category: "Regim și transfer",
      title: "Transferul temporar al persoanei arestate preventiv",
      summary: "Transferul în cursul judecății și regulile speciale pentru minori și pentru persoanele cu măsuri educative în altă cauză.",
      legal: ["OMJ nr. 2.188/C/2022: art. 135–137"],
      omjArticles: range(135, 137),
      trigger: "Când persoana arestată preventiv în cursul judecății trebuie transferată temporar pentru activitatea unui organ judiciar.",
      steps: [
        "Verifică solicitarea organului judiciar și situația juridică exactă a persoanei arestate preventiv.",
        "Aplică în mod corespunzător regulile de transfer temporar și de predare a documentelor prevăzute de Instrucțiuni.",
        "Pentru minori, verifică repartizarea în secțiile speciale și regulile de separare/cazare aplicabile.",
        "Dacă persoana execută o măsură educativă în altă cauză, păstrează distinct cele două situații juridice și termenele aferente.",
        "Pentru analiza regimului ori a liberării din măsura educativă, folosește videoconferința de la centrul educativ/de detenție în situația prevăzută de art. 137.",
        "La orice schimbare de situație juridică pe durata transferului, actualizează documentarul, aplicația și termenele înainte de următoarea operațiune."
      ],
      checks: [
        "Cauza arestării preventive este distinctă de orice condamnare sau măsură educativă.",
        "Regulile speciale pentru minor sunt respectate.",
        "Locul fizic de deținere și termenele sunt cunoscute în orice moment."
      ],
      pitfalls: [
        "Amestecarea evidenței arestului preventiv cu măsura educativă din altă cauză.",
        "Transferul fără verificarea solicitării și a destinației."
      ],
      responsible: "Structura evidență verifică situația juridică și pregătește documentele; conducerea dispune măsurile de transfer în limitele competenței.",
      documents: ["solicitarea organului judiciar", "mandatul/încheierile privind arestarea", "documentarul penal și actele măsurii educative, dacă există"],
      deadline: "Înaintea transferului și imediat la orice schimbare juridică intervenită pe durata acestuia.",
      result: "Transferul temporar păstrează distinct și actualizat fiecare titlu de deținere și fiecare termen.",
      legalRules: [
        "Art. 135–137 adaptează regulile transferului la persoana arestată preventiv și conțin dispoziții speciale pentru minori și pentru situația cumulată cu o măsură educativă."
      ],
      stop: "Oprește transferul dacă titlul de deținere, cauza, destinația sau solicitarea organului judiciar nu pot fi stabilite cert.",
      practice: "În evidență, afișează separat «arest preventiv — cauza X» și «măsură/condamnare — cauza Y»."
    },
    {
      id: "preluare-politie-arest",
      category: "Situații speciale",
      title: "Preluarea de către poliție a persoanei arestate preventiv",
      summary: "Condițiile în care persoana poate fi predată organelor de poliție și documentele care justifică preluarea.",
      legal: ["OMJ nr. 2.188/C/2022: art. 138"],
      omjArticles: range(138),
      trigger: "La solicitarea organului de poliție de a prelua o persoană arestată preventiv aflată în penitenciar.",
      steps: [
        "Verifică identitatea persoanei și cauza în care este solicitată preluarea.",
        "Verifică solicitarea organului de poliție și existența aprobării instanței cerute de art. 138.",
        "Aplică în mod corespunzător operațiunile și documentele prevăzute de art. 83–88 pentru predarea către centrele/structurile MAI.",
        "Consemnează predarea în documentarul penal și în aplicația informatică, păstrând continuitatea termenelor.",
        "Predă documentele care trebuie să însoțească persoana și păstrează exemplarul/dovada de predare.",
        "La reprimire, verifică actele și orice modificare juridică intervenită cât persoana s-a aflat în custodia poliției."
      ],
      checks: [
        "Solicitarea este însoțită de aprobarea instanței.",
        "Identitatea și cauza sunt certe.",
        "Predarea și documentele însoțitoare sunt consemnate."
      ],
      pitfalls: [
        "Predarea pe baza unei solicitări informale.",
        "Omiterea aprobării instanței sau a actualizării evidenței."
      ],
      responsible: "Structura evidență pregătește și consemnează predarea; administrația locului de deținere execută preluarea numai în condițiile art. 138.",
      documents: ["solicitarea organului de poliție", "aprobarea instanței", "adresa/procesul-verbal și documentele de predare"],
      deadline: "Înaintea predării efective către organul de poliție.",
      result: "Preluarea are temei documentar complet și nu întrerupe controlul asupra situației juridice.",
      legalRules: [
        "Art. 138 condiționează preluarea de aplicarea corespunzătoare a art. 83–88 și de solicitarea însoțită de aprobarea instanței."
      ],
      stop: "Nu preda persoana dacă lipsește aprobarea instanței ori solicitarea nu poate fi verificată.",
      practice: "Tratează preluarea ca pe o operațiune de custodie documentată, nu ca pe o simplă escortare."
    },
    {
      id: "liberare-arest-preventiv",
      category: "Calcul și liberare",
      title: "Punerea în libertate din arest preventiv",
      summary: "Revocarea, înlocuirea, încetarea de drept și verificarea autenticității actelor de liberare.",
      legal: ["OMJ nr. 2.188/C/2022: art. 139–141"],
      omjArticles: range(139, 141),
      trigger: "La comunicarea unei soluții privind revocarea, înlocuirea ori încetarea de drept a arestării preventive.",
      steps: [
        "Identifică tipul soluției: revocare, înlocuire sau constatarea încetării de drept.",
        "Pentru revocarea ori înlocuirea dispusă în cursul judecății, verifică dacă soluția poate fi executată, inclusiv efectul căii de atac prevăzut de art. 139.",
        "După comunicarea caracterului definitiv/executoriu, aplică operațiunile de verificare a altor temeiuri de deținere înainte de liberare.",
        "În cazul încetării de drept, tratează dispoziția ca executorie și efectuează punerea în libertate în aceeași zi în care este comunicată, dacă nu există alt titlu legal de deținere.",
        "Pentru orice neclaritate sau impediment, solicită lămuriri în scris instanței competente și informează ierarhic.",
        "Confirmă telefonic autenticitatea și conținutul adreselor de punere în libertate transmise prin mijloace de comunicare la distanță, potrivit art. 141."
      ],
      checks: [
        "Actul este autentic și executoriu la momentul operațiunii.",
        "Au fost verificate toate celelalte mandate/măsuri care ar putea împiedica liberarea.",
        "Data și ora efectivă a liberării sunt consemnate."
      ],
      pitfalls: [
        "Liberarea doar pe baza calculului intern al expirării măsurii.",
        "Executarea unei soluții nedefinitive atunci când calea de atac suspendă executarea."
      ],
      responsible: "Structura evidență verifică actul, celelalte titluri și întocmește lucrările; administrația pune persoana în libertate la momentul legal.",
      documents: ["încheierea/hotărârea privind măsura", "adresa de comunicare a instanței", "documentarul penal și evidența celorlalte titluri"],
      deadline: "Fără întârziere; la încetarea de drept, punerea în libertate se efectuează în aceeași zi a comunicării, dacă nu există alt titlu.",
      result: "Persoana este liberată exact când măsura nu mai justifică deținerea și nu există un alt titlu legal.",
      legalRules: [
        "Art. 139 reglementează efectul căii de atac asupra revocării/înlocuirii și operațiunile după rămânerea definitivă.",
        "Art. 140 tratează încetarea de drept ca executorie și impune punerea în libertate în ziua comunicării, în lipsa altui temei.",
        "Art. 141 impune lămuriri pentru neclarități/impedimente și confirmarea autenticității/conținutului adreselor transmise la distanță."
      ],
      stop: "Nu pune persoana în libertate dacă există un alt titlu legal de deținere sau dacă autenticitatea ori caracterul executoriu al actului nu sunt certe.",
      practice: "Separă pe fișa de control trei câmpuri: «soluție», «moment executoriu», «alte titluri de deținere»."
    },
    {
      id: "regim-masuri-educative",
      category: "Minori",
      title: "Regimul de executare al măsurilor educative",
      summary: "Regimul provizoriu, pregătirea consiliului/comisiei, termenele de lucru, operarea soluțiilor și căile de atac.",
      legal: ["OMJ nr. 2.188/C/2022: art. 178–186", "Legea nr. 254/2013: dispozițiile aplicabile măsurilor educative"],
      omjArticles: range(178, 186),
      trigger: "La stabilirea, individualizarea, schimbarea sau suspendarea modalității de executare a măsurii educative.",
      steps: [
        "Aplică regimul provizoriu și, dacă există un alt titlu de arestare, tratează separat suspendarea potrivit regulilor corespunzătoare.",
        "Primește de la secția de carantină tabelul persoanelor ce urmează a fi analizate cu 10 zile înainte și confruntă datele cu registrul, documentarul și aplicația.",
        "Semnalează neconcordanțele și transmite tabelul nominal semnat secretarului consiliului/comisiei cu cel puțin 2 zile lucrătoare înainte de ședință.",
        "Cu o zi înainte, tipărește partea preconstituită a procesului-verbal și transmite-o electronic structurii educație/asistență psihosocială pentru completare.",
        "Completează datele juridice și istoricul relevant, inclusiv sancțiuni, recompense, activități, zile considerate executate și celelalte elemente prevăzute de Instrucțiuni.",
        "În ziua ședinței predă documentarele penale; șeful structurii verifică datele din procesele-verbale.",
        "După ședință, înregistrează documentele, termenele și soluțiile în documentar/aplicație, înaintează plângerile și urmărește soluțiile judecătorului/instanței.",
        "Pe durata suspendării, persoana continuă să fie analizată la termenele legale; celelalte reguli ale Instrucțiunilor se aplică în măsura compatibilității."
      ],
      checks: [
        "Termenele de 10 zile, 2 zile lucrătoare și o zi înainte sunt respectate.",
        "Procesul-verbal conține date concordante cu documentarul și aplicația.",
        "Plângerile și soluțiile ulterioare sunt operate și comunicate."
      ],
      pitfalls: [
        "Pregătirea comisiei doar din aplicație, fără confruntarea documentarului și registrului.",
        "Omiterea analizei pe durata suspendării modalității de executare."
      ],
      responsible: "Consiliul educativ/comisia decide în limitele legii; structura evidență pregătește datele, documentarele, termenele și operează soluțiile sub controlul șefului structurii.",
      documents: ["tabelul nominal", "procesul-verbal preconstituit", "documentarul penal și rapoartele/istoricul prevăzut de Instrucțiuni"],
      deadline: "Art. 180 stabilește repere operaționale de 10 zile, 2 zile lucrătoare și o zi înainte de ședință; după ședință, operarea se face fără întârziere.",
      result: "Consiliul/comisia lucrează pe date juridice verificate, iar soluția și căile de atac sunt urmărite integral.",
      legalRules: [
        "Art. 178–179 reglementează regimul provizoriu și competența consiliului/comisiei.",
        "Art. 180–182 stabilesc pregătirea ședinței, documentele, termenele, operarea soluțiilor și controlul șefului structurii.",
        "Art. 183–186 reglementează situația suspendării, păstrarea documentelor și aplicarea corespunzătoare a celorlalte reguli."
      ],
      stop: "Nu transmite spre analiză date neconcordante sau neverificate; remediază ori documentează neconcordanța înaintea ședinței.",
      practice: "Folosește un calendar invers față de data ședinței: -10 zile, -2 zile lucrătoare, -1 zi."
    },
    {
      id: "masura-educativa-penitenciar",
      category: "Minori",
      title: "Măsura educativă executată sau continuată în penitenciar",
      summary: "Primirea, regulile aplicabile și particularitatea că persoana nu este analizată pentru schimbarea/individualizarea regimului de executare al pedepsei.",
      legal: ["OMJ nr. 2.188/C/2022: art. 187–189", "CPP: art. 518, după caz"],
      omjArticles: range(187, 189),
      trigger: "Când instanța dispune executarea ori continuarea unei măsuri educative privative de libertate într-un penitenciar.",
      steps: [
        "Verifică hotărârea instanței și momentul de la care măsura se execută sau continuă în penitenciar.",
        "Primește persoana potrivit profilării stabilite de Administrația Națională a Penitenciarelor.",
        "Aplică în mod corespunzător regulile privind persoanele internate, numai în măsura în care nu contravin normelor specifice executării în penitenciar.",
        "Aplică dispozițiile regulamentare speciale privind continuarea măsurii în penitenciar.",
        "Nu introduce persoana în procedura de schimbare sau individualizare a regimului de executare a pedepsei, deoarece art. 189 exclude această analiză pentru măsura educativă continuată în penitenciar.",
        "Păstrează distinct în documentar și aplicație natura sancțiunii: măsură educativă, nu pedeapsă cu închisoarea."
      ],
      checks: [
        "Există hotărârea care dispune executarea/continuarea în penitenciar.",
        "Profilarea și locul de executare sunt corecte.",
        "Persoana nu a fost introdusă eronat în comisia de schimbare a regimului de executare a pedepsei."
      ],
      pitfalls: [
        "Transformarea administrativă a măsurii educative într-o pedeapsă.",
        "Analizarea pentru regim de executare ca și cum persoana ar executa închisoare."
      ],
      responsible: "Structura evidență operează hotărârea și păstrează natura juridică a măsurii; administrația penitenciarului aplică regulile speciale de executare.",
      documents: ["hotărârea instanței", "documentarul penal", "actele privind măsura educativă și profilarea"],
      deadline: "La primire și la orice schimbare ulterioară a măsurii sau a hotărârii care o guvernează.",
      result: "Măsura educativă este executată în penitenciar fără a fi confundată cu o pedeapsă și fără proceduri de regim neaplicabile.",
      legalRules: [
        "Art. 187 stabilește primirea conform profilării ANP.",
        "Art. 188 face aplicabile corespunzător regulile persoanelor internate, în limitele compatibilității.",
        "Art. 189 exclude analiza pentru schimbarea/individualizarea regimului de executare al pedepsei."
      ],
      stop: "Dacă hotărârea nu arată clar continuarea/executarea în penitenciar, solicită lămuriri înainte de schimbarea încadrării în evidență.",
      practice: "Marchează vizibil în fișă «măsură educativă continuată în penitenciar» pentru a preveni aplicarea automată a regulilor condamnaților adulți."
    },
    {
      id: "statistica-omj",
      category: "Documente și comunicări",
      title: "Evidența statistică și raportările",
      summary: "Periodicitatea principalelor statistici centralizate de structura de specialitate din Administrația Națională a Penitenciarelor.",
      legal: ["OMJ nr. 2.188/C/2022: art. 224"],
      omjArticles: range(224),
      trigger: "La termenele periodice de raportare și ori de câte ori este solicitată o statistică prevăzută de Instrucțiuni.",
      steps: [
        "Validează datele-sursă înainte de agregare și păstrează distinct evidența nominală de raportarea statistică.",
        "Întocmește statisticile privind dinamica și structura populației penitenciare cu periodicitatea lunară.",
        "Întocmește statisticile privind liberarea condiționată cu periodicitatea semestrială.",
        "Întocmește situațiile privind capacitatea de cazare și efectivele cu periodicitatea săptămânală.",
        "Pregătește statisticile penale solicitate în relația cu Consiliul Europei cu periodicitatea anuală.",
        "Furnizează informațiile statistice către Institutul Național de Statistică cu periodicitatea semestrială și întocmește celelalte statistici solicitate potrivit competenței."
      ],
      checks: [
        "Perioada de raportare este corectă.",
        "Totalurile agregate corespund datelor-sursă validate.",
        "Raportarea nu conține date nominale care nu sunt necesare scopului statistic."
      ],
      pitfalls: [
        "Confundarea raportării semestriale cu cea lunară sau săptămânală.",
        "Transmiterea unei statistici neverificate doar pentru a respecta termenul."
      ],
      responsible: "Structura de specialitate din ANP centralizează statisticile; unitățile furnizează date exacte și verificabile potrivit circuitului stabilit.",
      documents: ["raportările statistice periodice", "datele validate din aplicația informatică", "solicitările instituționale, când există"],
      deadline: "Lunar, semestrial, săptămânal sau anual, în funcție de categoria statistică prevăzută la art. 224.",
      result: "Raportarea statistică este completă, coerentă și transmisă la periodicitatea corectă.",
      legalRules: [
        "Art. 224 stabilește principalele categorii de statistici și periodicitatea lor: lunar, semestrial, săptămânal și anual, precum și celelalte raportări solicitate."
      ],
      stop: "Nu transmite valori care nu pot fi reconciliate cu datele-sursă; clarifică diferențele înainte de raportare.",
      practice: "Păstrează pentru fiecare raport un reper «perioadă — sursă — dată extragere — responsabil verificare»."
    },
    {
      id: "identitate-nume-permisie-vot",
      category: "Documente și comunicări",
      title: "Acte de identitate, schimbarea numelui, permisiunea de ieșire și votul",
      summary: "Operațiunile speciale de evidență prevăzute de art. 225–228.",
      legal: ["OMJ nr. 2.188/C/2022: art. 225–228"],
      omjArticles: range(225, 228),
      trigger: "La constatarea unui act de identitate expirat/lipsă, schimbarea numelui, primirea documentelor unei permisiuni de ieșire ori organizarea exercitării dreptului de vot.",
      steps: [
        "Dacă actul de identitate este expirat sau situația este consemnată într-un proces-verbal de identificare, informează de îndată persoana desemnată pentru demersurile de obținere a unui act de identitate.",
        "Persoana desemnată pentru relația cu serviciul public comunitar local de evidență a persoanelor este stabilită de director din cadrul secretariatului și este consemnată prin decizia zilnică a unității.",
        "La schimbarea numelui, comunică modificarea structurilor/autorităților prevăzute de art. 226, actualizează documentele nominale și aplicația, dar păstrează separat numele anterior pentru trasabilitate.",
        "Informează toate sectoarele unității despre schimbarea numelui prin nota prevăzută de Instrucțiuni.",
        "Primește de la structura de regim angajamentul și legitimația aferente permisiunii de ieșire și introdu-le în documentarul penal.",
        "Pentru exercitarea dreptului de vot, aplică decizia/adresa directorului general ANP emisă cu respectarea legii și a deciziei Biroului Electoral Central aplicabile scrutinului concret."
      ],
      checks: [
        "Numele nou și numele anterior sunt corect corelate.",
        "Documentele permisiunii de ieșire au fost introduse în documentarul penal.",
        "Procedura de vot folosită este cea emisă pentru scrutinul concret."
      ],
      pitfalls: [
        "Ștergerea completă a numelui anterior din evidențe.",
        "Aplicarea la vot a unei proceduri vechi de la un scrutin anterior."
      ],
      responsible: "Structura evidență efectuează comunicările și actualizările din art. 225–228; persoana desemnată și structura regim își îndeplinesc atribuțiile specifice.",
      documents: ["actul/procesul-verbal de identificare", "actul oficial privind schimbarea numelui", "angajamentul și legitimația permisiunii de ieșire", "decizia/adresa ANP și decizia BEC pentru vot"],
      deadline: "Informarea privind actul de identitate se face de îndată; celelalte operațiuni se fac la primirea documentului sau la calendarul scrutinului.",
      result: "Identitatea, numele, documentele permisiunii și procedura de vot sunt gestionate actualizat și trasabil.",
      legalRules: [
        "Art. 225 reglementează demersurile pentru actele de identitate și persoana desemnată.",
        "Art. 226 reglementează comunicările și actualizarea evidențelor la schimbarea numelui, cu păstrarea numelui anterior.",
        "Art. 227 prevede introducerea în documentarul penal a angajamentului și legitimației aferente permisiunii de ieșire.",
        "Art. 228 stabilește că modalitatea de exercitare a dreptului de vot se reglementează prin decizie/adresă a directorului general ANP, conform legii și deciziei BEC."
      ],
      stop: "Nu modifica numele în evidență fără documentul oficial și nu aplica o procedură electorală care nu corespunde scrutinului în curs.",
      practice: "La schimbarea numelui, verifică simultan documentarul, aplicația și toate comunicările externe pentru a evita existența a două identități necorelate."
    }
  ];

  for (const workflow of supplemental) addWorkflow(workflow);

  const omjReference = {
    code: "OMJ nr. 2.188/C/2022",
    articles: "art. 1–230",
    role: "Instrucțiunile privind evidența nominală și statistică a persoanelor private de libertate. Modulul are acoperire didactică verificată fără goluri pentru art. 1–230; textul oficial rămâne sursa de autoritate."
  };
  if (!data.codeReferences.some(item => item.code === omjReference.code)) {
    data.codeReferences.unshift(omjReference);
  }

  const covered = new Set(
    data.workflows.flatMap(workflow =>
      Array.isArray(workflow.omjArticles) ? workflow.omjArticles : []
    )
  );
  const missing = range(1, 230).filter(article => !covered.has(article));

  data.omj2188Coverage = {
    verifiedAt: "04.09.2026",
    source: "https://legislatie.just.ro/Public/DetaliiDocumentAfis/255745",
    firstArticle: 1,
    lastArticle: 230,
    coveredArticles: covered.size,
    missingArticles: missing,
    complete: missing.length === 0
  };

  if (!data.omj2188Coverage.complete) {
    throw new Error(`Acoperire OMJ incompletă. Lipsesc articolele: ${missing.join(", ")}`);
  }
})();

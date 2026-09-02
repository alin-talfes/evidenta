# Evidență — Training ofițer

Aplicație web statică pentru pregătirea concursului de trecere a agenților în corpul ofițerilor, specialitatea evidență.

## Structura pregătirii pentru proba scrisă

Aplicația este organizată după cele trei componente urmărite la examen:

1. **Partea I — grile de conținut juridic și spețe operaționale**: reguli, condiții, excepții, efecte și aplicarea normelor în situații concrete. Întrebările de tip „la ce articol se află X?” sunt excluse din antrenament. Numărul articolului este păstrat doar ca reper de verificare a sursei.
2. **Partea II — sinteză / reproducere fidelă din lege**: textele juridice integrate pot fi redactate din memorie și comparate lexical cu textul de control. Evaluarea urmărește cuvintele și ordinea lor, fără a transforma numărul articolului într-o cerință de memorare.
3. **Partea III — spețe de calcul**: spețe oficiale ANP și spețe generate din reguli validate, cu verificare separată a operațiunilor intermediare și a rezultatului final.

## Funcționalități

- bibliografia delimitată pe acte normative și articole;
- 137 de articole din actele parțiale, integrate din formele consolidate oficiale;
- OMJ nr. 2188/C/2022 integrat separat pentru Partea II: 217 articole existente efectiv în corpul normativ al formei consolidate, împărțite în aproximativ 307 fragmente de memorare;
- anexele/formularele OMJ 2188 sunt păstrate în afara evaluatorului literal, pentru a nu transforma machetele documentare în exerciții artificiale de memorare;
- linkuri directe către formele consolidate de pe Portalul Legislativ;
- fișe de studiu și căutare după act, temă sau formulare;
- grile exclusiv de conținut, cu explicație și trimitere la temeiul legal;
- motor de calitate pentru Partea I care exclude generatorul repetitiv și grilele de bibliografie/articol și clasifică întrebările în condiții/limite, aplicare, excepții/diferențiere și fundamente;
- mixul de antrenament urmărește o pondere mai mare pentru condiții, aplicare și excepții decât pentru simple noțiuni de bază;
- strat de siguranță care elimină automat întrebările în care diferența dintre variante ar ajunge să fie un număr de articol, alineat sau anexă;
- **20 de spețe operaționale verificate** pentru primire, situație juridică, transfer, punere în libertate, comunicarea actelor de procedură, măsuri preventive, dosar individual și integritate;
- sesiuni dedicate de spețe operaționale, filtrabile pe domeniu;
- mod „Spețe adaptive” care prioritizează situațiile greșite, scadente, neparcurse sau cu acuratețe redusă și limitează concentrarea într-un singur domeniu;
- progres separat pentru spețe: număr lucrat, acuratețe și domeniul recomandat pentru reluare;
- sesiuni adaptive generale care prioritizează greșelile, întrebările scadente, întrebările neparcurse și acuratețea scăzută;
- repetare spațiată la 1, 3, 7, 14, 30 și 60 de zile, cu revenire rapidă după greșeli;
- modul dedicat de sinteză cu filtre după act, lungime și nivel de stăpânire;
- sesiune progresivă pentru Partea II: citește → ascunde → reproduce → verifică → repetă la termen;
- evaluator de fidelitate lexicală și afișarea textului legal de control;
- corpusul OMJ 2188 este încărcat comprimat, verificat ca structură și disponibil offline prin PWA;
- modul dedicat pentru spețe oficiale de calcul, cu schemă de lucru, barem și autoevaluare;
- generator separat de spețe pentru Partea III, cu niveluri Bază / Intermediar / Avansat;
- verificare automată, etapă cu etapă, pentru totalul zilelor, expirare, deduceri, întrerupere, fracție, minim efectiv, zile considerate executate, regim inițial și termenul de 1/5;
- cazuri de frontieră generate pentru pragurile de 10 ani la liberarea condiționată și 1 / 3 / 13 ani la regimurile de executare;
- modul separat pentru condamnați care au deja cel puțin 60 de ani la începutul executării: fracție specială, zile considerate executate și minim efectiv de 1/3 sau 1/2, după durata pedepsei;
- situațiile în care vârsta de 60 de ani este împlinită în cursul executării și spețele generate cu evadare rămân în afara generatorului până la calibrarea exactă a tuturor zilelor-limită; speța oficială Arad cu evadare rămâne disponibilă pentru antrenament;
- evidența locală a progresului pentru grile, sinteză și calcule;
- simulare rapidă separată pentru Partea I, cu 20 de grile și cronometru de 30 de minute;
- simulare completă a probei scrise: 20 de grile + o sinteză + o speță de calcul generată din reguli validate, fără barem afișat înainte de predare;
- în simularea completă, Partea I include garantat minimum **8 spețe operaționale din 20** în modul adaptiv și minimum **6 din 20** în modul aleatoriu;
- selecția spețelor din simularea completă păstrează diversitatea pe domenii, iar restul Părții I este completat cu grile de condiții, aplicare, excepții și fundamente;
- simularea completă poate fi **adaptivă** sau **aleatorie**;
- selecția adaptivă a grilelor folosește un scor de prioritate bazat pe greșeli, scadență, acuratețe, lipsa exercițiului și timpul trecut de la ultima încercare, cu limitare pe act normativ pentru diversitate;
- pool-ul adaptiv de sinteză include și corpusul OMJ 2188/C/2022 și prioritizează textele slabe, scadente sau încă neexersate;
- Partea III din simularea adaptivă poate selecta pedeapsă + fracții, regim + 1/5 sau cazul special 60+, în funcție de istoricul pe tip de calcul;
- la variantele cu zile considerate executate sunt generate inclusiv situații în care creditul ar coborî sub minimul efectiv, pentru a testa aplicarea plafonului;
- rezultatele simulării complete sunt integrate după predare în istoricul granular de învățare: `questionStats`, repetarea spațiată a sintezei și statistici pe tip și operație de calcul;
- raport final adaptiv cu actele unde au apărut greșeli, tema de sinteză de repetat și operațiile de calcul ratate;
- raportul indică o prioritate principală de studiu și oferă acces direct către Grile, Sinteză și Calcule;
- cronometru opțional de antrenament pentru simularea completă (fără cronometru / 90 / 120 minute), fără prezentarea acestor durate ca durate oficiale ale concursului;
- raport final separat pe cele trei părți și medie simplă marcată explicit ca indicator neoficial de antrenament;
- reluarea simulării complete după refresh și păstrarea locală a ultimelor 20 de rezultate;
- istoric vizual pentru ultimele 5 simulări complete, cu scorurile pe fiecare parte, media istorică, scorul maxim, modul adaptiv/aleatoriu și prioritatea principală de repetare;
- secțiune distinctă cu subiecte și bareme oficiale ANP;
- evidențierea baremelor definitive și a modificărilor rezultate din contestații;
- modul de interviu cu 22 de spețe legal-operaționale, de integritate, comunicare, conducere, lucru în echipă și criză;
- răspunsuri cronometrate, complicații de presiune, repere de evaluare și autoevaluare;
- 22 de răspunsuri ideale în structura D–V–C–A și 66 de întrebări dificile de aprofundare, fiecare cu răspuns-model;
- evaluare structurată pe 20 de puncte și profil dinamic pe competențe;
- simulare completă de comisie cu trei spețe și cronometru de 15 minute;
- interfață responsive, mod luminos/întunecat și navigare mobile-first;
- instalare pe telefon și utilizare offline (PWA).

Datele de progres sunt păstrate exclusiv în `localStorage`, pe dispozitivul utilizatorului.

## Partea I — reguli de calitate

Pool-ul utilizat în sesiuni este reconstruit la rulare și elimină întrebările retrase, vechile grile automate repetitive și orice întrebare care testează direct numărul articolului. Statisticile asociate întrebărilor retrase sunt eliminate din progres, astfel încât scorurile istorice să nu fie umflate de conținut care nu mai face parte din pregătire.

Spețele operaționale au ID-uri și statistici proprii și intră în același mecanism `recordQuestionResult()` ca restul grilelor. Prin urmare, greșelile din spețe influențează repetarea și selecția adaptivă ulterioară.

## Partea III — reguli de calibrare

Motorul generat folosește numai reguli care pot fi controlate în sursele juridice și în baremele ANP integrate. Sunt separate explicit:

- durata calendaristică a pedepsei și expirarea;
- perioadele deduse anterior punerii în executare;
- perioadele în care executarea este întreruptă;
- fracția totală pentru liberarea condiționată și minimul care trebuie executat efectiv;
- zilele considerate executate, fără coborârea sub minimul efectiv;
- fracția specială aplicabilă persoanelor care au împlinit vârsta de 60 de ani, în cazurile generate fără ambiguitate temporală;
- regimul inițial în cazurile în care nu există factori excepționali;
- analiza după executarea unei cincimi din pedeapsa cu închisoarea.

Spețele generate nu cer memorarea numerelor articolelor. Acestea rămân doar repere pentru verificarea sursei.

## Simularea completă

Modul „Simulări” oferă două trasee independente:

- **simulare rapidă Partea I** — 20 de grile, 30 de minute;
- **simulare completă** — 20 de grile, o sinteză juridică și o speță de calcul.

Simularea completă poate porni în două moduri:

- **Adaptiv** — recomandat pentru consolidare: Partea I conține minimum 8 spețe operaționale și completează setul până la 20 cu grile prioritizate după istoricul de greșeli/scadențe; sinteza favorizează textele sub 95%, scadente sau noi, inclusiv OMJ 2188/C/2022; speța favorizează tipul de calcul cu performanța istorică mai mică sau încă insuficient exersat;
- **Aleatoriu** — mix general, dar păstrează minimum 6 spețe operaționale în Partea I pentru ca testul să nu devină predominant unul de recunoaștere textuală.

După predare, cele 20 de grile sunt trecute prin același mecanism `recordQuestionResult()` utilizat de testele obișnuite. Rezultatul de sinteză actualizează scorul și termenul de repetare, iar fiecare operație din speța de calcul actualizează statisticile pe tip și câmp. Astfel, următoarea simulare adaptivă se bazează pe date mai precise decât o simplă medie finală.

Raportul final generează priorități concrete: actele normative în care au fost ratate grile, tema exactă de sinteză care trebuie reluată și etapele de calcul greșite. Prioritatea cu scorul cel mai mic este evidențiată separat, iar raportul oferă acces direct către modulul relevant.

În simularea completă, răspunsurile pot fi revizuite înainte de predare, iar textul de control și baremul speței sunt ascunse până la final. Scorul de sinteză este o măsură lexicală orientativă, scorul de calcul reprezintă proporția etapelor rezolvate corect, iar media finală este o medie simplă folosită exclusiv pentru urmărirea progresului. Niciuna dintre aceste valori nu este prezentată ca barem sau notă oficială ANP.

## Subiecte oficiale și spețe

Aplicația include spațiu de redactare și autoevaluare pentru 12 subiecte oficiale:

- 5 teme și spețe din baremul Galați 2024;
- 7 teme și spețe din baremul Arad 2025;
- temele nenumerice sunt folosite ca repere pentru sinteză;
- spețele numerice sunt grupate în Partea III — Calcul;
- răspunsurile și rezolvările utilizatorului sunt salvate local.

Spețele numerice reproduc rezultatele baremelor oficiale. Atunci când datele calendaristice complete nu sunt transcrise local, refacerea integrală trebuie verificată în PDF-ul ANP indicat în aplicație.

## Surse juridice

Conținutul este verificat în raport cu formele consolidate disponibile la 31.08.2026 pe Portalul Legislativ și cu documentele oficiale ANP integrate. Textele oficiale au întotdeauna prioritate față de fișele, explicațiile și evaluările automate din aplicație.

## Rulare

Nu sunt necesare dependențe sau compilare. Deschideți `index.html` ori publicați ramura `main` prin GitHub Pages.

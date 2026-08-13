// ========== ARTICOLE LEGALE DIN OMJ 2188/C/2022 ==========

const legalArticles = [
    {
        id: 'art20',
        titlu: 'Art. 20 – Data punerii în aplicare a mandatului de executare',
        text: `(1) Data punerii în aplicare a mandatului de executare sau a primului mandat de executare, în cazul existenţei mai multor condamnări, este data introducerii în arest a persoanei private de libertate de către organul de poliţie, în cazul în care, de la data arestării până la primirea în locul de deţinere, persoana a fost continuu privată de libertate.
(2) Data punerii în aplicare a mandatului de executare, în cazul în care privarea de libertate a fost întreruptă de la data arestării iniţiale până la data primirii în locul de deţinere, este data prevăzută în hotărârea definitivă de condamnare şi în mandatul de executare.
(4) Data punerii în aplicare a mandatului de executare, în situaţia persoanelor private de libertate preluate de la autorităţi străine, este data procesului-verbal de predare-primire a persoanei între autorităţile străine sau Centrul de Cooperare Poliţienească Internaţională şi lucrătorii locurilor de deţinere.`,
        aplicare: 'Stabilește data de început a executării: data arestării dacă privarea de libertate a fost continuă, altfel data din hotărâre/mandat.'
    },
    {
        id: 'art22',
        titlu: 'Art. 22 – Calculul duratei pedepsei',
        text: `(1) Durata executării pedepsei închisorii se calculează din ziua în care condamnatul începe să execute hotărârea definitivă de condamnare.
(2) Ziua în care începe executarea pedepsei și ziua în care încetează se includ în durata executării.
(3) Luna și anul se consideră împlinite cu o zi înainte de ziua corespunzătoare datei de la care au început să curgă.
(4) Durata reținerii, a arestării preventive, a arestului la domiciliu și alte perioade deduse din durata pedepsei, potrivit legii, și partea din pedeapsă executată sau considerată ca executată anterior, aşa cum se menţionează în mandatul de executare a pedepsei privative de libertate şi în hotărârea definitivă de condamnare, precum şi zilele considerate executate suplimentar ca măsură compensatorie pentru executarea măsurii arestării preventive, pedepsei sau măsurii educative în condiţii necorespunzătoare, se scad din durata pedepsei închisorii ori a detenţiunii pe viaţă.
(5) Perioada în care persoana privată de libertate, în cursul executării pedepsei, se află internat în spital se include în durata executării pedepsei, în afară de cazul în care și-a provocat în mod voit boala, iar această împrejurare se constată în cursul executării pedepsei de către instanță.
(6) Durata permisiunilor de ieșire din locul de deţinere, acordate persoanei private de libertate conform prevederilor Legii, se include în durata executării pedepsei.`,
        aplicare: 'Reguli fundamentale: ziua de început și sfârșit se includ; luna/anul se împlinește cu o zi înainte de ziua corespunzătoare datei de start; perioadele deduse se scad; spitalul se include, cu excepția bolii provocate voit.'
    },
    {
        id: 'art23',
        titlu: 'Art. 23 – Calcul după grațiere',
        text: `(1) Când pedeapsa pronunţată în ani este redusă ca urmare a unei graţieri, timpul rămas de executat din durata condamnării se calculează, după caz, în ani şi luni.
(2) În cazul în care o pedeapsă pronunţată în ani sau luni este redusă cu o durată ce nu permite o împărţire exactă în luni, restul de luni și zile calendaristice rămase de executat se transformă în zile.`,
        aplicare: 'După grațiere, restul se recalculează în ani/luni; dacă nu se împarte exact, restul se transformă în zile.'
    },
    {
        id: 'art24',
        titlu: 'Art. 24 – Scăderea perioadelor executate anterior',
        text: `În situaţia în care din durata unei condamnări se scade durata reţinerii, a arestării preventive, a arestului la domiciliu ori alte perioade, potrivit legii, sau partea din pedeapsă executată sau considerată executată suplimentar ca măsură compensatorie pentru executarea măsurii arestării preventive, pedepsei sau măsurii educative în condiţii necorespunzătoare, anterior datei la care a fost pusă în executare hotărârea definitivă de condamnare, sunt îndeplinite următoarele activități:
(1) se calculează numărul de zile executate efectiv;
(2) din totalul pedepsei de executat, transformată în zile, se scade numărul de zile executate;
(3) se calculează restul rămas de executat, transformat, după caz, în ani, luni şi zile, conform art. 22.`,
        aplicare: 'Algoritmul de deducere: (1) total zile executate efectiv; (2) transformarea pedepsei totale în zile și scăderea; (3) transformarea restului înapoi în ani/luni/zile.'
    },
    {
        id: 'art44',
        titlu: 'Art. 44 – Adăugarea timpului pentru boala provocată voit',
        text: `(2) La primirea hotărârii instanţei de executare, rămasă definitivă, sesizată potrivit prevederilor alin. (1), lucrătorul structurii evidenţă deţinuţi efectuează următoarele activităţi:
(1) adaugă timpul stat în infirmerie şi spital la durata condamnării, la fracţiunile prevăzute de lege pentru liberare condiţionată şi la fracţiunea prevăzută la art. 40 alin. (2) din Lege, dacă fracţiunea calculată iniţial nu s-a împlinit până la data hotărârii definitive a instanţei prin care a dispus asupra adăugării.
La calcularea perioadei ce urmează a fi adăugată se ţine seama că ziua în care persoana privată de libertate a fost internată ca urmare a provocării în mod voit a bolii nu se consideră ca zi executată din durata pedepsei, iar ziua externării se consideră zi executată.`,
        aplicare: 'La boala provocată voit, timpul în spital se adaugă; ziua internării nu se consideră executată, ziua externării se consideră executată.'
    },
    {
        id: 'art115',
        titlu: 'Art. 115 – Evadarea',
        text: `(2) Perioada în care persoana s-a aflat în stare de evadare, incluzând ziua evadării, consemnată într-un proces-verbal, nu intră în calculul duratei executării pedepsei privative de libertate şi a fracţiunilor prevăzute de Codul penal pentru liberarea condiţionată.`,
        aplicare: 'Perioada de evadare (inclusiv ziua evadării) nu se socotește în durata pedepsei.'
    },
    {
        id: 'art97',
        titlu: 'Art. 97 – Întreruperea executării',
        text: `(8) Timpul cât executarea a fost întreruptă nu se socotește în executarea pedepsei.`,
        aplicare: 'Perioada de întrerupere nu se socotește în durata pedepsei.'
    },
    {
        id: 'art26',
        titlu: 'Art. 26 – Calculul fracțiunilor',
        text: `(1) Calculul fracţiunilor obligatorii şi totale ce trebuie executate de către persoanele private de libertate se face de către lucrătorul structurii evidență deținuți, potrivit prevederilor Codului penal referitoare la liberarea condiționată, avându-se în vedere și zilele considerate executate suplimentar ca măsură compensatorie pentru executarea măsurii arestării preventive, pedepsei sau măsurii educative în condiții necorespunzătoare.
(2) Fracțiunea obligatorie este partea din durata pedepsei care trebuie executată efectiv și care nu poate fi redusă ca urmare a zilelor considerate ca executate.
(3) Fracțiunea totală este partea din durata pedepsei care trebuie executată în calculul căreia sunt incluse zilele considerate ca executate.`,
        aplicare: 'Fracțiunea obligatorie = partea efectivă, nu se reduce cu zilele câștigate; fracțiunea totală = include zilele considerate executate.'
    },
    {
        id: 'art56',
        titlu: 'Art. 56 – Condiția pentru schimbarea regimului',
        text: `(1) Schimbarea regimului de executare a pedepsei privative de libertate poate avea loc în următoarele situații: (1) sunt executate fracțiunile din pedeapsă prevăzute la art. 40 alin. (2) din Lege avându-se în vedere și zilele considerate executate suplimentar ca măsură compensatorie.`,
        aplicare: 'La împlinirea fracțiunii, persoana poate fi reanalizată pentru schimbarea regimului.'
    },
    {
        id: 'art18',
        titlu: 'Art. 18 – Înregistrarea zilelor câștigate',
        text: `(1) lit. e) calculează, în raport de durata pedepsei privative de libertate stabilită de către instanţa de executare şi de zilele considerate executate suplimentar ca măsură compensatorie pentru executarea măsurii arestării preventive, pedepsei sau măsurii educative în condiţii necorespunzătoare, data la care se împlinesc fracţiunile de executat din pedeapsă în vederea acordării liberării condiţionate, potrivit Codului penal.`,
        aplicare: 'Zilele câștigate prin muncă/educație se iau în calcul la determinarea datei de împlinire a fracțiunilor.'
    },
    {
        id: 'art109',
        titlu: 'Art. 109 – Recalcularea la revenirea din întrerupere',
        text: `(1) lit. e) reface calculul termenului la care încetează executarea pedepsei, respectiv termenul la care se împlinește fracțiunea prevăzută de lege privind liberarea condiționată și, după caz, a fracțiunii prevăzute la art. 40 alin. (2) din Lege, dacă aceasta nu era împlinită la punerea în libertate prin întreruperea executării pedepsei, adăugând timpul stat în libertate.`,
        aplicare: 'La revenirea din întrerupere, timpul stat în libertate se adaugă la termenele de liberare condiționată.'
    },
    {
        id: 'art152',
        titlu: 'Art. 152 – Data începerii pentru măsuri educative',
        text: `(1) Data începerii executării măsurii educative privative de libertate, în cazul privării continue de libertate, este data introducerii în arest a persoanei față de care s-a dispus măsura.
(2) Data punerii în aplicare a măsurii educative privative de libertate, în cazul în care privarea de libertate a fost întreruptă în perioada de la data arestării inițiale la data primirii în centru, este data prevăzută în hotărârea definitivă de internare sau data primirii efective în locul de deținere.`,
        aplicare: 'Aceleași reguli ca pentru pedepse se aplică și măsurilor educative.'
    }
];
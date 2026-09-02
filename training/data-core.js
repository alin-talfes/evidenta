const LEGAL_CHECK_DATE="30.08.2026";
const LEGAL_SOURCE_NOTICE="Link verificat către forma consolidată disponibilă pe Portalul Legislativ";
window.TRAINING_DATA_PARTIAL=true;

const laws=[
{id:"l254",short:"Legea 254/2013",title:"Legea nr. 254/2013 privind executarea pedepselor și a măsurilor privative de libertate",scope:"Titlul III: cap. I, III, articolele indicate din cap. IV și V, cap. VIII; Titlul IV: cap. I art. 115 și cap. II; Titlul V: dispozițiile și articolele indicate în bibliografie.",url:"https://legislatie.just.ro/Public/DetaliiDocument/269415",weight:25},
{id:"cp",short:"Codul penal",title:"Legea nr. 286/2009 privind Codul penal",scope:"Titlul III: art. 53–54, detențiunea pe viață, art. 60, calculul duratei, art. 74, art. 99–100; Titlul V cap. III; art. 186.",url:"https://legislatie.just.ro/Public/DetaliiDocumentAfis/109855",weight:15},
{id:"cpp",short:"Cod procedură penală",title:"Legea nr. 135/2010 privind Codul de procedură penală",scope:"Art. 208, 238–239, încetarea/revocarea/înlocuirea măsurilor preventive, art. 269, 362, 399, executarea hotărârilor penale și art. 598, conform bibliografiei.",url:"https://legislatie.just.ro/Public/DetaliiDocument/265008",weight:15},
{id:"hg157",short:"HG 157/2016",title:"Regulamentul de aplicare a Legii nr. 254/2013",scope:"Art. 50–52, 54, 65, 74, 81, 88–93, 97, 108, 116, 127, 169, cap. VIII, art. 301, 304 și cap. X din titlul V.",url:"https://legislatie.just.ro/Public/DetaliiDocument/269789",weight:18},
{id:"omj2188",short:"OMJ 2188/C/2022",title:"Instrucțiunile privind evidența nominală și statistică a persoanelor private de libertate",scope:"Integral — actul central al pregătirii profesionale pentru evidență.",url:"https://legislatie.just.ro/Public/DetaliiDocumentAfis/255630",weight:20},
{id:"l145",short:"Legea 145/2019",title:"Statutul polițiștilor de penitenciare",scope:"Art. 7–10, 104–105, 119–121, 133 și 140–141. Intervalele sunt inclusive.",url:"https://legislatie.just.ro/Public/DetaliiDocument/222277",weight:5},
{id:"cod",short:"Cod deontologic",title:"OMJ nr. 2794/C/2004 — Codul deontologic",scope:"Anexa nr. 1: art. 2, 6 și 11.",url:"https://legislatie.just.ro/Public/DetaliiDocument/56992",weight:2}
];

const studyCards=[
{law:"l254",ref:"Titlul III",title:"Organizarea executării",text:"Legea-cadru stabilește autoritățile implicate, locurile de deținere și garanțiile aplicabile executării pedepselor privative de libertate."},
{law:"l254",ref:"Art. 43",title:"Primirea persoanelor condamnate",text:"Studiază documentele care însoțesc primirea, verificările obligatorii și măsurile imediate ce trebuie realizate."},
{law:"l254",ref:"Art. 45",title:"Transferarea",text:"Corelează temeiurile și competența transferării cu procedura detaliată din regulament și din instrucțiunile de evidență."},
{law:"l254",ref:"Art. 53",title:"Punerea în libertate",text:"Reține temeiurile, momentul liberării, verificările situației juridice și documentele eliberate persoanei."},
{law:"l254",ref:"Cap. VIII",title:"Liberarea condiționată",text:"Separă procedura penitenciară de condițiile de drept substanțial prevăzute de art. 99 și 100 Cod penal."},
{law:"cp",ref:"Art. 53–54",title:"Categoriile pedepselor",text:"Distinge pedepsele principale de pedeapsa accesorie și pedepsele complementare aplicabile persoanei fizice."},
{law:"cp",ref:"Cap. IV",title:"Calculul duratei pedepselor",text:"Durata se calculează potrivit unităților legale de timp; timpul reținerii, arestării și alte perioade se compută în condițiile legii."},
{law:"cp",ref:"Art. 99–100",title:"Liberarea condiționată",text:"Condițiile diferă între detențiunea pe viață și închisoare. Verifică fracția, regimul, obligațiile civile și convingerea instanței."},
{law:"cp",ref:"Art. 186",title:"Calculul timpului",text:"Reține înțelesul legal al zilei, săptămânii, lunii și anului atunci când termenele au relevanță penală."},
{law:"cpp",ref:"Art. 208",title:"Verificarea măsurilor preventive",text:"Identifică instanța competentă, momentele verificării și consecințele constatării legalității sau nelegalității măsurii."},
{law:"cpp",ref:"Art. 238–239",title:"Arestarea preventivă",text:"Separă condițiile generale de durata maximă în cursul judecății și de verificarea periodică a măsurii."},
{law:"cpp",ref:"Art. 269",title:"Calculul termenelor procedurale",text:"Termenele procedurale au reguli proprii de calcul; nu le confunda cu modul de calcul al duratei pedepsei."},
{law:"cpp",ref:"Art. 555–558",title:"Punerea în executare",text:"Studiază emiterea și trimiterea mandatului, comunicările și autoritățile responsabile de executarea pedepselor principale."},
{law:"cpp",ref:"Art. 598",title:"Contestația la executare",text:"Identifică limitativ cazurile, instanța competentă și diferența față de rejudecarea fondului cauzei."},
{law:"hg157",ref:"Art. 50–52",title:"Regimul provizoriu",text:"Detașează regimul arestatului preventiv în altă cauză de aplicarea provizorie a regimului după condamnare."},
{law:"hg157",ref:"Art. 88–93",title:"Stabilirea și schimbarea regimului",text:"Urmărește fluxul: analiză, propunere/hotărâre, comunicare, plângere și punerea în aplicare a regimului."},
{law:"hg157",ref:"Art. 97, 108, 116",title:"Primire, transfer, liberare",text:"Cele trei momente operaționale majore trebuie corelate cu evidența documentelor și verificarea situației juridice."},
{law:"omj2188",ref:"Integral",title:"Controlul legalității deținerii",text:"Activitatea de evidență urmărește existența și continuitatea unui temei legal valabil pentru fiecare perioadă de privare de libertate."},
{law:"omj2188",ref:"Integral",title:"Dosarul individual",text:"Grupează documentele după funcția lor: primire, situație juridică, regim, transfer, comunicări și punere în libertate."},
{law:"omj2188",ref:"Integral",title:"Exactitatea datelor",text:"Orice neconcordanță între acte trebuie clarificată prin autoritatea emitentă; evidența nu poate corecta arbitrar un titlu judiciar."},
{law:"omj2188",ref:"Integral",title:"Comunicarea actelor",text:"Studiază primirea, înregistrarea, înmânarea, dovada comunicării și restituirea documentelor către organul judiciar."},
{law:"l145",ref:"Art. 7–10",title:"Corpurile și gradele profesionale",text:"Reține structura carierei polițiștilor de penitenciare și raportul dintre corp, categorie și grad profesional."},
{law:"l145",ref:"Art. 119–121",title:"Obligații, interdicții și conflict de interese",text:"Art. 119 reglementează obligațiile, art. 120 interdicțiile, iar art. 121 conflictul de interese. Răspunderea disciplinară este reglementată distinct, începând cu art. 139."},
{law:"cod",ref:"Art. 2",title:"Principii de conduită",text:"Supunerea față de lege, respectarea drepturilor, egalitatea șanselor, responsabilitatea, imparțialitatea, eficacitatea și eficiența."},
{law:"cod",ref:"Art. 6 și 11",title:"Conduită profesională",text:"Leagă exigențele deontologice de exercitarea imparțială a atribuțiilor și de protejarea prestigiului instituției."}
];

let __saved={};try{__saved=JSON.parse(localStorage.getItem("evidenta-training")||"{}")||{}}catch{}
const __savedQuestionIds=[...new Set([...(Array.isArray(__saved.correctIds)?__saved.correctIds:[]),...(Array.isArray(__saved.mistakes)?__saved.mistakes:[]),...Object.keys(__saved.questionStats||{})].map(String))];
const __baseQuestions=[
{id:7,law:"cp",ref:"Cod penal, art. 53",q:"Potrivit clasificării din Codul penal, care este o pedeapsă principală aplicabilă persoanei fizice?",a:["închisoarea","interzicerea exercitării unor drepturi","degradarea militară","publicarea hotărârii"],c:0,e:"Detențiunea pe viață, închisoarea și amenda sunt pedepse principale."},
{id:8,law:"cp",ref:"Cod penal, art. 54",q:"Pedeapsa accesorie constă în:",a:["interzicerea exercitării unor drepturi, în condițiile legii","executarea obligatorie a amenzii","prelungirea automată a închisorii","confiscarea tuturor bunurilor"],c:0,e:"Pedeapsa accesorie constă în interzicerea exercitării unor drepturi, în condițiile legii."},
{id:10,law:"cp",ref:"Cod penal, art. 99–100",q:"Condițiile liberării condiționate sunt reglementate distinct pentru:",a:["detențiunea pe viață și închisoare","amendă și confiscare","minor și persoană juridică","reținere și control judiciar"],c:0,e:"Regulile sunt distincte pentru detențiunea pe viață și pedeapsa închisorii."},
{id:24,law:"omj2188",ref:"OMJ nr. 2188/C/2022",q:"Dacă două acte din situația juridică prezintă date contradictorii, abordarea corectă este:",a:["clarificarea neconcordanței prin canalele și autoritățile competente","alegerea datei mai favorabile fără verificări","modificarea titlului de către compartiment","ignorarea actului mai nou"],c:0,e:"Evidența trebuie să se întemeieze pe acte legale și date verificate; compartimentul nu poate modifica arbitrar un titlu judiciar."},
{id:29,law:"cod",ref:"Cod deontologic, art. 2",q:"Care dintre următoarele este un principiu al conduitei profesionale?",a:["supunerea deplină față de lege","prioritatea interesului personal","secretul absolut față de autorități","libertatea de a ignora ierarhia"],c:0,e:"Supunerea deplină față de lege este un principiu al conduitei profesionale."},
{id:30,law:"cod",ref:"Cod deontologic, art. 2",q:"Conduita profesională este guvernată, între altele, de:",a:["responsabilitate și imparțialitate","favorizarea persoanelor cunoscute","folosirea funcției în interes personal","înlăturarea controlului ierarhic"],c:0,e:"Responsabilitatea și imparțialitatea sunt principii de conduită."}
];
const __baseIds=new Set(__baseQuestions.map(q=>String(q.id)));
const questions=[...__baseQuestions,...__savedQuestionIds.filter(id=>!__baseIds.has(id)).map(id=>({id,law:"__saved__",kind:"stub",ref:"Progres salvat",q:"",a:[],c:0,e:"",stub:true}))];

const __savedRead=Array.isArray(__saved.readArticles)?__saved.readArticles:[];
const legislationActs=[{id:"__saved__",title:"",scope:"",url:"",status:"placeholder",articles:__savedRead.map(id=>({id,number:"",heading:"",intro:"",items:[]}))}];
const __writtenIds=[...new Set([...Object.keys(__saved.writtenResults||{}),...Object.keys(__saved.writtenDrafts||{})])];
const officialWritten=__writtenIds.length?__writtenIds.map(id=>({id})): [{id:"__placeholder__"}];
const officialSets=[];
const __interviewIds=[...new Set([...Object.keys(__saved.interviewDrafts||{}),...Object.keys(__saved.interviewResults||{}),...Object.keys(__saved.interviewScores||{})])];
const interviewScenarios=__interviewIds.map(id=>({id,category:"",difficulty:"mediu",title:"",context:"",pressure:"",competencies:[],legal:[],actions:[],communication:[],redFlags:[],followUps:[]}));

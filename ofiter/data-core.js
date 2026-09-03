const LEGAL_CHECK_DATE="30.08.2026";
const LEGAL_SOURCE_NOTICE="Link verificat către forma consolidată disponibilă pe Portalul Legislativ";
window.TRAINING_DATA_PARTIAL=true;

const laws=[
{id:"l254",short:"Legea 254/2013",title:"Legea nr. 254/2013 privind executarea pedepselor și a măsurilor privative de libertate",scope:"Titlul III: cap. I, III, articolele indicate din cap. IV și V, cap. VIII; Titlul IV: cap. I art. 115 și cap. II; Titlul V: dispozițiile și articolele indicate în bibliografie.",url:"https://legislatie.just.ro/Public/DetaliiDocument/269415",weight:25},
{id:"cp",short:"Codul penal",title:"Legea nr. 286/2009 privind Codul penal",scope:"Titlul III: art. 53–54, detențiunea pe viață, art. 60, calculul duratei, art. 74, art. 99–100; Titlul V cap. III; art. 186.",url:"https://legislatie.just.ro/Public/DetaliiDocumentAfis/109855",weight:15},
{id:"cpp",short:"Cod procedură penală",title:"Legea nr. 135/2010 privind Codul de procedură penală",scope:"Art. 208, 238–239, încetarea/revocarea/înlocuirea măsurilor preventive, art. 269, 362, 399, executarea hotărârilor penale și art. 598, conform bibliografiei.",url:"https://legislatie.just.ro/Public/DetaliiDocument/265008",weight:15},
{id:"hg157",short:"HG 157/2016",title:"Regulamentul de aplicare a Legii nr. 254/2013",scope:"Art. 50–52, 54, 65, 74, 81, 88–93, 97, 108, 116, 127, 169, cap. VIII, art. 301, 304 și cap. X din titlul V.",url:"https://legislatie.just.ro/Public/DetaliiDocument/269789",weight:18},
{id:"omj2188",short:"OMJ 2188/C/2022",title:"Instrucțiunile privind evidența nominală și statistică a persoanelor private de libertate",scope:"Integral — actul central al pregătirii profesionale pentru evidență.",url:"https://legislatie.just.ro/Public/DetaliiDocumentAfis/255745",weight:20},
{id:"l145",short:"Legea 145/2019",title:"Statutul polițiștilor de penitenciare",scope:"Art. 7–10, 104–105, 119–121, 133 și 140–141. Intervalele sunt inclusive.",url:"https://legislatie.just.ro/Public/DetaliiDocument/222277",weight:5},
{id:"cod",short:"Cod deontologic",title:"OMJ nr. 2794/C/2004 — Codul deontologic",scope:"Anexa nr. 1: art. 2, 6 și 11.",url:"https://legislatie.just.ro/Public/DetaliiDocument/56992",weight:2}
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

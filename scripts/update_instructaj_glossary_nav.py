from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, content):
    Path(path).write_text(content, encoding="utf-8")


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"Nu am găsit secvența pentru {label}")
    return text.replace(old, new, 1)


# 1. Glosar juridic extins, orientat spre activitatea de evidență.
p = Path("instructaj/data.js")
s = read(p)
new_glossary = '''  glossary: [
    {term:"Act executoriu", meaning:"Act care, potrivit legii și stadiului procesual, poate fi pus în executare la acel moment. Caracterul executoriu se verifică din act și din norma aplicabilă, nu se presupune."},
    {term:"Amânarea aplicării pedepsei", meaning:"Soluție de individualizare prin care instanța stabilește o pedeapsă, dar amână aplicarea ei în condițiile legii. Nu se confundă cu suspendarea executării unei pedepse deja aplicate."},
    {term:"Apel", meaning:"Cale ordinară de atac prin care hotărârea primei instanțe este verificată de instanța competentă, în cazurile și limitele prevăzute de lege. Existența apelului și termenul lui se verifică pentru hotărârea concretă."},
    {term:"Arest la domiciliu", meaning:"Măsură preventivă privativă de libertate executată la domiciliul stabilit de organul judiciar. Perioada poate fi computată din pedeapsă în condițiile legii și ale hotărârii aplicabile."},
    {term:"Arest preventiv", meaning:"Măsură preventivă privativă de libertate dispusă de judecător în cursul procesului penal. Are temei și termene proprii și nu se confundă cu executarea unei pedepse definitive."},
    {term:"Autenticitate", meaning:"Siguranța că documentul provine de la autoritatea indicată și că forma primită permite verificarea provenienței și integrității sale. O informație neverificată nu înlocuiește actul oficial."},
    {term:"Cazier judiciar", meaning:"Evidență oficială a datelor privind antecedentele penale și alte mențiuni prevăzute de lege. În activitatea de evidență se corelează cu hotărârile și situația juridică, fără a dubla sau completa prin presupunere condamnările."},
    {term:"Citație", meaning:"Act procedural prin care o persoană este chemată să se prezinte în fața organului judiciar. Pentru persoana privată de libertate, citarea se realizează potrivit regulilor speciale aplicabile locului de deținere."},
    {term:"Computare / deducere", meaning:"Scăderea din pedeapsă a unor perioade de privare de libertate ori a altor perioade recunoscute de lege și de actele judiciare. Fiecare interval trebuie justificat și verificat pentru a evita omisiunile sau dubla deducere."},
    {term:"Concurs de infracțiuni", meaning:"Formă a pluralității de infracțiuni în care sunt îndeplinite condițiile legale pentru existența mai multor infracțiuni concurente. Efectul asupra pedepsei rezultă din hotărârea instanței și din regulile Codului penal."},
    {term:"Contestație", meaning:"Cale de atac sau procedură de verificare care există numai în situațiile în care legea o prevede expres. Nu este un termen generic care poate înlocui apelul."},
    {term:"Contestație la executare", meaning:"Procedură judiciară prin care pot fi soluționate incidentele de executare prevăzute de Codul de procedură penală. Structura de evidență nu soluționează ea însăși neclaritatea juridică ce aparține instanței."},
    {term:"Contopirea pedepselor", meaning:"Operațiune juridică prin care instanța stabilește pedeapsa rezultantă atunci când sunt incidente regulile privind pluralitatea de infracțiuni sau alte situații prevăzute de lege. Nu se face administrativ de lucrătorul de evidență."},
    {term:"De îndată", meaning:"Fără întârziere nejustificată. Când legea folosește această formulare, operațiunea are caracter imediat raportat la momentul în care există actul și condițiile necesare executării."},
    {term:"Decizie penală", meaning:"Denumire folosită, ca regulă, pentru hotărârea prin care o instanță soluționează apelul, recursul în casație sau alte situații prevăzute de lege. Se citește împreună cu hotărârile pe care le menține, modifică ori desființează."},
    {term:"Dispozitivul hotărârii", meaning:"Partea hotărârii în care instanța arată concret soluția dispusă. Pentru evidență, interdicțiile, deducerile, obligațiile și celelalte efecte se preiau exact din actele judiciare aplicabile."},
    {term:"Documentar penal", meaning:"Componenta dosarului individual care cuprinde actele ce justifică deținerea și evoluția situației juridice: mandate, hotărâri, calcule, deduceri, comunicări și celelalte documente relevante."},
    {term:"Dublu control", meaning:"Verificarea unui calcul sau a unei operațiuni de către o a doua persoană competentă, potrivit circuitului aplicabil. Scopul este reducerea erorilor și păstrarea trasabilității verificării."},
    {term:"Eroare materială", meaning:"Greșeală de redactare sau consemnare care nu trebuie corectată prin modificarea de către lucrător a actului emis de instanță. Dacă influențează identificarea ori executarea, se solicită rectificarea sau lămurirea autorității competente."},
    {term:"Extrădare", meaning:"Procedură de cooperare judiciară prin care o persoană este predată între state în condițiile legii și ale convențiilor aplicabile. Perioadele executate în străinătate și eventualele garanții se valorifică numai pe baza actelor competente."},
    {term:"Fracție pentru liberarea condiționată", meaning:"Parte din durata pedepsei relevantă pentru îndeplinirea condiției temporale a liberării condiționate. Împlinirea fracției nu înseamnă liberare automată și se verifică împreună cu celelalte condiții legale."},
    {term:"Hotărâre definitivă", meaning:"Hotărâre care a dobândit caracter definitiv la momentul stabilit de lege. Ca regulă, hotărârile penale devin executorii când rămân definitive, cu excepțiile expres prevăzute de lege."},
    {term:"Hotărâre judecătorească", meaning:"Noțiune generală care cuprinde, în procesul penal, sentințe, decizii și încheieri. Denumirea actului nu trebuie confundată cu faptul că acesta este sau nu definitiv ori executoriu."},
    {term:"Încheiere", meaning:"Hotărâre pronunțată de instanță în situațiile în care legea nu prevede pronunțarea unei sentințe sau decizii. Unele încheieri pot avea efecte imediate, în funcție de materia și norma aplicabilă."},
    {term:"Întreruperea executării pedepsei", meaning:"Suspendare temporară a executării pedepsei dispusă de instanță în cazurile prevăzute de lege. Perioada de întrerupere se urmărește distinct, iar data revenirii trebuie controlată exact."},
    {term:"Liberare condiționată", meaning:"Punere în libertate înainte de executarea integrală a pedepsei, dispusă de instanță dacă sunt îndeplinite condițiile legale. Propunerea comisiei sau simpla împlinire a fracției nu produce singură liberarea."},
    {term:"Liberare la termen", meaning:"Expresie practică pentru punerea în libertate la expirarea integrală a duratei pedepsei, dacă nu există un alt temei legal de deținere. Este distinctă de liberarea condiționată."},
    {term:"Mandat de arestare preventivă", meaning:"Act prin care se pune în executare măsura arestării preventive dispuse de judecător. Are altă natură și alt scop decât mandatul de executare a pedepsei închisorii."},
    {term:"Mandat de executare a pedepsei închisorii (MEPI)", meaning:"Act emis pentru punerea în executare a pedepsei închisorii sau, după caz, a detențiunii pe viață. MEPI nu este o nouă condamnare; el trebuie corelat cu hotărârea definitivă pe care o execută."},
    {term:"Măsură de siguranță", meaning:"Măsură prevăzută de legea penală pentru înlăturarea unei stări de pericol și prevenirea unor fapte viitoare. Se execută potrivit conținutului hotărârii și regimului juridic propriu, distinct de pedeapsă."},
    {term:"Măsură preventivă", meaning:"Măsură procesuală dispusă în cursul procesului penal pentru scopurile prevăzute de lege. Reținerea, controlul judiciar, controlul judiciar pe cauțiune, arestul la domiciliu și arestarea preventivă au regimuri diferite."},
    {term:"Motivarea hotărârii", meaning:"Partea în care instanța explică situația de fapt, argumentele și temeiurile soluției. Pentru executare, motivarea ajută la înțelegerea soluției, dar operațiunile trebuie corelate în primul rând cu dispozitivul și actele executorii."},
    {term:"Obligații civile", meaning:"Sumele sau prestațiile stabilite prin hotărârea penală pentru repararea prejudiciului ori alte consecințe civile. Situația îndeplinirii lor poate avea relevanță inclusiv la analiza liberării condiționate."},
    {term:"Organ judiciar", meaning:"Autoritate judiciară cu atribuții în procesul penal, potrivit competenței stabilite de lege. Când există neclarități privind sensul sau efectul unui act, lămurirea se solicită organului competent, nu se deduce administrativ."},
    {term:"Pedeapsă accesorie", meaning:"Interzicerea exercitării unor drepturi în condițiile stabilite de Codul penal, legată de executarea pedepsei principale privative de libertate. Se operează exact drepturile și perioada rezultate din hotărâre și lege."},
    {term:"Pedeapsă complementară", meaning:"Pedeapsă care se adaugă pedepsei principale și poate consta, între altele, în interzicerea exercitării unor drepturi. Conținutul și durata se preiau exact din hotărârea judecătorească."},
    {term:"Pedeapsă principală", meaning:"Sancțiunea penală principală aplicată pentru infracțiune, precum închisoarea, detențiunea pe viață sau amenda, după caz. În evidența penitenciară interesează în special pedeapsa privativă de libertate aflată efectiv în executare."},
    {term:"Pluralitate de infracțiuni", meaning:"Noțiune care acoperă situațiile în care aceeași persoană răspunde pentru mai multe infracțiuni în formele prevăzute de lege, precum concursul sau recidiva. Efectul concret asupra pedepsei este stabilit juridic, nu administrativ."},
    {term:"Punere în libertate", meaning:"Operațiunea prin care încetează deținerea în baza temeiului executat, la data și în condițiile prevăzute de actul competent și de lege. Înainte de liberare se verifică întotdeauna existența altor temeiuri de deținere."},
    {term:"Rechizitoriu", meaning:"Actul prin care procurorul dispune trimiterea în judecată, în condițiile legii. Nu este o hotărâre de condamnare și nu modifică singur pedeapsa aflată în executare, dar poate crea obligații de evidență și prezentare."},
    {term:"Recidivă", meaning:"Formă a pluralității de infracțiuni care există numai dacă sunt îndeplinite condițiile prevăzute de Codul penal privind condamnarea anterioară și noua infracțiune. Nu se stabilește de lucrător prin simpla existență a mai multor condamnări."},
    {term:"Rest neexecutat", meaning:"Partea dintr-o pedeapsă anterioară care nu fusese executată ori considerată executată la momentul juridic relevant. Modul în care influențează pedeapsa actuală trebuie să rezulte din hotărârea și mandatul aplicabile."},
    {term:"Reținere", meaning:"Măsură preventivă privativă de libertate dispusă pentru durata și în condițiile prevăzute de Codul de procedură penală. Perioada se valorifică la calcul numai în condițiile legii și ale actelor din dosar."},
    {term:"Sentință penală", meaning:"Hotărârea prin care prima instanță soluționează cauza sau se dezînvestește în situațiile prevăzute de lege. O sentință poate deveni definitivă direct sau după parcurgerea căii de atac aplicabile."},
    {term:"Situație juridică", meaning:"Ansamblul datelor care descriu temeiul și evoluția deținerii unei persoane: hotărâri, mandate, pedepse, deduceri, termene, măsuri, interdicții și modificări ulterioare. Trebuie să poată fi reconstruită din documente."},
    {term:"Suspendarea executării pedepsei sub supraveghere", meaning:"Modalitate de individualizare prin care executarea pedepsei închisorii este suspendată în condițiile stabilite de instanță și lege. O pedeapsă suspendată nu se tratează ca pedeapsă aflată în executare în penitenciar decât dacă intervine un act care schimbă această situație."},
    {term:"Termen de reexaminare", meaning:"Data sau intervalul la care situația trebuie analizată din nou potrivit hotărârii, procesului-verbal ori normei aplicabile. Nu trebuie confundat cu o dată automată de liberare."},
    {term:"Termen de supraveghere", meaning:"Perioadă în care persoana este supusă efectelor și obligațiilor de supraveghere specifice instituției juridice aplicabile. Durata și conținutul diferă, de exemplu, între suspendare și liberare condiționată."},
    {term:"Temei de deținere", meaning:"Actul sau ansamblul de acte care justifică legal privarea de libertate la un moment dat. Evidența trebuie să permită identificarea rapidă a temeiului actual, a duratei și a autorității care l-a dispus."},
    {term:"Transfer", meaning:"Mutarea persoanei private de libertate între locuri de deținere ori, în situațiile prevăzute de lege, către alte structuri competente. Transferul schimbă locul custodiei, nu înlocuiește și nu rescrie titlul juridic al deținerii."}
  ],'''
pattern = r"  glossary: \[\n[\s\S]*?\n  \],\n  categories:"
updated, count = re.subn(pattern, new_glossary + "\n  categories:", s, count=1)
if count != 1:
    raise RuntimeError("Blocul glossary din instructaj/data.js nu a putut fi înlocuit")
write(p, updated)


# 2. Titlul fișei de transfer fără prefixul redundant „MĂSURĂ —”.
p = Path("instructaj/verificare-dosar-transfer.js")
s = read(p)
s = replace_once(
    s,
    'title: "MĂSURĂ — Verificarea dosarului sosit prin transfer",',
    'title: "Verificarea dosarului sosit prin transfer",',
    "titlul fișei de transfer",
)
write(p, s)


# 3. Navigație publică centrată și identică pe tabletă/mobil.
p = Path("css/responsive.css")
s = read(p)
marker = "/* NAVIGAȚIE PUBLICĂ CENTRATĂ — mobil și tabletă */"
if marker in s:
    raise RuntimeError("Blocul de centrare a navigației există deja")
nav_css = r'''

/* NAVIGAȚIE PUBLICĂ CENTRATĂ — mobil și tabletă */
@media (max-width: 1040px) {
  body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__bar {
    grid-template-columns: minmax(0, 1fr) auto !important;
    column-gap: 10px !important;
    row-gap: 8px !important;
  }

  body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav {
    grid-column: 1 / -1;
    width: 100%;
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px !important;
    margin-inline: auto;
    padding: 0 0 10px !important;
    overflow: visible !important;
    scroll-snap-type: none;
  }

  body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav a {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin: 0;
  }
}

@media (min-width: 641px) and (max-width: 1040px) {
  body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav a {
    flex: 0 1 116px;
    min-width: 104px;
    max-width: 132px;
    padding-inline: 10px !important;
  }
}

@media (max-width: 640px) {
  body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav {
    display: flex !important;
    grid-template-columns: none !important;
  }

  body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav a {
    flex: 0 0 calc((100% - 12px) / 3);
    width: auto;
    max-width: 150px;
    min-width: 0;
    padding-inline: 5px !important;
  }
}
'''
s = s.rstrip() + nav_css + "\n"
write(p, s)


# 4. Bust de cache pentru responsive.css în toate straturile de bază.
for file in ["css/style.css", "instructaj/styles.css", "semnalmente/style.css", "ofiter/styles.css"]:
    p = Path(file)
    s = read(p)
    if "responsive.css?v=1" not in s:
        raise RuntimeError(f"Nu am găsit responsive.css?v=1 în {file}")
    write(p, s.replace("responsive.css?v=1", "responsive.css?v=2"))

# Bust de cache pentru CSS-ul public care importă responsive.css.
for file in ["index.html", "contopiri/index.html", "transfer/index.html", "transfer/rules/index.html"]:
    p = Path(file)
    s = read(p)
    if "css/style.css?v=41" in s:
        s = s.replace("css/style.css?v=41", "css/style.css?v=42")
    elif "../css/style.css?v=41" in s:
        s = s.replace("../css/style.css?v=41", "../css/style.css?v=42")
    else:
        raise RuntimeError(f"Nu am găsit loaderul style.css?v=41 în {file}")
    write(p, s)

p = Path("instructaj/index.html")
s = read(p)
s = replace_once(s, 'styles.css?v=3', 'styles.css?v=4', "cache Instructaj")
write(p, s)

for file in ["semnalmente/index.html", "semnalmente/benchmark/index.html"]:
    p = Path(file)
    s = read(p)
    if 'href="style.css?v=2"' not in s:
        s = replace_once(s, 'href="style.css"', 'href="style.css?v=2"', f"cache {file}")
    write(p, s)


# 5. Regresii: glosar bogat, titlu curat și nav centrat, Ofițer în continuare ascuns.
p = Path("instructaj/tests.mjs")
s = read(p)
s = replace_once(
    s,
    'assert.ok(data.glossary.length >= 7, "Glosar pentru termenii juridici indispensabili");',
    '''assert.ok(data.glossary.length >= 45, "Glosarul trebuie să acopere amplu termenii juridici de lucru");
for (const term of [
  "Act executoriu",
  "Citație",
  "Contestație la executare",
  "Contopirea pedepselor",
  "Hotărâre definitivă",
  "Liberare condiționată",
  "Mandat de executare a pedepsei închisorii (MEPI)",
  "Pedeapsă accesorie",
  "Pedeapsă complementară",
  "Recidivă",
  "Temei de deținere"
]) {
  assert.ok(data.glossary.some(item => item.term === term && item.meaning.length > 60), `Glosarul trebuie să explice: ${term}`);
}
const transferSupplement = fs.readFileSync(path.join(moduleDir, "verificare-dosar-transfer.js"), "utf8");
assert.ok(transferSupplement.includes('title: "Verificarea dosarului sosit prin transfer"'), "Fișa transfer trebuie să aibă titlul curat");
assert.ok(!transferSupplement.includes('MĂSURĂ — Verificarea dosarului sosit prin transfer'), "Prefixul MĂSURĂ trebuie eliminat din titlu");''',
    "testele glosarului",
)
write(p, s)

p = Path("tests/responsive-layout.mjs")
s = read(p)
s = s.replace("responsive.css?v=1", "responsive.css?v=2")
insert = '''\nassert.ok(\n  responsive.includes('/* NAVIGAȚIE PUBLICĂ CENTRATĂ — mobil și tabletă */') &&\n  responsive.includes('body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav') &&\n  responsive.includes('flex-wrap: wrap') &&\n  responsive.includes('justify-content: center'),\n  'Meniul public trebuie să fie centrat și uniform pe mobil/tabletă'\n);\n'''
needle = "assert.ok(\n  responsive.includes('body.ev-unified[data-ev-page^=\"ofiter\"] .ev-shell__nav')"
if needle not in s:
    raise RuntimeError("Nu am găsit punctul de inserare în responsive-layout.mjs")
s = s.replace(needle, insert + "\n" + needle, 1)
write(p, s)


# 6. Mecanism one-off: nu rămâne în repository după aplicare.
Path("scripts/update_instructaj_glossary_nav.py").unlink(missing_ok=True)
Path(".github/workflows/update-instructaj-glossary-nav.yml").unlink(missing_ok=True)

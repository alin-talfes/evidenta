# Calculator Termene Pedepse Privative de Libertate

**Autor:** Alin Talfeș

## Descriere

Aplicație web destinată calculului termenelor de executare a pedepselor privative de libertate și a termenelor procedurale asociate, în conformitate cu legislația penală română.

Proiectul integrează patru module principale:

- **Calculator termene pedepse privative de libertate** – calculul expirării pedepsei, al fracțiilor pentru liberare condiționată și al termenelor de reanalizare.
- **Calculator termene procedurale** – calculul termenelor pentru căi de atac, măsuri preventive și alte termene prevăzute de lege.
- **Calculator pedeapsă rezultantă** – instrument aritmetic pentru cuantumuri deja calificate juridic de utilizator.
- **Transfer și profilare** – filtrare a unităților compatibile pe baza regulilor și anexelor configurate pentru Decizia nr. 360/2020.

## Funcționalități

### Executarea pedepselor

- Calculul duratei pedepsei în ani, luni și zile
- Determinarea datei de expirare teoretică
- Determinarea datei de expirare reală
- Calculul perioadelor executate și rămase
- Calculul fracțiilor pentru liberare condiționată
- Calculul termenului de reanalizare (1/5)
- Cronologie completă a termenelor relevante

### Deduceri și perioade speciale

- Reținere
- Arest preventiv
- Arest la domiciliu
- Măsuri preventive executate în alte cauze
- Recurs compensatoriu (Legea nr. 169/2017)
- Evadări
- Întreruperi ale executării pedepsei
- Perioade considerate neexecutate conform dispozițiilor legale

### Utilitare

- Salvarea spețelor în browser
- Încărcarea spețelor salvate
- Copiere rapidă a rezultatelor
- Export PDF
- Temă Light / Dark
- Interfață adaptată pentru desktop și dispozitive mobile

## Tehnologii utilizate

- HTML5
- CSS3
- JavaScript (ES6+)
- localStorage
- Print API pentru export PDF

## Structura proiectului

```text
calculator-pedepse/
│
├── index.html
├── termene.html
├── contopiri.html
│
├── css/
│   └── style.css
│
└── js/
    ├── utils.js
    ├── rules.js
    ├── legal.js
    ├── storage.js
    ├── export.js
    ├── ui.js
    └── app.js
```

### Descriere fișiere

| Fișier | Rol |
|----------|----------|
| utils.js | Funcții utilitare și operații cu date calendaristice |
| rules.js | Reguli de calcul și algoritmi principali |
| legal.js | Referințe și reguli juridice aplicabile |
| storage.js | Gestionarea stocării locale |
| export.js | Copiere și export rezultate |
| ui.js | Interfața utilizator |
| app.js | Inițializarea aplicației și logica principală |

## Utilizare

1. Descarcă sau clonează repository-ul.
2. Servește directorul prin HTTP/HTTPS (de exemplu GitHub Pages sau un server static local) și deschide pagina principală. `version.json` este încărcat prin `fetch`, deci deschiderea directă prin `file://` nu oferă experiența completă.
3. Introdu datele cauzei.
4. Apasă **Calculează**.
5. Utilizează meniul aplicației pentru accesarea celorlalte module.

Aplicația funcționează integral local și nu necesită instalare sau conexiune la server.

## Bază legală

Calculele sunt fundamentate pe:

- Codul penal
- Codul de procedură penală
- Legea nr. 254/2013 privind executarea pedepselor și a măsurilor privative de libertate
- Ordinul ministrului justiției nr. 2188/C/2022
- Legea nr. 169/2017
- Hotărâri prealabile și recursuri în interesul legii relevante

Utilizatorul are obligația de a verifica întotdeauna legislația în vigoare și particularitățile fiecărei cauze.

## Limitări

- Aplicația are caracter informativ și orientativ.
- Nu reprezintă evidență oficială a administrației penitenciare.
- Nu înlocuiește verificarea juridică individuală a fiecărei spețe.
- Datele sunt stocate exclusiv în browserul utilizatorului.
- Nu sunt transmise informații către servere externe.

## Contribuții

Sugestiile privind funcționalități noi, corectarea erorilor și îmbunătățirea algoritmilor de calcul sunt binevenite.

## Licență

Copyright © Alin Talfeș

Toate drepturile rezervate.
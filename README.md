# Evidență — suită de instrumente

**Versiune stabilă: 1.0.0.** Modulul AI Documente rămâne separat în stadiul **ALPHA**.

Aplicație web statică pentru activități de evidență, calcule juridice, pregătire profesională și descriere asistată a semnalmentelor. Toate modulele sunt publicate prin GitHub Pages din același repository.

## Module publice

| Modul | Rol | Adresă |
|---|---|---|
| Evidență pedepse | Expirare, deduceri, fracții și liberare condiționată | [Deschide](https://alin-talfes.github.io/evidenta/) |
| Contopiri | Calcul aritmetic pentru pedepse rezultante | [Deschide](https://alin-talfes.github.io/evidenta/contopiri/) |
| AI Documente (ALPHA) | OCR și extragere asistată din mandate/hotărâri, cu reutilizarea motoarelor Pedepse și Contopiri | [Deschide](https://alin-talfes.github.io/evidenta/ai/) |
| Transfer și profilare | Filtrarea unităților și regulile de transfer | [Deschide](https://alin-talfes.github.io/evidenta/transfer/) |
| Instructaj evidență | Moduri de lucru explicate pe baza actelor normative și instrucțiunilor relevante | [Deschide](https://alin-talfes.github.io/evidenta/instructaj/) |
| Semnalmente | Fișă descriptivă facială asistată și verificabilă | [Deschide](https://alin-talfes.github.io/evidenta/semnalmente/) |

Ruta `/descriere-semnalmente/` este păstrată în acest repository numai ca redirecționare de compatibilitate către `/semnalmente/`.

## Structură

```text
evidenta/
├── index.html
├── contopiri/
├── ai/                       # OCR + analiză documente (ALPHA)
├── css/
├── js/
├── transfer/
├── instructaj/
├── semnalmente/
├── descriere-semnalmente/   # redirect de compatibilitate
├── tests/
└── .github/workflows/
```

## Dezvoltare și verificare

Repository-ul folosește CI pentru verificarea sintaxei, testele de regresie juridică, release gate, responsive UI și modulele auxiliare.

Rulează local:

```bash
npm test
npm run check:syntax
cd semnalmente && npm test
```

## Principii de utilizare

- Datele aplicațiilor sunt stocate local în browser, dacă modulul nu precizează altfel.
- Instrumentele juridice nu înlocuiesc verificarea documentarului penal și a actelor normative aplicabile speței.
- AI Documente este în versiune **ALPHA**: OCR-ul și extragerea automată trebuie verificate înainte de calcul.
- AI Documente preferă resurse locale/cache și poate utiliza surse externe ca fallback pentru bibliotecile PDF/OCR și modelul OCR.
- Calculele din AI Documente sunt executate de aceleași motoare deterministe folosite de modulele Pedepse și Contopiri; OCR-ul nu generează formulele juridice.
- Rezultatele modulului Semnalmente sunt euristice, nu identificare biometrică sau expertiză criminalistică.

## Release

Criteriile pentru versiunea stabilă sunt urmărite în `RELEASE_GATE.md`. Istoricul versiunilor este în `CHANGELOG.md`.

## Licență

Copyright © Alin Talfeș. Toate drepturile rezervate.

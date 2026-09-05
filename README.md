# Evidență — suită de instrumente

Aplicație web statică pentru activități de evidență, calcule juridice, pregătire profesională și descriere asistată a semnalmentelor. Toate modulele sunt publicate prin GitHub Pages din același repository.

## Module publice

| Modul | Rol | Adresă |
|---|---|---|
| Evidență pedepse | Expirare, deduceri, fracții și liberare condiționată | [Deschide](https://alin-talfes.github.io/evidenta/) |
| Contopiri | Calcul aritmetic pentru pedepse rezultante | [Deschide](https://alin-talfes.github.io/evidenta/contopiri/) |
| Transfer și profilare | Filtrarea unităților și regulile de transfer | [Deschide](https://alin-talfes.github.io/evidenta/transfer/) |
| Instructaj evidență | 23 de moduri de lucru explicate pe baza OMJ nr. 2.188/C/2022, Legii nr. 254/2013, HG nr. 157/2016 și a Codurilor penal/procedural | [Deschide](https://alin-talfes.github.io/evidenta/instructaj/) |
| Semnalmente | Fișă descriptivă facială asistată și verificabilă | [Deschide](https://alin-talfes.github.io/evidenta/semnalmente/) |

Ruta `/descriere-semnalmente/` este păstrată în acest repository numai ca redirecționare de compatibilitate către `/semnalmente/`.

## Structură

```text
evidenta/
├── index.html
├── contopiri/
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

Repository-ul folosește un CI adaptat structurii monorepo:

- testele și verificarea sintactică pentru aplicația principală;
- testele unitare pentru `semnalmente`.

Rulează local:

```bash
npm test
npm run check:syntax
cd semnalmente && npm test
```

## Principii de utilizare

- Datele aplicațiilor sunt stocate local în browser, dacă modulul nu precizează altfel.
- Instrumentele juridice au caracter orientativ și nu înlocuiesc verificarea actelor normative în forma în vigoare.
- Rezultatele modulului Semnalmente sunt euristice, nu identificare biometrică sau expertiză criminalistică.
- Fotografiile analizate de Semnalmente nu sunt trimise către un backend propriu; biblioteca și modelul MediaPipe sunt descărcate din surse externe.

## Arhivarea proiectelor vechi

Repository-urile independente istorice sunt păstrate privat și arhivate exclusiv ca backup. Versiunile publice active sunt cele enumerate mai sus.

## Licență

Copyright © Alin Talfeș. Toate drepturile rezervate.

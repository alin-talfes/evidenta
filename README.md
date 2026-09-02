# Evidență — suită de instrumente

Aplicație web statică pentru activități de evidență, calcule juridice, pregătire profesională și descriere asistată a semnalmentelor. Toate modulele sunt publicate prin GitHub Pages din același repository.

## Module publice

| Modul | Rol | Adresă |
|---|---|---|
| Evidență pedepse | Expirare, deduceri, fracții și liberare condiționată | [Deschide](https://alin-talfes.github.io/evidenta/) |
| Contopiri | Calcul aritmetic pentru pedepse rezultante | [Deschide](https://alin-talfes.github.io/evidenta/contopiri.html) |
| Transfer și profilare | Filtrarea unităților și regulile de transfer | [Deschide](https://alin-talfes.github.io/evidenta/transfer/) |
| Termene procedurale | Calculul termenelor procedurale | [Deschide](https://alin-talfes.github.io/evidenta/termene.html) |
| Training ofițer evidență | Grile, sinteze, spețe de calcul și interviu | [Deschide](https://alin-talfes.github.io/evidenta/training/) |
| Semnalmente | Fișă descriptivă facială asistată și verificabilă | [Deschide](https://alin-talfes.github.io/evidenta/semnalmente/) |

Ruta `/descriere-semnalmente/` este păstrată în acest repository numai ca redirecționare de compatibilitate către `/semnalmente/`.

## Structură

```text
evidenta/
├── index.html
├── contopiri.html
├── termene.html
├── css/
├── js/
├── transfer/
├── training/
├── semnalmente/
├── descriere-semnalmente/   # redirect de compatibilitate
├── tests/
└── .github/workflows/
```

## Dezvoltare și verificare

Repository-ul folosește un CI adaptat structurii monorepo:

- testele și verificarea sintactică pentru aplicația principală;
- audit CSS și verificări JavaScript pentru `training`;
- testele unitare pentru `semnalmente`.

Rulează local:

```bash
npm test
npm run check:syntax
cd semnalmente && npm test
cd ../training && npm install --no-save postcss && node scripts/audit-css.mjs
```

## Principii de utilizare

- Datele aplicațiilor sunt stocate local în browser, dacă modulul nu precizează altfel.
- Instrumentele juridice au caracter orientativ și nu înlocuiesc verificarea actelor normative în forma în vigoare.
- Rezultatele modulului Semnalmente sunt euristice, nu identificare biometrică sau expertiză criminalistică.
- Fotografiile analizate de Semnalmente nu sunt trimise către un backend propriu; biblioteca și modelul MediaPipe sunt descărcate din surse externe.

## Arhivarea proiectelor vechi

Repository-urile independente `training` și `descriere-semnalmente` sunt păstrate privat și arhivate exclusiv ca backup istoric. Versiunile active sunt cele din acest monorepo.

## Licență

Copyright © Alin Talfeș. Toate drepturile rezervate.

# Release gate — Evidență 1.0.0

Stare curentă: **PREGĂTITĂ PENTRU 1.0.0**.

## Blocante 1.0

Niciun blocant deschis.

## Închise în auditul de release

- [x] Matricea LC NCP/VCP/pre-L.140/1996 este acoperită prin teste de regresie.
- [x] VCP art. 55¹ aplică pragul legal de 20 ani, respectiv 15 ani după pragul de 60 ani pentru bărbați / 55 ani pentru femei, inclusiv tranziția în timpul executării.
- [x] NCP art. 124/125 nu primesc automat reanalizarea 1/5.
- [x] Reanalizarea 1/5 pentru mai multe pedepse aplică art. 53 din Instrucțiuni: pedeapsa cea mai mare, data de referință specifică și deducerile din hotărârea definitivă.
- [x] Reținere 24 h = 1 zi; arest preventiv și arest la domiciliu = interval inclusiv.
- [x] Carantina este ancorată la data primirii în penitenciar/centru.
- [x] Zilele muncite nu pot împinge data înaintea pragului de vârstă care activează regula favorabilă.
- [x] VCP art. 60 alin. (2)/(3) și art. 60 alin. (4) anterior L.140/1996 nu pot produce efecte înainte de pragul 60/55 ani.
- [x] Contopirea standard art. 39 alin. (1) lit. b) are spețe de control automate.
- [x] Tipurile deducerilor sunt păstrate la salvare/autosave/încărcare în modulul Pedepse.
- [x] Release guards sunt încărcate în runtime și verificate în CI.
- [x] Layout-urile principale au verificări responsive/mobile automate.

## Gate separat — AI Documente ALPHA → BETA

Acest gate **nu blochează versiunea 1.0 a suitei**. Modulul AI rămâne marcat ALPHA până la validarea lui separată.

- [ ] Benchmark pe minimum 20–30 documente reale/anonimizate: PDF text, PDF scanat, fotografii, MEPI, sentințe și decizii.
- [ ] Criteriu de acceptare: zero valori juridice sau numerice greșite folosite silențios în calcul.
- [ ] Verificare pe dispozitive reale: Safari/iPhone, Chrome Android și desktop.

## Regula de versiune

CI blochează versiunea majoră `1.x` numai dacă secțiunea **Blocante 1.0** conține elemente nebifate. Gate-ul AI este urmărit separat.

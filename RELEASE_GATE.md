# Release gate — Evidență 1.0.0

Stare curentă: **NU ESTE ÎNCĂ PREGĂTITĂ PENTRU 1.0.0**.

## Blocante deschise

- [ ] **VCP art. 55¹ — detențiune pe viață.** Codul penal anterior prevede 20 ani executați efectiv, respectiv 15 ani pentru bărbații trecuți de 60 ani și femeile trecute de 55 ani. Configurația IMSweb transcrisă pentru VCP art. 55¹ este generică și nu dovedește singură cum tratează IMSweb pragul favorabil. Este necesar un caz IMSweb de control înainte de modificarea motorului.
- [ ] **Reanalizare regim 1/5 în situații cu mai multe pedepse.** Motorul manual calculează în prezent 1/5 din mandatul introdus. Instrucțiunile ANP conțin situații speciale în care baza de calcul și data de referință diferă. Pentru 1.0 trebuie fie implementate explicit aceste situații, fie limitată clar funcția la mandatul simplu.
- [ ] **AI Documente → BETA.** Se cer teste pe minimum 20–30 documente reale/anonimizate, inclusiv PDF scanat, fotografii, MEPI, sentințe și decizii, cu criteriul de acceptare: zero valori juridice/numerice greșite folosite silențios în calcul.

## Închise în auditul de release

- [x] Matricea LC NCP/VCP/pre-L.140/1996 este acoperită prin teste de regresie.
- [x] NCP art. 124/125 nu primesc automat reanalizarea 1/5.
- [x] Reținere 24 h = 1 zi; arest preventiv și arest la domiciliu = interval inclusiv.
- [x] Carantina este ancorată la data primirii în penitenciar/centru.
- [x] Zilele muncite nu pot împinge data înaintea pragului de vârstă care activează regula favorabilă.
- [x] VCP art. 60 alin. (2)/(3) și art. 60 alin. (4) anterior L.140/1996 nu pot produce efecte înainte de pragul 60/55 ani.
- [x] Contopirea standard art. 39 alin. (1) lit. b) are spețe de control automate.
- [x] Tipurile deducerilor sunt păstrate în persistența modulului Pedepse.
- [x] AI are prag OCR, confirmare umană, proveniență pe pagină și layout mobile fără tabele late.

## Regula de versiune

Cât timp există elemente `- [ ]` în acest document, CI nu permite trecerea aplicației la o versiune majoră `1.x`.

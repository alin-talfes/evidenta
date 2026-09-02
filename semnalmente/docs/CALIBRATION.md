# Protocol de calibrare a motorului de semnalmente

Calibrarea trebuie să separe trei probleme: stabilitatea tehnică a regulilor, concordanța motorului cu o referință umană și stabilitatea referinței umane însăși. Testele automate din repository verifică prima problemă; benchmark-ul măsoară a doua; acordul inter-evaluatori măsoară a treia.

## Referința umană

Folosește numai fotografii pentru care există drept de utilizare și nu încărca fotografiile în repository-ul public. `caseId` trebuie pseudonimizat. Eticheta de referință se stabilește înainte de vizualizarea predicției automate. Ideal, doi evaluatori codificați (de exemplu `R1` și `R2`) evaluează independent aceleași cazuri, iar eventualele neconcordanțe sunt adjudecate separat în câmpul final `reference`.

Câmpul opțional `ratings` din `calibration-schema.json` permite păstrarea celor două evaluări. Benchmark-ul calculează acordul brut și Cohen's kappa separat pentru fiecare pereche de evaluatori și categorie. Kappa nu trebuie interpretat mecanic prin praguri universale; suportul, distribuția claselor și acordul brut trebuie analizate împreună.

## Loturi separate

Nu ajusta pragurile și nu raporta performanța finală pe același lot. Folosește cel puțin:

1. un lot de calibrare/dezvoltare pentru identificarea tiparelor de eroare și generarea pragurilor candidate;
2. un lot de validare finală, ținut separat și neatins în timpul ajustărilor.

Dimensiunea lotului nu este o garanție în sine. Este necesară acoperirea rezonabilă a claselor, condițiilor de iluminare, rezoluțiilor și calității fotografiilor. Benchmark-ul marchează drept insuficiente seturile care nu au suport minim pentru analiza pragurilor.

## Indicatori

Pentru clasificatoare se urmăresc: exact-match accuracy, accuracy condiționată, coverage/abstention, macro-F1, matricea de confuzie, recall pe clasă și hotspot-urile de eroare. Rezultatele se stratifică pe versiune de motor și calitatea fotografiei.

Pentru acordul uman se urmăresc: numărul de comparații, acordul brut și Cohen's kappa. Dacă evaluatorii atribuie aceeași singură clasă tuturor cazurilor, kappa poate fi matematic nedefinit chiar dacă acordul brut este 100%; benchmark-ul nu transformă acest caz într-un scor artificial.

## Praguri candidate

Înregistrările create de benchmark din exporturi noi pot include `features`: rapoarte numerice deja calculate de motor (de exemplu raportul de lățime al nasului sau raportul ochi/față). Nu sunt salvate imagini și nu sunt salvate landmark-uri.

Benchmark-ul poate căuta praguri candidate pentru clasificatoarele unidimensionale pentru care există aceste metrici. Optimizarea folosește macro-F1 ca obiectiv principal și accuracy ca departajare. Rezultatul este exclusiv exploratoriu:

- nu modifică `classifier-rules.js`;
- nu este generat dacă suportul este insuficient;
- nu trebuie aplicat automat;
- orice candidat trebuie testat pe lotul de validare finală înainte de adoptare.

Pentru clasificatoarele multivariate, cum este forma feței, nu se propun automat praguri din acest modul deoarece o optimizare independentă a fiecărei limite ar putea altera ordinea regulilor și ar favoriza supraînvățarea.

## Criteriu de modificare

Un prag se modifică numai dacă există un tipar repetabil de eroare, o justificare semantică a schimbării și un câștig care se menține pe lotul final independent. O îmbunătățire observată exclusiv pe lotul de calibrare nu este suficientă.

## Confidențialitate

Repository-ul public trebuie să conțină doar cod, teste sintetice, scheme și rezultate agregate. Nu introduce fotografii reale, nume, CNP, numere matricole, landmark-uri asociabile unei persoane sau fișe nominale.

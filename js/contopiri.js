const { toDays, fromDays, formatDuration, calculate } = ContopiriCore;

        // ===== Gestionare rânduri =====
        function addPenaltyRow() {
            const container = document.getElementById('penaltyRowsContainer');
            const row = document.createElement('div');
            row.className = 'penalty-row';
            row.innerHTML = `
                <div><label>Ani</label><input type="number" class="penalty-years" value="0" min="0"></div>
                <div><label>Luni</label><input type="number" class="penalty-months" value="0" min="0"></div>
                <div><label>Zile</label><input type="number" class="penalty-days" value="0" min="0"></div>
                <div><label>Tip</label><select class="penalty-type">
                    <option value="concurs">Concurs de infracțiuni (calcul treime)</option>
                    <option value="litb">Art. 129 alin. (2) lit. b) — spor minim 1/4</option>
                    <option value="recidiva">Recidivă postcondamnatorie (adăugare)</option>
                    <option value="revocare">Revocare rest</option>
                </select></div>
                <button class="btn btn-danger btn-sm" onclick="this.closest('.penalty-row').remove();" aria-label="Șterge rândul">X</button>
            `;
            container.appendChild(row);
        }

        // ===== Calcul =====
        function calculateMergedPenalties() {
            const rows = document.querySelectorAll('.penalty-row');
            const concursPenalties = [];
            const litbPenalties = [];
            const recidivaPenalties = [];
            const revocarePenalties = [];

            let hasInvalidRow = false;
            rows.forEach(row => {
                const years = Number(row.querySelector('.penalty-years').value || 0);
                const months = Number(row.querySelector('.penalty-months').value || 0);
                const days = Number(row.querySelector('.penalty-days').value || 0);
                if (![years, months, days].every(v => Number.isSafeInteger(v) && v >= 0)) { hasInvalidRow = true; return; }
                const type = row.querySelector('.penalty-type').value;
                if (years === 0 && months === 0 && days === 0) return;

                const totalDays = toDays(years, months, days);
                const penalty = { years, months, days, totalDays };

                if (type === 'concurs') concursPenalties.push(penalty);
                else if (type === 'litb') litbPenalties.push(penalty);
                else if (type === 'recidiva') recidivaPenalties.push(penalty);
                else if (type === 'revocare') revocarePenalties.push(penalty);
            });

            if (hasInvalidRow) { alert('Duratele trebuie să fie numere întregi pozitive sau zero. Calculul a fost oprit.'); return; }

            if (concursPenalties.length === 0 && litbPenalties.length === 0 && recidivaPenalties.length === 0 && revocarePenalties.length === 0) {
                alert('Adaugă cel puțin o pedeapsă validă.');
                return;
            }

            let calculation;
            try { calculation = calculate({ concurs: concursPenalties, litb: litbPenalties, recidiva: recidivaPenalties, revocare: revocarePenalties }); }
            catch (err) { alert(err.message); return; }
            const details = [];
            if (calculation.maxPenalty) {
                details.push(`Pedeapsa cea mai grea (concurs): ${formatDuration(calculation.maxPenalty)}`);
                details.push(`Totalul celorlalte pedepse (concurs): ${formatDuration(fromDays(calculation.othersTotalDays))}`);
                details.push(`Spor 1/3: ${formatDuration(fromDays(calculation.bonusDays))}`);
                details.push(`Rezultanta concurs: ${formatDuration(fromDays(calculation.concursResultDays))}`);
            }
            if (litbPenalties.length) {
                details.push(`Măsură educativă / rest art. 129 alin. (2) lit. b): ${litbPenalties.map(p => formatDuration(p)).join(' + ')}`);
                details.push(`Spor minim 1/4: ${formatDuration(fromDays(calculation.litbQuarterDays))}`);
                details.push(`<strong>Atenție:</strong> art. 129 alin. (2) lit. b) prevede cel puțin o pătrime. Calculatorul aplică minimul aritmetic; plafonul raportat la art. 39 alin. (1) lit. b) trebuie verificat din hotărâre/datele concrete.`);
            }
            if (recidivaPenalties.length) details.push(`Pedepse recidivă (adăugate integral): ${recidivaPenalties.map(p => formatDuration(p)).join(' + ')}`);
            if (revocarePenalties.length) details.push(`Revocare rest (adăugat integral): ${revocarePenalties.map(p => formatDuration(p)).join(' + ')}`);
            const finalDuration = calculation.finalDuration;

            const resultDiv = document.getElementById('mergeResult');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="big-result">PEDEAPSA FINALĂ: ${formatDuration(finalDuration)}</div>
                <div class="detail">${details.join('<br>')}</div>
            `;
        }

        const intro = document.querySelector('.module-intro');
        if (intro) intro.textContent = 'Instrument aritmetic pentru cuantumuri deja calificate juridic de utilizator: concurs, art. 129 alin. (2) lit. b), recidivă și resturi. Nu stabilește singur încadrarea juridică a situației.';

        const legalBox = document.querySelector('.legal-box');
        if (legalBox) {
            const firstHeading = legalBox.querySelector('h4');
            if (firstHeading) {
                const note = document.createElement('p');
                note.innerHTML = '<strong>Art. 129 alin. (2) lit. b) Cod penal — minoritate + majorat:</strong> dacă măsura educativă este privativă de libertate, iar pedeapsa aplicată pentru infracțiunea săvârșită după majorat este închisoarea, pedeapsa se majorează cu o durată egală cu <strong>cel puțin o pătrime</strong> din durata măsurii educative ori din restul rămas neexecutat. Categoria din calculator aplică numai sporul minim de 1/4; plafonul legal trebuie verificat separat.';
                firstHeading.insertAdjacentElement('afterend', note);
            }
        }

        addPenaltyRow();

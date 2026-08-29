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
                    <option value="recidiva">Recidivă postcondamnatorie (adaugare)</option>
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
            const recidivaPenalties = [];
            const revocarePenalties = [];

            rows.forEach(row => {
                const years = Number(row.querySelector('.penalty-years').value || 0);
                const months = Number(row.querySelector('.penalty-months').value || 0);
                const days = Number(row.querySelector('.penalty-days').value || 0);
                if (![years, months, days].every(v => Number.isSafeInteger(v) && v >= 0)) { alert('Duratele trebuie să fie numere întregi pozitive sau zero.'); return; }
                const type = row.querySelector('.penalty-type').value;
                if (years === 0 && months === 0 && days === 0) return;

                const totalDays = toDays(years, months, days);
                const penalty = { years, months, days, totalDays };

                if (type === 'concurs') concursPenalties.push(penalty);
                else if (type === 'recidiva') recidivaPenalties.push(penalty);
                else if (type === 'revocare') revocarePenalties.push(penalty);
            });

            if (concursPenalties.length === 0 && recidivaPenalties.length === 0 && revocarePenalties.length === 0) {
                alert('Adaugă cel puțin o pedeapsă validă.');
                return;
            }

            let calculation;
            try { calculation = calculate({ concurs: concursPenalties, recidiva: recidivaPenalties, revocare: revocarePenalties }); }
            catch (err) { alert(err.message); return; }
            const details = [];
            if (calculation.maxPenalty) {
                details.push(`Pedeapsa cea mai grea (concurs): ${formatDuration(calculation.maxPenalty)}`);
                details.push(`Totalul celorlalte pedepse (concurs): ${formatDuration(fromDays(calculation.othersTotalDays))}`);
                details.push(`Spor 1/3: ${formatDuration(fromDays(calculation.bonusDays))}`);
                details.push(`Rezultanta concurs: ${formatDuration(fromDays(calculation.concursResultDays))}`);
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

        addPenaltyRow();

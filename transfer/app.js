(function() {
            // ============================================================
            // 0. ÎNCĂRCARE VERSIUNE DIN version.json
            // ============================================================
            const versionDisplay = document.getElementById('versionDisplay');
            fetch('../version.json')
                .then(response => {
                    if (!response.ok) throw new Error('version.json not found');
                    return response.json();
                })
                .then(data => {
                    if (data.version) {
                        versionDisplay.textContent = 'Versiune: ' + data.version;
                    } else {
                        versionDisplay.textContent = 'Versiune: necunoscută';
                    }
                })
                .catch(() => {
                    versionDisplay.textContent = 'Versiune: neîncărcată';
                });

            // ============================================================
            // 1. LISTA JUDEȚELOR – ORDINE ALFABETICĂ, FĂRĂ GRUPARE
            // ============================================================
            const allJudete = [];
            for (const [grupa, judete] of Object.entries(JUDETE_GRUPATE)) {
                judete.forEach(j => allJudete.push(j));
            }
            allJudete.sort();

            const judetSelect = document.getElementById('judet');

            function populateJudete() {
                judetSelect.innerHTML = '<option value="">— Selectează —</option>';
                allJudete.forEach(j => {
                    const opt = document.createElement('option');
                    opt.value = j;
                    opt.textContent = j;
                    judetSelect.appendChild(opt);
                });
                const currentVal = judetSelect.dataset.selected || '';
                if (currentVal) {
                    const options = judetSelect.querySelectorAll('option');
                    for (let opt of options) {
                        if (opt.value === currentVal) {
                            opt.selected = true;
                            break;
                        }
                    }
                }
            }

            judetSelect.addEventListener('change', function() {
                judetSelect.dataset.selected = this.value;
            });

            populateJudete();

            // ============================================================
            // 2. TOGGLE MOD – 3 moduri: judiciar, custodieArestati, executare
            // ============================================================
            const toggleBtns = document.querySelectorAll('.toggle-btn');
            const judetLabel = document.getElementById('judetLabel');
            const riscGroup = document.getElementById('riscGroup');
            const riscCheckbox = document.getElementById('riscCheckbox');
            const modeAdvice = document.getElementById('modeAdvice');
            const regimGroup = document.getElementById('regimGroup');
            const regimHint = document.getElementById('regimHint');
            const regimArestat = document.getElementById('regimArestat');
            let currentMode = 'judiciar';

            function setMode(mode) {
                currentMode = mode;
                toggleBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.mode === mode);
                });

                // Resetăm checkbox-ul de risc la schimbarea modului
                riscCheckbox.checked = false;

                if (mode === 'judiciar') {
                    judetLabel.textContent = 'Județul organului judiciar care îl citează';
                    riscGroup.style.display = 'flex';
                    regimGroup.style.display = 'block';
                    regimHint.style.display = 'none';
                    regimArestat.style.display = '';
                    modeAdvice.textContent = 'Modul „Afaceri judiciare” – transfer temporar pentru prezentare la organele judiciare.';
                } else if (mode === 'custodieArestati') {
                    judetLabel.textContent = 'Județul instanței / organului judiciar';
                    riscGroup.style.display = 'none';
                    regimGroup.style.display = 'none';
                    regimHint.style.display = 'none';
                    regimArestat.style.display = '';
                    modeAdvice.textContent = 'Modul „Custodie A.P.” – unități cu secții de arestare preventivă în custodie permanentă.';
                } else { // executare
                    judetLabel.textContent = 'Județul de domiciliu';
                    riscGroup.style.display = 'none';
                    regimGroup.style.display = 'block';
                    regimHint.style.display = 'none';
                    // ascundem opțiunea arestat preventiv
                    regimArestat.style.display = 'none';
                    // dacă este selectat arestat, trecem la deschis
                    const radioArestat = document.querySelector('input[name="regim"][value="arestat"]');
                    if (radioArestat && radioArestat.checked) {
                        const radioDeschis = document.querySelector('input[name="regim"][value="deschis"]');
                        if (radioDeschis) radioDeschis.checked = true;
                    }
                    modeAdvice.textContent = 'Modul „Executare pedeapsă” – unități de custodie permanentă pentru condamnați.';
                }
            }

            toggleBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    setMode(this.dataset.mode);
                });
            });

            // Setăm modul implicit: judiciar
            setMode('judiciar');

            // ============================================================
            // 3. FUNCȚII AJUTĂTOARE PENTRU RADIO
            // ============================================================
            function getSelectedRadioValue(name) {
                const radios = document.querySelectorAll('input[name="' + name + '"]');
                for (let r of radios) {
                    if (r.checked) return r.value;
                }
                return null;
            }

            function setRadioValue(name, value) {
                const radios = document.querySelectorAll('input[name="' + name + '"]');
                for (let r of radios) {
                    r.checked = (r.value === value);
                }
            }

            // ============================================================
            // 4. LOGICA DE CĂUTARE (folosește rules.js)
            // ============================================================
            const cautaBtn = document.getElementById('cautaBtn');
            const resetBtn = document.getElementById('resetBtn');
            const resultArea = document.getElementById('resultArea');

            function findDestination() {
                const sex = getSelectedRadioValue('sex') || 'masculin';
                const varsta = getSelectedRadioValue('varsta') || 'major';
                const judet = document.getElementById('judet').value;

                if (!judet) {
                    resultArea.innerHTML = `
                        <div class="result-card error">
                            <div class="result-title">Eroare</div>
                            <div class="result-sub">Selectați un județ pentru a continua.</div>
                        </div>
                    `;
                    return;
                }

                let matches = [];

                if (currentMode === 'judiciar') {
                    const regim = getSelectedRadioValue('regim') || 'arestat';
                    const risc = riscCheckbox.checked;
                    const useRisc = (regim !== 'educativ' && regim !== 'masura_educativa_penitenciar' && risc);
                    matches = gasesteUnitati(sex, varsta, regim, judet, 'judiciar', useRisc);
                } else if (currentMode === 'custodieArestati') {
                    matches = gasesteUnitati(sex, varsta, null, judet, 'custodieArestati', false);
                } else { // executare
                    const regim = getSelectedRadioValue('regim') || 'deschis';
                    matches = gasesteUnitati(sex, varsta, regim, judet, 'executare', false);
                }

                if (matches.length === 0) {
                    let extraMsg = '';
                    if (currentMode === 'custodieArestati') {
                        extraMsg = ' Nu există unități cu secții de arestare preventivă pentru județul selectat.';
                    }
                    resultArea.innerHTML = `
                        <div class="result-card error">
                            <div class="result-title">Nicio unitate găsită</div>
                            <div class="result-sub">
                                Nu există o unitate care să corespundă criteriilor:
                                <strong>${sex}</strong>, vârstă <strong>${varsta}</strong>, județ <strong>${judet}</strong>, mod <strong>${currentMode === 'judiciar' ? 'Afaceri judiciare' : currentMode === 'custodieArestati' ? 'Custodie A.P.' : 'Executare pedeapsă'}</strong>.
                                ${extraMsg}
                            </div>
                            <div class="result-detail">Verificați corectitudinea datelor sau consultați Anexa 1 a Deciziei 360/2020.</div>
                        </div>
                    `;
                    return;
                }

                // Sortare: pentru executare, prioritizăm unitățile care nu sunt doar pentru muncă
                if (currentMode === 'executare') {
                    matches.sort((a, b) => {
                        if (a.esteMunca && !b.esteMunca) return 1;
                        if (!a.esteMunca && b.esteMunca) return -1;
                        const aHas = a.judeteDeservite.includes(judet);
                        const bHas = b.judeteDeservite.includes(judet);
                        if (aHas && !bHas) return -1;
                        if (!aHas && bHas) return 1;
                        return 0;
                    });
                } else {
                    // Pentru judiciar și arestat, sortare după judeteDeservite
                    matches.sort((a, b) => {
                        const aHas = a.judeteDeservite.includes(judet);
                        const bHas = b.judeteDeservite.includes(judet);
                        if (aHas && !bHas) return -1;
                        if (!aHas && bHas) return 1;
                        return 0;
                    });
                }

                let html = `
                    <div class="result-card success">
                        <div class="result-title">Unități recomandate</div>
                        <div class="match-list">
                `;

                matches.forEach((m, idx) => {
                    const isBest = idx === 0;
                    const reason = isBest ? 'Cea mai bună potrivire' : 'Alternativă';
                    const tag = isBest ? 'Recomandat' : 'Posibil';
                    let extra = '';
                    if (m.isRisc) {
                        extra = ' (acceptă risc pentru siguranță)';
                    }
                    if (m.esteMunca) {
                        extra += ' (regim deschis pentru muncă)';
                    }
                    if (m.isCustodie) {
                        extra += ' (secție de arestare preventivă)';
                    }
                    html += `
                        <div class="match-item ${isBest ? 'best' : ''}">
                            <span class="primary">${m.unitate.nume}${extra}</span>
                            <span class="reason">${reason}</span>
                            <span class="tag">${tag}</span>
                        </div>
                    `;
                });

                let note = '';
                if (currentMode === 'custodieArestati') {
                    note = ' Atenție: Sunt afișate doar unitățile care au secții de arestare preventivă în custodie permanentă pentru județul selectat.';
                } else if (currentMode === 'executare') {
                    const areMunca = matches.some(m => m.esteMunca);
                    if (areMunca) {
                        note = ' Unitățile marcate cu „regim deschis pentru muncă” sunt destinate în principal persoanelor selectate pentru activități lucrative, constituind o alternativă secundară.';
                    }
                }

                html += `
                        </div>
                        <div class="result-sub mt-2">
                            <strong>Potrivire:</strong> Unitățile de mai sus sunt selectate pe baza criteriilor: <strong>${sex}</strong>, vârstă <strong>${varsta}</strong>, județ <strong>${judet}</strong>, mod <strong>${currentMode === 'judiciar' ? 'Afaceri judiciare' : currentMode === 'custodieArestati' ? 'Custodie A.P.' : 'Executare pedeapsă'}</strong>.
                            ${matches.length > 1 ? ' Cea mai bună potrivire este evidențiată.' : ''}
                            ${note}
                        </div>
                        <div class="result-detail">
                            <span>Județ: <strong>${judet}</strong></span>
                            <span>Sex: ${sex}</span>
                            <span>Vârstă: ${varsta}</span>
                            <span>Mod: ${currentMode === 'judiciar' ? 'Afaceri judiciare' : currentMode === 'custodieArestati' ? 'Custodie A.P.' : 'Executare pedeapsă'}</span>
                        </div>
                    </div>
                `;

                resultArea.innerHTML = html;
            }

            // ============================================================
            // 5. EVENT LISTENERS
            // ============================================================
            cautaBtn.addEventListener('click', findDestination);

            resetBtn.addEventListener('click', function() {
                document.getElementById('judet').value = '';
                setRadioValue('sex', 'masculin');
                setRadioValue('varsta', 'major');
                setRadioValue('regim', 'arestat');
                setMode('judiciar');
                riscCheckbox.checked = false;
                resultArea.innerHTML = `
                    <div class="empty-state">
                        <p>Completează criteriile și apasă „Caută destinația”.</p>
                    </div>
                `;
            });

            document.querySelectorAll('select, input').forEach(el => {
                el.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        findDestination();
                    }
                });
            });
            // ============================================================
            // 7. MESAJ INIȚIAL
            // ============================================================
            console.log('Aplicația de transfer – Decizia 360/2020 – încărcată cu succes.');
            console.log('Județe disponibile: ' + allJudete.length);

        })();

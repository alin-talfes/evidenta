(function() {
            // ============================================================
            // 1. LISTA JUDEȚELOR – ORDINE ALFABETICĂ, FĂRĂ GRUPARE
            // ============================================================
            const allJudete = [];
            for (const [, judete] of Object.entries(JUDETE_GRUPATE)) {
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
            // 1A. LISTA INSTANȚELOR – MONTAJ LA CERERE
            // ============================================================
            // Lista este mare și, deși <details> este închis, rămâne în DOM. Pe
            // Safari/iOS, inserarea rezultatului deasupra ei poate declanșa un
            // recalcul de layout disproporționat. Păstrăm conținutul, dar îl
            // scoatem din DOM până când utilizatorul deschide explicit lista.
            const instanteCard = document.getElementById('instanteCard');

            function enableLazyInstanteList() {
                if (!instanteCard) return;
                const details = instanteCard.querySelector('details');
                if (!details) return;

                const summary = details.querySelector('summary');
                const panel = summary ? summary.nextElementSibling : null;
                if (!panel) return;

                const panelHtml = panel.innerHTML;
                const panelStyle = panel.getAttribute('style') || '';
                panel.remove();

                function mountPanel() {
                    if (details.querySelector('[data-instante-lazy="true"]')) return;
                    const lazyPanel = document.createElement('div');
                    lazyPanel.dataset.instanteLazy = 'true';
                    if (panelStyle) lazyPanel.setAttribute('style', panelStyle);
                    lazyPanel.innerHTML = panelHtml;
                    details.appendChild(lazyPanel);
                }

                function unmountPanel() {
                    const lazyPanel = details.querySelector('[data-instante-lazy="true"]');
                    if (lazyPanel) lazyPanel.remove();
                }

                details.addEventListener('toggle', function() {
                    if (details.open) mountPanel();
                    else unmountPanel();
                });
            }

            enableLazyInstanteList();

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
                    modeAdvice.textContent = 'Modul „Custodie A.P. permanentă” – profilare Anexa 1. Nu reprezintă primirea inițială de la poliție din Anexa 3.';
                } else {
                    judetLabel.textContent = 'Județul de domiciliu';
                    riscGroup.style.display = 'none';
                    regimGroup.style.display = 'block';
                    regimHint.style.display = 'none';
                    regimArestat.style.display = 'none';
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

            function normalizeMatches(rawMatches) {
                if (!Array.isArray(rawMatches)) return [];

                return rawMatches.filter(match => {
                    return match && match.unitate && typeof match.unitate.nume === 'string';
                }).map(match => ({
                    ...match,
                    judeteDeservite: Array.isArray(match.judeteDeservite)
                        ? match.judeteDeservite
                        : (Array.isArray(match.unitate.judeteDeservite) ? match.unitate.judeteDeservite : [])
                }));
            }

            function runSearchEngine(sex, varsta, regim, judet, mode, risc) {
                if (typeof gasesteUnitati !== 'function') {
                    throw new Error('Motorul de reguli pentru transfer nu este disponibil.');
                }
                return normalizeMatches(gasesteUnitati(sex, varsta, regim, judet, mode, risc));
            }

            function setResultHtml(html) {
                resultArea.innerHTML = html;
            }

            function findDestination() {
                const sex = getSelectedRadioValue('sex') || 'masculin';
                const varsta = getSelectedRadioValue('varsta') || 'major';
                const judet = judetSelect.value;

                if (!judet) {
                    setResultHtml(`
                        <div class="result-card error" role="alert">
                            <div class="result-title">Eroare</div>
                            <div class="result-sub">Selectați un județ pentru a continua.</div>
                        </div>
                    `);
                    return;
                }

                let matches = [];

                if (currentMode === 'judiciar') {
                    const regim = getSelectedRadioValue('regim') || 'arestat';
                    const risc = riscCheckbox.checked;
                    const useRisc = (regim !== 'educativ' && regim !== 'masura_educativa_penitenciar' && risc);
                    matches = runSearchEngine(sex, varsta, regim, judet, 'judiciar', useRisc);
                } else if (currentMode === 'custodieArestati') {
                    matches = runSearchEngine(sex, varsta, null, judet, 'custodieArestati', false);
                } else {
                    const regim = getSelectedRadioValue('regim') || 'deschis';
                    matches = runSearchEngine(sex, varsta, regim, judet, 'executare', false);
                }

                if (matches.length === 0) {
                    let extraMsg = '';
                    if (currentMode === 'custodieArestati') {
                        extraMsg = ' Nu există unități profilate în Anexa 1 pentru custodie permanentă A.P. potrivit criteriilor selectate.';
                    }
                    setResultHtml(`
                        <div class="result-card error">
                            <div class="result-title">Nicio unitate găsită</div>
                            <div class="result-sub">
                                Nu există o unitate care să corespundă criteriilor:
                                <strong>${sex}</strong>, vârstă <strong>${varsta}</strong>, județ <strong>${judet}</strong>, mod <strong>${currentMode === 'judiciar' ? 'Afaceri judiciare' : currentMode === 'custodieArestati' ? 'Custodie A.P.' : 'Executare pedeapsă'}</strong>.
                                ${extraMsg}
                            </div>
                            <div class="result-detail">Verificați corectitudinea datelor sau consultați Anexa 1 a Deciziei 360/2020.</div>
                        </div>
                    `);
                    return;
                }

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
                    const reason = isBest ? 'Potrivire prioritară după criteriile tehnice' : 'Alternativă compatibilă';
                    const tag = isBest ? 'Prioritar' : 'Compatibil';
                    let extra = '';
                    if (m.isRisc) extra = ' (acceptă risc pentru siguranță)';
                    if (m.esteMunca) extra += ' (regim deschis pentru muncă)';
                    if (m.isCustodie) extra += ' (secție de arestare preventivă)';
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
                    note = ' Atenție: sunt afișate exclusiv destinațiile de custodie permanentă A.P. din profilarea Anexei 1; primirea de la poliție se verifică distinct potrivit Anexei 3.';
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
                            ${matches.length > 1 ? ' Prima potrivire după criteriile tehnice de sortare este evidențiată; aceasta nu reprezintă o prioritate juridică autonomă.' : ''}
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

                setResultHtml(html);
            }

            function safeFindDestination() {
                if (!cautaBtn || cautaBtn.dataset.searchRunning === 'true') return;

                const startedAt = performance.now();
                cautaBtn.dataset.searchRunning = 'true';
                cautaBtn.setAttribute('aria-busy', 'true');

                try {
                    findDestination();
                } catch (error) {
                    console.error('Eroare la căutarea destinației de transfer:', error);
                    setResultHtml(`
                        <div class="result-card error" role="alert">
                            <div class="result-title">Căutarea nu a putut fi finalizată</div>
                            <div class="result-sub">Motorul de transfer a întâmpinat o eroare. Reîncărcați pagina și încercați din nou.</div>
                        </div>
                    `);
                } finally {
                    delete cautaBtn.dataset.searchRunning;
                    cautaBtn.removeAttribute('aria-busy');
                    const elapsed = performance.now() - startedAt;
                    if (elapsed > 100) console.warn(`Căutarea Transfer a durat ${elapsed.toFixed(1)} ms.`);
                }
            }

            // ============================================================
            // 5. EVENT LISTENERS
            // ============================================================
            cautaBtn.addEventListener('click', safeFindDestination);

            resetBtn.addEventListener('click', function() {
                judetSelect.value = '';
                setRadioValue('sex', 'masculin');
                setRadioValue('varsta', 'major');
                setRadioValue('regim', 'arestat');
                setMode('judiciar');
                riscCheckbox.checked = false;
                setResultHtml(`
                    <div class="empty-state">
                        <p>Completează criteriile și apasă „Caută destinația”.</p>
                    </div>
                `);
            });

            document.querySelectorAll('select, input').forEach(el => {
                el.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        safeFindDestination();
                    }
                });
            });

            console.log('Aplicația de transfer – Decizia 360/2020, formă consolidată 30.03.2026 – încărcată cu succes.');
            console.log('Județe disponibile: ' + allJudete.length);

        })();

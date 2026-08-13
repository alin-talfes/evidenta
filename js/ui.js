// ========== INTERFAȚĂ UTILIZATOR (DOM) ==========

// Variabila globală pentru sexul curent (M/F)
let currentSex = 'M';

// Referințe către elementele DOM pentru toggle-ul de sex
const sexToggle = document.getElementById('sexToggle');
const sexLabelM = document.getElementById('sexLabelM');
const sexLabelF = document.getElementById('sexLabelF');

/**
 * Actualizează interfața pentru selectarea sexului.
 */
function updateSexUI() {
    if (!sexToggle) return;
    if (sexToggle.checked) {
        currentSex = 'M';
        if (sexLabelM) sexLabelM.classList.add('active');
        if (sexLabelF) sexLabelF.classList.remove('active');
    } else {
        currentSex = 'F';
        if (sexLabelF) sexLabelF.classList.add('active');
        if (sexLabelM) sexLabelM.classList.remove('active');
    }
    updAgeTag();
}

/**
 * Aplică masca pentru câmpurile de dată (zz.ll.aaaa).
 */
function applyDateMask(e) {
    const input = e.target;
    let val = input.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    let formatted = '';
    if (val.length > 0) formatted += val.substring(0, 2);
    if (val.length >= 3) formatted += '.' + val.substring(2, 4);
    if (val.length >= 5) formatted += '.' + val.substring(4, 8);
    input.value = formatted;
}

/**
 * Setează data de azi în câmpul specificat.
 */
function setToday(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.value = fmtDate(today());
}

/**
 * Actualizează eticheta de vârstă și categorie.
 */
function updAgeTag() {
    const b = document.getElementById('birthDate');
    const tag = document.getElementById('ageTag');
    if (!b || !tag) return;
    const bd = parseDate(b.value.trim());
    if (!bd) {
        tag.innerHTML = '<small>Format invalid</small>';
        return;
    }
    const a = ageExact(bd, today());
    const articleValue = document.getElementById('liberationArticle')?.value || '';
    const cat = getAgeCategoryAtDate(bd, today(), currentSex, articleValue);
    const catClass = cat === 'MINOR' ? 'tag-minor' :
                     cat === 'TANAR' ? 'tag-tanar' :
                     cat === 'BATRAN' ? 'tag-batran' : 'tag-major';
    tag.innerHTML = `<span class="tag ${catClass}">${cat}</span> <small>${a.y} ani, ${a.m} luni, ${a.d} zile</small>`;
}

/**
 * Adaugă un rând pentru perioadă dedusă.
 */
function addDedRow() {
    const container = document.getElementById('deductionsContainer');
    if (!container) return;
    const r = document.createElement('div');
    r.className = 'period-row deduction-row';
    r.setAttribute('role', 'listitem');
    r.innerHTML = `
        <div><label>Început</label><input type="text" class="ded-start date-masked" placeholder="zz.ll.aaaa"></div>
        <div><label>Sfârșit</label><input type="text" class="ded-end date-masked" placeholder="zz.ll.aaaa"></div>
        <div style="min-width:50px;"><label>Zile</label><input type="text" class="ded-days" readonly style="background:rgba(0,0,0,0.2);font-weight:600;" tabindex="-1"></div>
        <button class="btn btn-danger btn-sm" onclick="this.closest('.period-row').remove();" aria-label="Șterge rândul">X</button>
    `;
    container.appendChild(r);
    r.querySelector('.ded-start')?.addEventListener('input', () => updDed(r));
    r.querySelector('.ded-end')?.addEventListener('input', () => updDed(r));
}

/**
 * Actualizează numărul de zile pentru un rând de deducere.
 */
function updDed(r) {
    const s = r.querySelector('.ded-start')?.value.trim() || '';
    const e = r.querySelector('.ded-end')?.value.trim() || '';
    const f = r.querySelector('.ded-days');
    if (!f) return;
    if (s && e) {
        const a = parseDate(s);
        const b = parseDate(e);
        f.value = (a && b && b >= a) ? daysBetween(a, b) + 1 : 'Eroare';
    } else {
        f.value = '';
    }
}

/**
 * Adaugă un rând pentru recurs compensatoriu.
 */
function addManDedRow() {
    const container = document.getElementById('manualDeductionsContainer');
    if (!container) return;
    const r = document.createElement('div');
    r.className = 'period-row';
    r.setAttribute('role', 'listitem');
    r.innerHTML = `
        <div style="flex:2;"><label>Zile (Legea 169/2017)</label><input type="number" class="manual-days" value="0" min="0"></div>
        <div style="flex:1;"><button class="btn btn-danger btn-sm" onclick="this.closest('.period-row').remove();" aria-label="Șterge rândul">X</button></div>
    `;
    container.appendChild(r);
}

/**
 * Adaugă un rând pentru perioadă adăugată.
 */
function addNonExecRow() {
    const container = document.getElementById('nonExecContainer');
    if (!container) return;
    const r = document.createElement('div');
    r.className = 'period-row non-exec-row';
    r.setAttribute('role', 'listitem');
    r.innerHTML = `
        <div><label>Tip</label><select class="ne-type">
            <option value="escape">Evadare</option>
            <option value="illness">Boală</option>
            <option value="interruption">Întrerupere</option>
        </select></div>
        <div><label>Data început</label><input type="text" class="ne-start date-masked" placeholder="zz.ll.aaaa"></div>
        <div><label>Data final</label><input type="text" class="ne-end date-masked" placeholder="zz.ll.aaaa"></div>
        <div style="min-width:50px;"><label>Zile</label><input type="text" class="ne-days" readonly style="background:rgba(255,0,0,0.1);font-weight:600;color:#ff6b6b;" tabindex="-1"></div>
        <button class="btn btn-danger btn-sm" onclick="this.closest('.period-row').remove();" aria-label="Șterge rândul">X</button>
    `;
    container.appendChild(r);
    r.querySelector('.ne-start')?.addEventListener('input', () => updNonExec(r));
    r.querySelector('.ne-end')?.addEventListener('input', () => updNonExec(r));
    r.querySelector('.ne-type')?.addEventListener('change', () => updNonExec(r));
}

/**
 * Actualizează numărul de zile pentru un rând de perioadă adăugată.
 */
function updNonExec(r) {
    const s = r.querySelector('.ne-start')?.value.trim() || '';
    const e = r.querySelector('.ne-end')?.value.trim() || '';
    const typ = r.querySelector('.ne-type')?.value || 'escape';
    const f = r.querySelector('.ne-days');
    if (!f) return;
    if (s && e) {
        const a = parseDate(s);
        const b = parseDate(e);
        if (a && b && b > a) {
            const diff = daysBetween(a, b);
            f.value = (typ === 'interruption') ? diff - 1 : diff;
        } else {
            f.value = 'Eroare';
        }
    } else {
        f.value = '';
    }
}

/**
 * Confirmă resetarea și apoi resetează toate câmpurile.
 */
function confirmReset() {
    if (confirm('Sigur doriți să resetați toate câmpurile?')) resetAll();
}

/**
 * Resetează toate câmpurile formularului și rezultatele.
 */
function resetAll() {
    if (sexToggle) {
        currentSex = 'M';
        sexToggle.checked = true;
        updateSexUI();
    }
    const ids = [
        'birthDate', 'observations', 'liberationArticle', 'lifeSentence',
        'durYears', 'durMonths', 'durDays', 'startDate', 'conditionalReleaseDate',
        'masuriRefDate', 'masuriDays', 'masuriResult'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') el.checked = false;
            else if (el.type === 'number') el.value = 0;
            else el.value = '';
        }
    });
    const containers = ['deductionsContainer', 'manualDeductionsContainer', 'nonExecContainer'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    const lifeSentence = document.getElementById('lifeSentence');
    if (lifeSentence) {
        lifeSentence.checked = false;
        const sentenceDuration = document.getElementById('sentenceDuration');
        if (sentenceDuration) sentenceDuration.classList.remove('hidden');
    }
    const resultsCard = document.getElementById('resultsCard');
    if (resultsCard) resultsCard.classList.add('hidden');
    const ageTag = document.getElementById('ageTag');
    if (ageTag) ageTag.innerHTML = '';
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) errorContainer.classList.remove('visible');
    localStorage.removeItem('anpLastCase');
    if (typeof calcMasuriPreventive === 'function') calcMasuriPreventive();
}

/**
 * Afișează sau ascunde pașii de calcul.
 */
function toggleSteps() {
    const container = document.getElementById('stepsContainer');
    const btn = document.getElementById('toggleStepsBtn');
    if (!container || !btn) return;
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        btn.innerHTML = 'ASCUNDE PAȘII CALCULULUI';
        btn.setAttribute('aria-expanded', 'true');
    } else {
        container.classList.add('hidden');
        btn.innerHTML = 'AFIȘEAZĂ PAȘII CALCULULUI';
        btn.setAttribute('aria-expanded', 'false');
    }
}

/**
 * Deschide modalul cu informații și ghid de utilizare detaliat.
 */
function openInfoModal() {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'info-title');
    overlay.innerHTML = `
        <div class="modal">
            <h4 id="info-title">INFORMAȚII ȘI GHID DE UTILIZARE</h4>
            <div style="font-size:0.85rem;color:var(--text-light);line-height:1.6;">
                <p><strong>Scopul aplicației</strong><br>
                Aplicația permite calculul termenelor pedepselor privative de libertate, al liberării condiționate,
                al perioadelor deduse și adăugate, precum și al recursului compensatoriu prevăzut de Legea nr. 169/2017.</p>

                <p><strong>Instrumente disponibile</strong><br>
                Prin meniul principal (butonul ☰) se pot accesa:
                <br>• <strong>Calculator termene pedepse privative de libertate</strong> – pagina principală;
                <br>• <strong>Calculator termene procedurale</strong> – pentru termenele prevăzute de Codul de procedură penală;
                <br>• <strong>Calculator pedeapsă rezultantă</strong> – pentru contopiri, recidivă și revocare rest.</p>

                <p><strong>Mod de utilizare</strong><br>
                1. Completați secțiunea „DATE GENERALE PPL” (sexul, data nașterii, observații).<br>
                2. Introduceți datele pedepsei în secțiunea „DETALII PEDEAPSĂ PPL”.<br>
                3. Adăugați perioadele deduse, recursul compensatoriu și perioadele adăugate, după caz.<br>
                4. Opțional, completați data liberării condiționate și prelungirile măsurilor preventive.<br>
                5. Apăsați „CALCULEAZĂ”.<br>
                6. Rezultatele vor afișa: expirarea teoretică și reală, zilele deduse/adăugate,
                   fracțiile de liberare condiționată, termenul de reanalizare 1/5 și cronologia termenelor.<br>
                7. Folosiți butoanele „COPIAZĂ REZULTATELE” sau „EXPORTĂ PDF” pentru a păstra datele.</p>

                <p><strong>Reguli de calcul importante</strong><br>
                • Ziua de început și ziua de sfârșit sunt incluse în durata pedepsei (art. 22 din OMJ 2188/C/2022).<br>
                • Luna și anul se consideră împlinite cu o zi înainte de ziua corespunzătoare.<br>
                • Fracțiile de liberare condiționată se calculează prin rotunjire în jos (Math.floor),
                  în defavoarea condamnatului, conform Codului penal.<br>
                • Perioadele deduse se scad, iar perioadele adăugate (evadare, boală provocată voit, întrerupere) se adaugă la durata pedepsei.</p>

                <p><strong>Confidențialitate</strong><br>
                Toate datele sunt stocate exclusiv local, în browserul utilizatorului (localStorage) și nu sunt transmise către servere externe.</p>
            </div>
            <button class="btn btn-outline close-btn" onclick="this.closest('.modal-overlay').remove()">Închide</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

/**
 * Deschide modalul cu bazele legale (OMJ 2188/C/2022).
 */
function openLegalModal() {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'legal-title');

    let html = '<div class="modal"><h4 id="legal-title">OMJ 2188/C/2022</h4>';
    html += '<div style="max-height: 70vh; overflow-y: auto;">';

    if (typeof legalArticles !== 'undefined' && legalArticles.length > 0) {
        legalArticles.forEach(article => {
            html += `<div style="margin-bottom:12px; padding:10px; background:rgba(201,162,39,0.05); border-left:3px solid var(--gold); border-radius:8px;">`;
            html += `<strong style="color:var(--gold-light);">${article.titlu}</strong><br>`;
            html += `<span style="font-size:0.8rem; color:var(--text-light);">${article.text.replace(/\n/g, '<br>')}</span>`;
            html += `<br><em style="font-size:0.75rem; color:var(--text-light);">Aplicare: ${article.aplicare}</em>`;
            html += `</div>`;
        });
    } else {
        html += '<p style="font-size:0.85rem;color:var(--text-light);">Baza legală nu a fost încărcată. Verificați fișierul legal.js.</p>';
    }

    html += '</div>';
    html += '<button class="btn btn-outline close-btn" onclick="this.closest(\'.modal-overlay\').remove()">Închide</button></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

/**
 * Deschide modalul de încărcare a spețelor salvate.
 */
function openLoadModal() {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const cases = getCases();
    const names = Object.keys(cases);
    if (names.length === 0) {
        alert('Nicio speță salvată.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    let html = '<div class="modal"><h4 id="modal-title">Selectează sau șterge o speță</h4>';
    html += '<p style="font-size:0.8rem;color:var(--text-light);margin-bottom:8px;">Click pe speță pentru a o încărca.</p>';
    html += '<ul role="listbox">';
    names.forEach(name => {
        const safeName = name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        html += `<li role="option" tabindex="0">
            <span onclick="window.loadCaseByName('${safeName}')" role="button" tabindex="0">${name}</span>
            <div style="display:flex;gap:4px;">
                <button onclick="window.renameCase('${safeName}')" aria-label="Redenumește speța ${name}" style="background:transparent;border:1px solid var(--primary);color:var(--gold-light);border-radius:8px;padding:6px 8px;cursor:pointer;font-size:0.7rem;">Edit</button>
                <button onclick="window.deleteCase('${safeName}')" aria-label="Șterge speța ${name}">X</button>
            </div>
        </li>`;
    });
    html += '</ul><button class="btn btn-outline close-btn" onclick="this.closest(\'.modal-overlay\').remove()" aria-label="Închide fereastra">Închide</button></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

/**
 * Formatează o dată cu avertisment vizual (expirat/curând).
 */
function formatDateWithWarning(date) {
    if (!date || isNaN(date)) return fmtDate(date);
    const t = today();
    const diff = daysBetween(t, date);
    let warning = '';
    if (diff < 0) warning = ' <span class="result-warning expired">(Atenție, a expirat)</span>';
    else if (diff <= 30) warning = ' <span class="result-warning soon">(Atenție)</span>';
    return `${fmtDate(date)}${warning}`;
}
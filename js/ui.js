// ========== INTERFAȚĂ UTILIZATOR (DOM) ==========

// Variabila globală pentru sexul curent (M/F)
let currentSex = 'M';

// Referințe către elementele DOM pentru toggle-ul de sex
const sexToggle = document.getElementById('sexToggle');
const sexLabelM = document.getElementById('sexLabelM');
const sexLabelF = document.getElementById('sexLabelF');

/**
 * Actualizează interfața pentru selectarea sexului.
 * Setează variabila globală currentSex și evidențiază eticheta corespunzătoare.
 */
function updateSexUI() {
    if (sexToggle.checked) {
        currentSex = 'M';
        sexLabelM.classList.add('active');
        sexLabelF.classList.remove('active');
    } else {
        currentSex = 'F';
        sexLabelF.classList.add('active');
        sexLabelM.classList.remove('active');
    }
    updAgeTag();
}

/**
 * Aplică masca pentru câmpurile de dată (zz.ll.aaaa).
 * @param {Event} e - evenimentul input
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
 * @param {string} inputId - id-ul input-ului
 */
function setToday(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.value = fmtDate(today());
}

/**
 * Actualizează eticheta de vârstă și categorie.
 * Afișează vârsta exactă și categoria (MINOR, TANAR, MAJOR, BATRAN).
 */
function updAgeTag() {
    const b = document.getElementById('birthDate').value.trim();
    const tag = document.getElementById('ageTag');
    if (!b) {
        tag.innerHTML = '';
        return;
    }
    const bd = parseDate(b);
    if (!bd) {
        tag.innerHTML = '<small>Format invalid</small>';
        return;
    }
    const a = ageExact(bd, today());
    const articleValue = document.getElementById('liberationArticle').value;
    const cat = getAgeCategoryAtDate(bd, today(), currentSex, articleValue);
    const catClass = cat === 'MINOR' ? 'tag-minor' :
                     cat === 'TANAR' ? 'tag-tanar' :
                     cat === 'BATRAN' ? 'tag-batran' : 'tag-major';
    tag.innerHTML = `<span class="tag ${catClass}">${cat}</span> <small>${a.y} ani, ${a.m} luni, ${a.d} zile</small>`;
}

/**
 * Adaugă un rând pentru perioadă dedusă.
 * Creează elemente cu clasele și atributele necesare.
 */
function addDedRow() {
    const r = document.createElement('div');
    r.className = 'period-row deduction-row';
    r.setAttribute('role', 'listitem');
    r.innerHTML = `
        <div><label>Început</label><input type="text" class="ded-start date-masked" placeholder="zz.ll.aaaa"></div>
        <div><label>Sfârșit</label><input type="text" class="ded-end date-masked" placeholder="zz.ll.aaaa"></div>
        <div style="min-width:50px;"><label>Zile</label><input type="text" class="ded-days" readonly style="background:rgba(0,0,0,0.2);font-weight:600;" tabindex="-1"></div>
        <button class="btn btn-danger btn-sm" onclick="this.closest('.period-row').remove();" aria-label="Șterge rândul">X</button>
    `;
    document.getElementById('deductionsContainer').appendChild(r);
    r.querySelector('.ded-start').addEventListener('input', () => updDed(r));
    r.querySelector('.ded-end').addEventListener('input', () => updDed(r));
}

/**
 * Actualizează numărul de zile pentru un rând de deducere.
 * @param {HTMLElement} r - rândul perioadei
 */
function updDed(r) {
    const s = r.querySelector('.ded-start').value.trim();
    const e = r.querySelector('.ded-end').value.trim();
    const f = r.querySelector('.ded-days');
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
    const r = document.createElement('div');
    r.className = 'period-row';
    r.setAttribute('role', 'listitem');
    r.innerHTML = `
        <div style="flex:2;"><label>Zile (Legea 169/2017)</label><input type="number" class="manual-days" value="0" min="0"></div>
        <div style="flex:1;"><button class="btn btn-danger btn-sm" onclick="this.closest('.period-row').remove();" aria-label="Șterge rândul">X</button></div>
    `;
    document.getElementById('manualDeductionsContainer').appendChild(r);
}

/**
 * Adaugă un rând pentru perioadă adăugată.
 */
function addNonExecRow() {
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
    document.getElementById('nonExecContainer').appendChild(r);
    r.querySelector('.ne-start').addEventListener('input', () => updNonExec(r));
    r.querySelector('.ne-end').addEventListener('input', () => updNonExec(r));
    r.querySelector('.ne-type').addEventListener('change', () => updNonExec(r));
}

/**
 * Actualizează numărul de zile pentru un rând de perioadă adăugată.
 * @param {HTMLElement} r - rândul perioadei
 */
function updNonExec(r) {
    const s = r.querySelector('.ne-start').value.trim();
    const e = r.querySelector('.ne-end').value.trim();
    const typ = r.querySelector('.ne-type').value;
    const f = r.querySelector('.ne-days');
    if (s && e) {
        const a = parseDate(s);
        const b = parseDate(e);
        if (a && b && b > a) {
            const diff = daysBetween(a, b);
            if (typ === 'interruption') f.value = diff - 1;
            else f.value = diff;
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
    currentSex = 'M';
    sexToggle.checked = true;
    updateSexUI();

    document.getElementById('birthDate').value = '';
    document.getElementById('observations').value = '';
    document.getElementById('liberationArticle').value = '';
    document.getElementById('lifeSentence').checked = false;
    document.getElementById('sentenceDuration').classList.remove('hidden');
    document.getElementById('durYears').value = 0;
    document.getElementById('durMonths').value = 0;
    document.getElementById('durDays').value = 0;
    document.getElementById('startDate').value = '';
    document.getElementById('conditionalReleaseDate').value = '';
    document.getElementById('deductionsContainer').innerHTML = '';
    document.getElementById('manualDeductionsContainer').innerHTML = '';
    document.getElementById('nonExecContainer').innerHTML = '';
    document.getElementById('masuriRefDate').value = '';
    document.getElementById('masuriDays').value = 0;
    document.getElementById('masuriResult').value = '';
    document.getElementById('resultsCard').classList.add('hidden');
    document.getElementById('ageTag').innerHTML = '';
    document.getElementById('errorContainer').classList.remove('visible');
    localStorage.removeItem('anpLastCase');
    calcMasuriPreventive();
}

/**
 * Afișează sau ascunde pașii de calcul.
 */
function toggleSteps() {
    const container = document.getElementById('stepsContainer');
    const btn = document.getElementById('toggleStepsBtn');
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
 * Butonul de închidere este plasat în colțul din dreapta sus.
 */
function openInfoModal() {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'info-title');

    let html = '<div class="modal" style="display:flex; flex-direction:column; max-height:80vh;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">';
    html += '<h4 id="info-title" style="margin:0;">GHID DE UTILIZARE</h4>';
    html += '<button class="btn btn-outline btn-sm close-btn" onclick="this.closest(\'.modal-overlay\').remove()" style="flex-shrink:0;">Închide</button>';
    html += '</div>';
    html += '<div style="flex:1; overflow-y:auto;">';

    html += `
        <div style="font-size:0.85rem;color:var(--text-light);line-height:1.6;">
            <p><strong>1. DATE GENERALE PPL</strong><br>
            - <strong>Sex:</strong> alegeți Masculin/Feminin. Implicit este MASCULIN.<br>
            - <strong>Data nașterii:</strong> format zz.ll.aaaa.<br>
            - <strong>Observații:</strong> opțional, note pentru speță.</p>

            <p><strong>2. DETALII PEDEAPSĂ PPL</strong><br>
            - <strong>Articol liberare condiționată:</strong> selectați articolul corespunzător (NCP sau VCP).<br>
            - <strong>Detențiune pe viață:</strong> bifați doar dacă este cazul.<br>
            - <strong>Ani/Luni/Zile:</strong> durata totală a pedepsei.<br>
            - <strong>Data începerii executării:</strong> prima zi de executare. Butonul AZI completează automat.</p>

            <p><strong>3. PERIOADE DEDUSE</strong><br>
            - Adăugați perioadele care se scad (arest preventiv, reținere, arest la domiciliu etc.).<br>
            - Calcul: zile = data_sfârșit − data_început + 1 (capete incluse).<br>
            - Dacă perioadele se suprapun, acestea sunt unificate automat.</p>

            <p><strong>4. RECURS COMPENSATORIU (Legea 169/2017)</strong><br>
            - Introduceți direct numărul de zile deduse, conform legii.</p>

            <p><strong>5. PERIOADE ADĂUGATE</strong><br>
            - <strong>Evadare/boală:</strong> zile = data_final − data_inițial (capete excluse).<br>
            - <strong>Întrerupere:</strong> zile = data_final − data_inițial − 1.<br>
            Aceste zile se adaugă la pedeapsă.</p>

            <p><strong>6. CALCUL REST RĂMAS DE EXECUTAT</strong><br>
            - Opțional: data liberării condiționate pentru calculul restului rămas.</p>

            <p><strong>PRELUNGIRI MĂSURI PREVENTIVE</strong><br>
            - Opțional: dată de referință și număr de zile.<br>
            - Calcul: prima zi este chiar data de referință. Rezultatul este afișat live.</p>

            <p><strong>REZULTATE</strong><br>
            - După apăsarea „CALCULEAZĂ”, obțineți expirările, fracțiunile, datele corespunzătoare, pașii de calcul și cronologia termenelor.<br>
            - Puteți scădea zile muncite din data propozabilă direct în rezultate.<br>
            - Exportați PDF sau copiați rezultatele.</p>

            <hr style="border-color:var(--border);margin:12px 0;">
            <p style="font-size:0.8rem;color:var(--text-light);"><strong>Confidențialitate și securitate</strong><br>
            Toate datele introduse sunt stocate exclusiv în browserul utilizatorului (localStorage) și nu sunt transmise către nicio bază de date externă sau server. Nu se operează date cu caracter personal. Acest calculator are rol strict informativ și nu înlocuiește evidența oficială.</p>
        </div>
    `;

    html += '</div></div>';

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

/**
 * Deschide modalul cu bazele legale (OMJ 2188/C/2022).
 * Butonul de închidere este plasat în colțul din dreapta sus.
 */
function openLegalModal() {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'legal-title');

    let html = '<div class="modal" style="display:flex; flex-direction:column; max-height:80vh;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">';
    html += '<h4 id="legal-title" style="margin:0;">BAZA LEGALA (OMJ 2188/C/2022)</h4>';
    html += '<button class="btn btn-outline btn-sm close-btn" onclick="this.closest(\'.modal-overlay\').remove()" style="flex-shrink:0;">Închide</button>';
    html += '</div>';
    html += '<div style="flex:1; overflow-y:auto;">';

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

    html += '</div></div>';

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
    setTimeout(() => {
        const first = overlay.querySelector('li[role="option"]');
        if (first) first.focus();
    }, 100);
}

/**
 * Formatează o dată cu avertisment vizual (expirat/curând).
 * @param {Date} date - data
 * @returns {string} - HTML cu data și avertisment
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

let modalReturnFocus = null;
function closeModal(overlay) {
    if (!overlay) return;
    overlay.remove();
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus();
    modalReturnFocus = null;
}
function mountAccessibleModal(overlay) {
    modalReturnFocus = document.activeElement;
    document.body.appendChild(overlay);
    const getFocusable = () => Array.from(overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && el.offsetParent !== null);
    const focusable = getFocusable();
    (focusable[0] || overlay).focus?.();
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
    overlay.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); closeModal(overlay); return; }
        if (e.key !== 'Tab') return;
        const items = getFocusable();
        if (!items.length) { e.preventDefault(); return; }
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    overlay.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', () => closeModal(overlay)));
}

// ========== INTERFAȚĂ UTILIZATOR (DOM) ==========

let currentSex = 'M';
const sexToggle = document.getElementById('sexToggle');
const sexLabelM = document.getElementById('sexLabelM');
const sexLabelF = document.getElementById('sexLabelF');

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
    if (typeof updAgeTag === 'function') updAgeTag();
}

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

function setToday(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.value = fmtDate(today());
}

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

function addNonExecRow() {
    const container = document.getElementById('nonExecContainer');
    if (!container) return;
    const r = document.createElement('div');
    r.className = 'period-row non-exec-row';
    r.setAttribute('role', 'listitem');
    r.innerHTML = `
        <div><label>Tip</label><select class="ne-type">
            <option value="escape">Evadare</option>
            <option value="illness">Boală provocată voit (hotărâre definitivă)</option>
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
            const effective = getNonExecEffectiveInterval(typ, a, b);
            f.value = effective ? daysBetween(effective[0], effective[1]) + 1 : 0;
        } else {
            f.value = 'Eroare';
        }
    } else {
        f.value = '';
    }
}

function confirmReset() {
    if (confirm('Sigur doriți să resetați toate câmpurile?')) resetAll();
}

function resetAll() {
    if (sexToggle) {
        currentSex = 'M';
        sexToggle.checked = true;
        updateSexUI();
    }
    const ids = [
        'birthDate', 'observations', 'liberationArticle', 'lifeSentence',
        'durYears', 'durMonths', 'durDays', 'startDate', 'prisonReceivedDate', 'conditionalReleaseDate',
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
    const article = document.getElementById('liberationArticle');
    if (article) article.disabled = false;
    const resultsCard = document.getElementById('resultsCard');
    if (resultsCard) resultsCard.classList.add('hidden');
    const ageTag = document.getElementById('ageTag');
    if (ageTag) ageTag.innerHTML = '';
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) errorContainer.classList.remove('visible');
    localStorage.removeItem('anpLastCase');
    if (typeof calcMasuriPreventive === 'function') calcMasuriPreventive();
}

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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 id="info-title" style="margin:0;">INFORMAȚII ȘI GHID DE UTILIZARE</h4>
                <button class="btn btn-outline btn-sm close-btn" style="flex-shrink:0;">Închide</button>
            </div>
            <div style="font-size:0.85rem;color:var(--text-light);line-height:1.6;">
                <p><strong>Scopul aplicației</strong><br>
                Aplicația calculează termenele pedepselor privative de libertate, fracțiile utilizate în vederea liberării condiționate, perioadele deduse și perioadele care nu se consideră executate.</p>

                <p><strong>Configurații LC</strong><br>
                Matricea de fracții reproduce configurațiile operaționale IMSweb ANP introduse în motor, inclusiv regulile VCP și configurațiile anterioare Legii nr. 140/1996. Valoarea 1/100 este păstrată ca parametru tehnic IMSweb acolo unde apare în matricea oficială.</p>

                <p><strong>Mod de utilizare</strong><br>
                1. Completați sexul și data nașterii.<br>
                2. Selectați articolul/configurația IMSweb și introduceți durata și data începerii executării.<br>
                3. Introduceți separat data primirii în penitenciar/centru numai dacă doriți calcularea carantinei de 21 zile.<br>
                4. Adăugați deducerile, zilele de recurs compensatoriu și perioadele neexecutate, după caz.<br>
                5. Apăsați „CALCULEAZĂ”.</p>

                <p><strong>Reguli de calcul importante</strong><br>
                • Ziua de început și ziua de sfârșit sunt incluse în durata pedepsei.<br>
                • Luna și anul se consideră împlinite cu o zi înainte de ziua corespunzătoare.<br>
                • La fracțiile LC se utilizează cifra întreagă rezultată; partea zecimală nu se ridică la următoarea zi.<br>
                • Deducerile influențează data împlinirii fracției, nu baza procentuală a fracției.<br>
                • La schimbarea regimului favorabil de vârstă, zilele considerate executate nu pot deplasa termenul înaintea zilei în care pragul de vârstă a fost împlinit.<br>
                • Fracția de 1/5 pentru schimbarea regimului nu este aplicată automat măsurilor educative NCP art. 124/125.<br>
                • Boala provocată voit se introduce numai în situația juridică în care există hotărârea definitivă necesară.</p>

                <p><strong>Confidențialitate</strong><br>
                Datele salvate de funcția de spețe sunt păstrate în localStorage-ul browserului.</p>
            </div>
        </div>
    `;
    mountAccessibleModal(overlay);
}

function openLegalModal() {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'legal-title');

    let html = `
        <div class="modal">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 id="legal-title" style="margin:0;">OMJ 2188/C/2022</h4>
                <button class="btn btn-outline btn-sm close-btn" style="flex-shrink:0;">Închide</button>
            </div>
            <div style="max-height:70vh; overflow-y:auto;">
    `;

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

    html += `</div></div>`;
    overlay.innerHTML = html;
    mountAccessibleModal(overlay);
}

function openLoadModal() {
    const existingOverlay = document.querySelector('.modal-overlay');
    if (existingOverlay) closeModal(existingOverlay);
    const cases = getCases();
    const names = Object.keys(cases);
    if (names.length === 0) { alert('Nicio speță salvată.'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');
    overlay.tabIndex = -1;

    const modal = document.createElement('div'); modal.className = 'modal';
    const title = document.createElement('h4'); title.id = 'modal-title'; title.textContent = 'Selectează sau șterge o speță'; modal.appendChild(title);
    const help = document.createElement('p'); help.className = 'help-text'; help.textContent = 'Selectează speța pentru a o încărca.'; modal.appendChild(help);
    const list = document.createElement('ul'); list.setAttribute('role', 'list');
    names.forEach(name => {
        const li = document.createElement('li'); li.className = 'saved-case-row';
        const load = document.createElement('button'); load.type = 'button'; load.className = 'saved-case-name'; load.textContent = name; load.addEventListener('click', () => window.loadCaseByName(name));
        const actions = document.createElement('div'); actions.className = 'saved-case-actions';
        const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'btn btn-outline btn-sm'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', `Redenumește speța ${name}`); edit.addEventListener('click', () => window.renameCase(name));
        const del = document.createElement('button'); del.type = 'button'; del.className = 'btn btn-danger btn-sm'; del.textContent = 'X'; del.setAttribute('aria-label', `Șterge speța ${name}`); del.addEventListener('click', () => window.deleteCase(name));
        actions.append(edit, del); li.append(load, actions); list.appendChild(li);
    });
    modal.appendChild(list);
    const close = document.createElement('button'); close.type = 'button'; close.className = 'btn btn-outline close-btn'; close.textContent = 'Închide'; modal.appendChild(close);
    overlay.appendChild(modal);
    mountAccessibleModal(overlay);
}

function formatDateWithWarning(date) {
    if (!date || isNaN(date)) return fmtDate(date);
    const t = today();
    const diff = daysBetween(t, date);
    let warning = '';
    if (diff < 0) warning = ' <span class="result-warning expired">(Atenție, a expirat)</span>';
    else if (diff <= 30) warning = ' <span class="result-warning soon">(Atenție)</span>';
    return `${fmtDate(date)}${warning}`;
}

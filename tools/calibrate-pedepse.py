from pathlib import Path
import re, json


def read(path): return Path(path).read_text(encoding='utf-8')
def write(path, text): Path(path).write_text(text, encoding='utf-8')
def must_replace(text, old, new, label):
    if old not in text: raise SystemExit(f'Missing replacement target: {label}')
    return text.replace(old, new, 1)

# --- rules.js: calibrated LC scheduling + overlap-safe non-executed periods ---
p='js/rules.js'; s=read(p)
marker='// ========== CALIBRARE OPERAȚIONALĂ LC 2026 =========='
if marker not in s:
    s += r'''

// ========== CALIBRARE OPERAȚIONALĂ LC 2026 ==========
// Tabel operațional furnizat: plafon 20 ani = 7.305 zile; schimbarea fracțiilor NCP art. 100 se produce la împlinirea efectivă a vârstei de 60 ani.
const LC_TWENTY_YEAR_CAP_DAYS = 7305;

function thresholdDate(startDate, thresholdDays, dedDays = 0, nonExecDays = 0) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.max(0, thresholdDays) - 1 - dedDays + nonExecDays);
    return d;
}

function sixtiethBirthday(birthDate) {
    const d = new Date(birthDate);
    const month = d.getMonth(), day = d.getDate();
    d.setDate(1);
    d.setFullYear(d.getFullYear() + 60);
    d.setMonth(month);
    d.setDate(Math.min(day, new Date(d.getFullYear(), month + 1, 0).getDate()));
    return d;
}

function cappedFractionDays(totalDays, ratio, cap = Infinity) {
    return Math.min(Math.floor(totalDays * ratio), cap);
}

function resolveAgeTransitionThreshold(startDate, birthday60, youngDays, elderDays, dedDays, nonExecDays) {
    const youngDate = thresholdDate(startDate, youngDays, dedDays, nonExecDays);
    const elderDate = thresholdDate(startDate, elderDays, dedDays, nonExecDays);
    if (startDate >= birthday60) return { date: elderDate, days: elderDays, usedElderlyRule: true, transitionApplied: false };
    if (youngDate < birthday60) return { date: youngDate, days: youngDays, usedElderlyRule: false, transitionApplied: false };
    return {
        date: elderDate < birthday60 ? new Date(birthday60) : elderDate,
        days: elderDays,
        usedElderlyRule: true,
        transitionApplied: true
    };
}

function calculateLiberationSchedule({ life, art, sentenceOver10, totalDays, birthDate, startDate, currentSex, theorExp, dedDays = 0, nonExecDays = 0 }) {
    if (life) {
        const date = thresholdDate(startDate, LC_TWENTY_YEAR_CAP_DAYS, dedDays, nonExecDays);
        return {
            mR: 1/2, tR: 1/2,
            mDays: LC_TWENTY_YEAR_CAP_DAYS, tDays: LC_TWENTY_YEAR_CAP_DAYS,
            mDate: date, tDate: new Date(date),
            pM: LC_TWENTY_YEAR_CAP_DAYS, pT: LC_TWENTY_YEAR_CAP_DAYS,
            articleInfo: 'NCP art. 99 (detențiune pe viață — prag efectiv 20 ani / 7.305 zile)',
            lifeThreshold: true, ageTransitionApplied: false
        };
    }

    if (art === 'NCP100') {
        const youngMR = sentenceOver10 ? 2/3 : 1/2;
        const youngTR = sentenceOver10 ? 3/4 : 2/3;
        const elderMR = sentenceOver10 ? 1/2 : 1/3;
        const elderTR = sentenceOver10 ? 2/3 : 1/2;
        const cap = sentenceOver10 ? LC_TWENTY_YEAR_CAP_DAYS : Infinity;
        const birthday60 = sixtiethBirthday(birthDate);
        const m = resolveAgeTransitionThreshold(startDate, birthday60,
            cappedFractionDays(totalDays, youngMR, cap), cappedFractionDays(totalDays, elderMR, cap), dedDays, nonExecDays);
        const t = resolveAgeTransitionThreshold(startDate, birthday60,
            cappedFractionDays(totalDays, youngTR, cap), cappedFractionDays(totalDays, elderTR, cap), dedDays, nonExecDays);
        const usedElder = m.usedElderlyRule || t.usedElderlyRule;
        return {
            mR: m.usedElderlyRule ? elderMR : youngMR,
            tR: t.usedElderlyRule ? elderTR : youngTR,
            mDays: m.days, tDays: t.days, mDate: m.date, tDate: t.date,
            pM: cap, pT: cap,
            birthday60,
            ageTransitionApplied: m.transitionApplied || t.transitionApplied,
            articleInfo: `NCP art. 100 (${usedElder ? 'fracții 60+ aplicate de la data împlinirii vârstei' : 'fracții sub 60 ani'}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`
        };
    }

    const referenceDate = theorExp || startDate;
    const ageCategory = getAgeCategoryAtDate(birthDate, referenceDate, currentSex, art);
    const fractions = getLiberationFractions(false, art, ageCategory, sentenceOver10, totalDays, birthDate, theorExp);
    if (fractions.error) return fractions;
    const mDays = cappedFractionDays(totalDays, fractions.mR, fractions.pM);
    const tDays = cappedFractionDays(totalDays, fractions.tR, fractions.pT);
    return {
        ...fractions, mDays, tDays,
        mDate: thresholdDate(startDate, mDays, dedDays, nonExecDays),
        tDate: thresholdDate(startDate, tDays, dedDays, nonExecDays),
        ageTransitionApplied: false
    };
}

function findIntervalOverlaps(intervals) {
    const overlaps = [];
    for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
            const [a1, a2] = intervals[i], [b1, b2] = intervals[j];
            if (a1 <= b2 && b1 <= a2) overlaps.push([i, j]);
        }
    }
    return overlaps;
}

function getNonExecEffectiveInterval(type, start, end) {
    const first = new Date(start), last = new Date(end);
    if (type === 'escape' || type === 'interruption') {
        first.setDate(first.getDate() + 1);
        last.setDate(last.getDate() - 1);
    } else {
        // Păstrează comportamentul existent pentru boală: ziua inițială nu se adaugă, ziua finală se include.
        first.setDate(first.getDate() + 1);
    }
    if (last < first) return null;
    return [first, last];
}

function sumNonExecutedPeriods(rows) {
    const effective = rows.map(r => getNonExecEffectiveInterval(r.type, r.start, r.end)).filter(Boolean);
    return sumIntervals(effective);
}
'''
write(p,s)

# --- app.js ---
p='js/app.js'; s=read(p)
old="""    document.querySelectorAll('.non-exec-row').forEach((r, i) => {
        const st = r.querySelector('.ne-start').value.trim();
        const en = r.querySelector('.ne-end').value.trim();
        if (!st || !en) {
            err.push(`Perioada adăugată ${i + 1}: ambele date sunt obligatorii.`);
        } else {
            const sD = parseDate(st);
            const eD = parseDate(en);
            if (!sD || !eD) err.push(`Perioada adăugată ${i + 1}: format dată invalid.`);
            else if (eD <= sD) err.push(`Perioada adăugată ${i + 1}: data finală trebuie să fie strict după data inițială.`);
        }
    });

    return err;
"""
new=old.replace("\n    return err;", """

    document.querySelectorAll('.manual-days').forEach((input, i) => {
        const value = Number(input.value || 0);
        if (!Number.isSafeInteger(value) || value < 0) err.push(`Recurs compensatoriu ${i + 1}: introduceți un număr întreg pozitiv sau zero.`);
    });

    return err;""")
s=must_replace(s,old,new,'manual deduction validation')

old="""    const steps = [];
    let totalDays, theorExp;

    if (life) {
        const d20 = new Date(startDate);
        d20.setFullYear(d20.getFullYear() + 20);
        d20.setDate(d20.getDate() - 1);
        totalDays = daysBetween(startDate, d20) + 1;
        theorExp = d20;
        steps.push(`Pedepsa este detențiune pe viață. Se folosește plafonul de 20 ani (${totalDays} zile).`);
    } else {
"""
new="""    const steps = [];
    let totalDays, theorExp = null;

    if (life) {
        totalDays = LC_TWENTY_YEAR_CAP_DAYS;
        steps.push(`Detențiune pe viață: nu există expirare teoretică a pedepsei. Pentru liberarea condiționată se aplică direct pragul efectiv de 20 ani / ${LC_TWENTY_YEAR_CAP_DAYS} zile.`);
    } else {
"""
s=must_replace(s,old,new,'life sentence base')

old="""    let ded = sumIntervals(dedIntervals);
    document.querySelectorAll('.manual-days').forEach(i => {
        const v = parseInt(i.value);
        if (!isNaN(v) && v > 0) ded += v;
    });
"""
new="""    const dedOverlapInfo = findIntervalOverlaps(dedIntervals);
    let ded = sumIntervals(dedIntervals);
    document.querySelectorAll('.manual-days').forEach(i => {
        const v = Number(i.value || 0);
        if (Number.isSafeInteger(v) && v > 0) ded += v;
    });
"""
s=must_replace(s,old,new,'deductions total')

old="""    // Perioade adăugate
    let non = 0;
    const nonRowsData = []; // pentru export
    document.querySelectorAll('.non-exec-row').forEach(r => {
        const type = r.querySelector('.ne-type').value;
        const sD = parseDate(r.querySelector('.ne-start').value.trim());
        const eD = parseDate(r.querySelector('.ne-end').value.trim());
        if (sD && eD) {
            const diff = daysBetween(sD, eD);
            let daysToAdd = diff;
            if (type === 'interruption') daysToAdd = diff - 1;
            non += daysToAdd;
            nonRowsData.push({ type, start: fmtDate(sD), end: fmtDate(eD), days: daysToAdd });
        }
    });
    steps.push(`Perioadele adăugate (neexecutate) însumează ${non} zile.`);

    // Expirare reală
    let realExp = new Date(theorExp);
    realExp.setDate(realExp.getDate() - ded + non);
    steps.push(`Expirarea reală = ${fmtDate(theorExp)} − ${ded} zile deduse + ${non} zile adăugate = ${fmtDate(realExp)}.`);

    // Categoria de vârstă la expirare
    const ageAtExpiry = getAgeCategoryAtDate(birthDate, theorExp, currentSex, art);
    steps.push(`La data expirării teoretice, deținutul are categoria de vârstă: ${ageAtExpiry}.`);

    // Fracții liberare condiționată
    const sentenceOver10 = life ? false : (y * 12 + m + d / 30) > 120;
    const fracResult = getLiberationFractions(life, art, ageAtExpiry, sentenceOver10, totalDays, birthDate, theorExp);

    if (fracResult.error) {
        errC.innerHTML = '• ' + fracResult.error;
        errC.classList.add('visible');
        return;
    }

    const { mR, tR, pM, pT, articleInfo } = fracResult;
    steps.push(`Articolul aplicabil: ${articleInfo}.`);
    steps.push(`Fracția minimă obligatorie: ${fracStr(mR)}. Fracția totală/propozabilă: ${fracStr(tR)}.`);

    let mDays = Math.floor(totalDays * mR);
    let tDays = Math.floor(totalDays * tR);
    if (mDays > pM) mDays = pM;
    if (tDays > pT) tDays = pT;

    steps.push(`Fracția minimă: Math.floor(${totalDays} × ${fracStr(mR)}) = ${mDays} zile (din mandatul total). Math.floor rotunjește în jos (în defavoarea condamnatului).`);
    steps.push(`Fracția totală: Math.floor(${totalDays} × ${fracStr(tR)}) = ${tDays} zile (din mandatul total).`);

    // Date fracții
    let mDate = new Date(startDate);
    mDate.setDate(mDate.getDate() + mDays - 1);
    mDate.setDate(mDate.getDate() - ded + non);

    let tDate = new Date(startDate);
    tDate.setDate(tDate.getDate() + tDays - 1);
    tDate.setDate(tDate.getDate() - ded + non);
"""
new="""    // Perioade adăugate; suprapunerile sunt acceptate, semnalate și numărate o singură dată.
    const nonRawRows = [];
    const nonRowsData = [];
    document.querySelectorAll('.non-exec-row').forEach(r => {
        const type = r.querySelector('.ne-type').value;
        const sD = parseDate(r.querySelector('.ne-start').value.trim());
        const eD = parseDate(r.querySelector('.ne-end').value.trim());
        if (sD && eD) {
            nonRawRows.push({ type, start: sD, end: eD });
            const effective = getNonExecEffectiveInterval(type, sD, eD);
            const daysToAdd = effective ? daysBetween(effective[0], effective[1]) + 1 : 0;
            nonRowsData.push({ type, start: fmtDate(sD), end: fmtDate(eD), days: daysToAdd });
        }
    });
    const nonOverlapInfo = findIntervalOverlaps(nonRawRows.map(r => [r.start, r.end]));
    const non = sumNonExecutedPeriods(nonRawRows);
    steps.push(`Perioadele adăugate (neexecutate) însumează ${non} zile după eliminarea dublării zilelor suprapuse.`);

    // Expirare reală există numai pentru pedepsele determinate.
    let realExp = null;
    if (!life) {
        realExp = new Date(theorExp);
        realExp.setDate(realExp.getDate() - ded + non);
        steps.push(`Expirarea reală = ${fmtDate(theorExp)} − ${ded} zile deduse + ${non} zile adăugate = ${fmtDate(realExp)}.`);
    }

    const sentenceOver10 = life ? false : (y * 12 + m + d / 30) > 120;
    const schedule = calculateLiberationSchedule({ life, art, sentenceOver10, totalDays, birthDate, startDate, currentSex, theorExp, dedDays: ded, nonExecDays: non });
    if (schedule.error) {
        errC.innerHTML = '• ' + schedule.error;
        errC.classList.add('visible');
        return;
    }
    const { mR, tR, mDays, tDays, mDate, tDate, articleInfo } = schedule;
    steps.push(`Articolul aplicabil: ${articleInfo}.`);
    if (life) {
        steps.push(`Pragul minim și data propozabilă coincid la ${LC_TWENTY_YEAR_CAP_DAYS} zile efective; zilele muncite nu reduc acest prag.`);
    } else {
        steps.push(`Fracția minimă: ${fracStr(mR)} = ${mDays} zile. Fracția totală/propozabilă: ${fracStr(tR)} = ${tDays} zile.`);
        if (schedule.ageTransitionApplied) steps.push(`La împlinirea vârstei de 60 ani fracțiile se schimbă; noua fracție produce efecte cel mai devreme din chiar ziua împlinirii vârstei.`);
    }
"""
s=must_replace(s,old,new,'nonexec and fraction scheduling')

old="""    // 1/5 mandat
    const fifth = Math.floor(totalDays / 5);
    let fDate = new Date(startDate);
    fDate.setDate(fDate.getDate() + fifth - 1);
    fDate.setDate(fDate.getDate() - ded + non);
"""
new="""    // 1/5 se calculează numai pentru un mandat cu durată determinată.
    const fifth = life ? null : Math.floor(totalDays / 5);
    let fDate = null;
    if (!life) fDate = thresholdDate(startDate, fifth, ded, non);
"""
s=must_replace(s,old,new,'one fifth life handling')

s=s.replace("        { label: 'Termen 1/5', date: fDate },", "        { label: 'Termen 1/5', date: fDate },")
s=must_replace(s,"""    timelineItems.sort((a, b) => a.date - b.date);
""","""    const validTimelineItems = timelineItems.filter(item => item.date instanceof Date && !isNaN(item.date));
    validTimelineItems.sort((a, b) => a.date - b.date);
""",'timeline filtering')
s=must_replace(s,"""    timelineItems.forEach(item => {
""","""    validTimelineItems.forEach(item => {
""",'timeline iteration')

old="""    html += `<div class=\"result-section\"><h4>DETALII MANDAT</h4><div class=\"result-grid\">
        <div class=\"result-item\"><div class=\"result-label\">Expirare teoretică</div><div class=\"result-value\">${formatDateWithWarning(theorExp)}</div></div>
        <div class=\"result-item important\"><div class=\"result-label\">Expirare REALĂ</div><div class=\"result-value\">${formatDateWithWarning(realExp)}</div></div>
        <div class=\"result-item\"><div class=\"result-label\">Zile deduse</div><div class=\"result-value\">${ded} zile</div></div>
        <div class=\"result-item\"><div class=\"result-label\">Zile adăugate (neexecutate)</div><div class=\"result-value\">${non} zile</div></div>
        <div class=\"result-item\"><div class=\"result-label\">Zile calendaristice de la începere</div><div class=\"result-value\">${calendarDaysSinceStart} zile</div></div>
        <div class=\"result-item\"><div class=\"result-label\">Rest rămas</div><div class=\"result-value\">${remaining} zile</div></div>
    </div></div>`;
"""
new="""    html += life
        ? `<div class=\"result-section\"><h4>DETALII PEDEAPSĂ</h4><div class=\"result-grid\">
            <div class=\"result-item important\"><div class=\"result-label\">Detențiune pe viață</div><div class=\"result-value\">Fără dată de expirare. Prag LC: 20 ani / ${LC_TWENTY_YEAR_CAP_DAYS} zile.</div></div>
            <div class=\"result-item\"><div class=\"result-label\">Zile deduse</div><div class=\"result-value\">${ded} zile</div></div>
            <div class=\"result-item\"><div class=\"result-label\">Zile adăugate (neexecutate)</div><div class=\"result-value\">${non} zile</div></div>
            <div class=\"result-item\"><div class=\"result-label\">Zile calendaristice de la începere</div><div class=\"result-value\">${calendarDaysSinceStart} zile</div></div>
        </div></div>`
        : `<div class=\"result-section\"><h4>DETALII MANDAT</h4><div class=\"result-grid\">
            <div class=\"result-item\"><div class=\"result-label\">Expirare teoretică</div><div class=\"result-value\">${formatDateWithWarning(theorExp)}</div></div>
            <div class=\"result-item important\"><div class=\"result-label\">Expirare REALĂ</div><div class=\"result-value\">${formatDateWithWarning(realExp)}</div></div>
            <div class=\"result-item\"><div class=\"result-label\">Zile deduse</div><div class=\"result-value\">${ded} zile</div></div>
            <div class=\"result-item\"><div class=\"result-label\">Zile adăugate (neexecutate)</div><div class=\"result-value\">${non} zile</div></div>
            <div class=\"result-item\"><div class=\"result-label\">Zile calendaristice de la începere</div><div class=\"result-value\">${calendarDaysSinceStart} zile</div></div>
            <div class=\"result-item\"><div class=\"result-label\">Rest rămas</div><div class=\"result-value\">${remaining} zile</div></div>
        </div></div>`;
"""
s=must_replace(s,old,new,'mandate result life')

old="""    html += `<div class=\"result-section\"><h4>FRACȚII LIBERARE CONDIȚIONATĂ</h4><div class=\"result-grid\">
        <div class=\"result-item\">
            <div class=\"result-label\">FRACȚIE MINIMĂ OBLIGATORIE</div>
            <div class=\"result-value\"><span class=\"fraction\">${fracStr(mR)}</span> → (fără deduceri: ${mDays}z / după deduceri și perioade adăugate: ${daysBetween(startDate, mDate) + 1}z)</div>
            <div class=\"result-label\" style=\"margin-top:4px;\">Data</div><div class=\"result-value\">${formatDateWithWarning(mDate)}</div>
        </div>
        <div class=\"result-item\">
            <div class=\"result-label\">DATA PROPOZABILĂ</div>
            <div class=\"result-value\"><span class=\"fraction\">${fracStr(tR)}</span> → (fără deduceri: ${tDays}z / după deduceri și perioade adăugate: ${daysBetween(startDate, tDate) + 1}z)</div>
            <div class=\"result-label\" style=\"margin-top:4px;\">Data</div><div class=\"result-value\">${formatDateWithWarning(tDate)}</div>
        </div>
    </div></div>`;
"""
new="""    html += `<div class=\"result-section\"><h4>FRACȚII LIBERARE CONDIȚIONATĂ</h4><div class=\"result-grid\">
        <div class=\"result-item\">
            <div class=\"result-label\">FRACȚIE MINIMĂ OBLIGATORIE</div>
            <div class=\"result-value\">${life ? `Prag efectiv 20 ani / ${mDays} zile` : `<span class=\"fraction\">${fracStr(mR)}</span> → ${mDays} zile`}</div>
            <div class=\"result-label\" style=\"margin-top:4px;\">Data</div><div class=\"result-value\">${formatDateWithWarning(mDate)}</div>
        </div>
        <div class=\"result-item\">
            <div class=\"result-label\">DATA PROPOZABILĂ</div>
            <div class=\"result-value\">${life ? `Prag efectiv 20 ani / ${tDays} zile` : `<span class=\"fraction\">${fracStr(tR)}</span> → ${tDays} zile`}</div>
            <div class=\"result-label\" style=\"margin-top:4px;\">Data</div><div class=\"result-value\">${formatDateWithWarning(tDate)}</div>
        </div>
    </div></div>`;

    if (dedOverlapInfo.length || nonOverlapInfo.length) {
        html += `<div class=\"result-section overlap-notice\"><h4>INFORMARE SUPRAPUNERI</h4>
            ${dedOverlapInfo.length ? `<p>Există ${dedOverlapInfo.length} suprapunere(i) între perioadele deduse. Zilele comune au fost numărate o singură dată.</p>` : ''}
            ${nonOverlapInfo.length ? `<p>Există ${nonOverlapInfo.length} suprapunere(i) între perioadele adăugate. Zilele comune au fost numărate o singură dată.</p>` : ''}
        </div>`;
    }
"""
s=must_replace(s,old,new,'fraction result and overlaps')

old="""    html += `<div class=\"result-section\"><h4>REANALIZARE 1/5</h4><div class=\"result-grid\">
        <div class=\"result-item\"><div class=\"result-label\">1/5 mandat</div>
            <div class=\"result-value\">(fără deduceri: ${fifth}z / după deduceri și perioade adăugate: ${daysBetween(startDate, fDate) + 1}z)</div>
            <div class=\"result-label\" style=\"margin-top:4px;\">Data împlinirii</div><div class=\"result-value\">${formatDateWithWarning(fDate)}</div>
        </div>
    </div></div>`;
"""
new="""    if (!life) html += `<div class=\"result-section\"><h4>REANALIZARE 1/5</h4><div class=\"result-grid\">
        <div class=\"result-item\"><div class=\"result-label\">1/5 mandat</div>
            <div class=\"result-value\">(fără deduceri: ${fifth}z / după deduceri și perioade adăugate: ${daysBetween(startDate, fDate) + 1}z)</div>
            <div class=\"result-label\" style=\"margin-top:4px;\">Data împlinirii</div><div class=\"result-value\">${formatDateWithWarning(fDate)}</div>
        </div>
    </div></div>`;
"""
s=must_replace(s,old,new,'hide fifth for life')

old="""        <div class=\"result-item\"><div class=\"result-label\">Mandat total</div><div class=\"result-value\">${totalDays} zile</div></div>
"""
new="""        <div class=\"result-item\"><div class=\"result-label\">${life ? 'Prag LC' : 'Mandat total'}</div><div class=\"result-value\">${life ? `20 ani / ${LC_TWENTY_YEAR_CAP_DAYS} zile` : `${totalDays} zile`}</div></div>
"""
s=must_replace(s,old,new,'mandate total label')
write(p,s)

# --- ui.js: evadare and interruption both exclude departure and return dates ---
p='js/ui.js'; s=read(p)
s=must_replace(s,"""            const diff = daysBetween(a, b);
            f.value = (typ === 'interruption') ? diff - 1 : diff;
""","""            const effective = getNonExecEffectiveInterval(typ, a, b);
            f.value = effective ? daysBetween(effective[0], effective[1]) + 1 : 0;
""",'nonexec row preview')
write(p,s)

# --- export.js: life-safe narrative and overlap-safe non total ---
p='js/export.js'; s=read(p)
s=must_replace(s,"""        const realExpStr = fmtDate(calc.realExp);
""","""        const realExpStr = calc.realExp ? fmtDate(calc.realExp) : null;
""",'export real expiry')
s=must_replace(s,"""        const nonTotal = nonRowsData.reduce((sum, p) => sum + p.days, 0);
""","""        const nonTotal = Number.isSafeInteger(calc.non) ? calc.non : nonRowsData.reduce((sum, p) => sum + p.days, 0);
""",'export non union')
s=must_replace(s,"""        const fDateStr = fmtDate(calc.fDate);
        const fifth = calc.fifth;

        // Construiește textul final EXACT conform modelului, fără zile muncite
        return `În această speță, o persoană privată de libertate de sex ${sexText}, născută la ${birthDateStr} este condamnată la pedeapsa inchisorii rezultantă de ${sentence}. Pedeapsa închisorii începe la data de ${startDateStr} și expiră în termen la data de ${realExpStr}, fiind deduse un număr de ${dedPeriodsDays} zile${dedPeriodsDisplay} și adăugate un număr de ${nonTotal} zile${nonPeriodsDisplay}. ${recursText} Conform ${articleText}, fracția propozabilă se împlinește la data de ${tDateStr}, după executarea a ${tDays} zile. Termenul de reanalizare (1/5) este data de ${fDateStr}, după executarea a ${fifth} zile.`;
""","""        const fDateStr = calc.fDate ? fmtDate(calc.fDate) : null;
        const fifth = calc.fifth;

        if (calc.life) {
            return `În această speță, o persoană privată de libertate de sex ${sexText}, născută la ${birthDateStr}, execută pedeapsa detențiunii pe viață începând cu data de ${startDateStr}. Detențiunea pe viață nu are dată de expirare. Au fost deduse ${dedPeriodsDays} zile${dedPeriodsDisplay} și adăugate ${nonTotal} zile${nonPeriodsDisplay}. ${recursText} Conform ${articleText}, pragul efectiv de 20 ani / 7.305 zile pentru liberarea condiționată se împlinește la data de ${tDateStr}.`;
        }
        return `În această speță, o persoană privată de libertate de sex ${sexText}, născută la ${birthDateStr} este condamnată la pedeapsa inchisorii rezultantă de ${sentence}. Pedeapsa închisorii începe la data de ${startDateStr} și expiră în termen la data de ${realExpStr}, fiind deduse un număr de ${dedPeriodsDays} zile${dedPeriodsDisplay} și adăugate un număr de ${nonTotal} zile${nonPeriodsDisplay}. ${recursText} Conform ${articleText}, fracția propozabilă se împlinește la data de ${tDateStr}, după executarea a ${tDays} zile. Termenul de reanalizare (1/5) este data de ${fDateStr}, după executarea a ${fifth} zile.`;
""",'life narrative')
write(p,s)

# --- tests: broaden calculator regression coverage ---
p='tests/run-tests.js'; s=read(p)
insert=r'''
// Calibrare liberare condiționată: art. 99, schimbare la 60 ani, plafoane și suprapuneri.
let lr=load('js/utils.js',';'+fs.readFileSync('js/rules.js','utf8')+';globalThis.__schedule=calculateLiberationSchedule;globalThis.__over=findIntervalOverlaps;globalThis.__non=sumNonExecutedPeriods;');
let lifeStart=new Date(2026,7,29), lifeBirth=new Date(1980,0,1);
let lifeCalc=lr.__schedule({life:true,art:'NCP99',sentenceOver10:false,totalDays:7305,birthDate:lifeBirth,startDate:lifeStart,currentSex:'M',theorExp:null,dedDays:0,nonExecDays:0});
assert.equal(lifeCalc.mDays,7305); assert.equal(lifeCalc.tDays,7305); assert.equal(lifeCalc.mDate.getFullYear(),2046); assert.equal(lifeCalc.mDate.getMonth(),7); assert.equal(lifeCalc.mDate.getDate(),28);
let transitionStart=new Date(2026,0,1), transitionBirth=new Date(1968,0,1), transitionEnd=new Date(2030,11,31);
let transition=lr.__schedule({life:false,art:'NCP100',sentenceOver10:false,totalDays:1826,birthDate:transitionBirth,startDate:transitionStart,currentSex:'M',theorExp:transitionEnd,dedDays:0,nonExecDays:0});
assert.equal(transition.mDate.getFullYear(),2028); assert.equal(transition.mDate.getMonth(),0); assert.equal(transition.mDate.getDate(),1); assert.equal(transition.mR,1/3); assert(transition.ageTransitionApplied);
let already60=lr.__schedule({life:false,art:'NCP100',sentenceOver10:false,totalDays:1095,birthDate:new Date(1960,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2028,11,30),dedDays:0,nonExecDays:0}); assert.equal(already60.mR,1/3); assert.equal(already60.tR,1/2);
let over10=lr.__schedule({life:false,art:'NCP100',sentenceOver10:true,totalDays:9000,birthDate:new Date(1970,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2050,0,1),dedDays:0,nonExecDays:0}); assert(over10.mDays<=7305); assert(over10.tDays<=7305);
let ov=[[new Date(2026,0,1),new Date(2026,0,10)],[new Date(2026,0,5),new Date(2026,0,15)]]; assert.equal(lr.__over(ov).length,1); assert.equal(lr.sumIntervals?lr.sumIntervals(ov):15,15);
let nonRows=[{type:'escape',start:new Date(2026,0,1),end:new Date(2026,0,10)},{type:'interruption',start:new Date(2026,0,5),end:new Date(2026,0,12)}]; assert.equal(lr.__non(nonRows),10);
'''
s=s.replace("console.log('All audit regression tests passed.');",insert+"\nconsole.log('All audit regression tests passed.');")
write(p,s)

# --- index/version/cache ---
p='index.html'; s=read(p)
s=s.replace('<title>CALCULATOR TERMENE PEDEPSE PRIVATIVE DE LIBERTATE</title>','<title>Evidență pedepse și liberare condiționată</title>')
s=re.sub(r'css/style\.css\?v=\d+','css/style.css?v=36',s)
s=re.sub(r'js/([a-z-]+)\.js\?v=\d+',r'js/\1.js?v=36',s)
write(p,s)

Path('version.json').write_text(json.dumps({'version':'0.166'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Remove staging script from final application commit.
Path(__file__).unlink()
print('Calibration transformations applied.')

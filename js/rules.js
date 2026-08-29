// ========== REGULI DE CALCUL (SFINTE, NU SE MODIFICĂ) ==========

// Tabelul sacru cu fracții de liberare condiționată
const liberationRules = [
    { article:"NCP100", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,2], total:[2,3] },
    { article:"NCP100", age:["MAJOR","TANAR"], minYears:10, mandatory:[2,3,7305], total:[3,4,7305] },
    { article:"NCP100", age:["BATRAN"], maxYears:10, mandatory:[1,3], total:[1,2] },
    { article:"NCP100", age:["BATRAN"], minYears:10, mandatory:[1,2,7305], total:[2,3,7305] },
    { article:"NCP99",  age:["MINOR","TANAR","MAJOR","BATRAN"], life:true, mandatory:[1,2,7305], total:[1,2,7305] },
    { article:"NCP124", age:["MINOR","TANAR","MAJOR","BATRAN"], mandatory:[1,2], total:[1,2] },
    { article:"NCP125", age:["MINOR","TANAR","MAJOR","BATRAN"], mandatory:[1,2], total:[1,2] },
    { article:"VCP59",  age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,2], total:[2,3] },
    { article:"VCP59",  age:["MAJOR","TANAR"], minYears:10, mandatory:[2,3], total:[3,4] },
    { article:"VCP591", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,3], total:[1,2] },
    { article:"VCP591", age:["MAJOR","TANAR"], minYears:10, mandatory:[1,2], total:[2,3] },
    { article:"VCP602", age:["BATRAN"], maxYears:10, mandatory:[1,100], total:[1,3] },
    { article:"VCP602", age:["BATRAN"], minYears:10, mandatory:[1,100], total:[1,2] },
    { article:"VCP603", age:["BATRAN"], maxYears:10, mandatory:[1,100], total:[1,4] },
    { article:"VCP603", age:["BATRAN"], minYears:10, mandatory:[1,100], total:[1,3] }
];

/**
 * Determină categoria de vârstă la o dată dată.
 * @param {Date} birthDate - data nașterii
 * @param {Date} targetDate - data de referință
 * @param {string} currentSex - 'M' sau 'F'
 * @param {string} articleValue - valoarea articolului de liberare (ex: "NCP100")
 * @returns {string} - "MINOR", "TANAR", "MAJOR", "BATRAN"
 */
function getAgeCategoryAtDate(birthDate, targetDate, currentSex, articleValue) {
    const ageY = ageExact(birthDate, targetDate).y;
    if (ageY < 18) return "MINOR";
    if (ageY < 21) return "TANAR";
    const isNCP = articleValue ? articleValue.startsWith("NCP") : true;
    const elderly = isNCP ? (ageY >= 60) : ((currentSex === 'M' && ageY >= 60) || (currentSex === 'F' && ageY >= 55));
    return elderly ? "BATRAN" : "MAJOR";
}

/**
 * Calculează fracțiile de liberare condiționată și plafoanele.
 * @param {boolean} life - detențiune pe viață
 * @param {string} art - articolul selectat (ex: "NCP100")
 * @param {string} ageAtExpiry - categoria de vârstă la expirare
 * @param {boolean} sentenceOver10 - dacă pedeapsa > 10 ani (luni totale > 120)
 * @param {number} totalDays - zile totale mandat (util pentru viață)
 * @param {Date} birthDate - data nașterii (necesar pentru NCP100)
 * @param {Date} theorExp - data expirării teoretice (necesar pentru NCP100)
 * @returns {object} - { mR, tR, pM, pT, articleInfo, error? }
 */
function getLiberationFractions(life, art, ageAtExpiry, sentenceOver10, totalDays, birthDate, theorExp) {
    let mR = 1/2, tR = 2/3, pM = Infinity, pT = Infinity, articleInfo = '';

    if (life) {
        mR = 1/2;
        tR = 1/2;
        pM = totalDays;
        pT = totalDays;
        articleInfo = 'NCP art. 99 (viață)';
    } else {
        if (art === 'NCP100') {
            // Determinare specială pentru NCP100 bazată pe vârsta la expirare
            const sixtiethBirthday = new Date(birthDate.getFullYear() + 60, birthDate.getMonth(), birthDate.getDate());
            const expiresBefore60 = theorExp < sixtiethBirthday;
            if (expiresBefore60) {
                if (sentenceOver10) {
                    mR = 2/3;
                    tR = 3/4;
                    pM = 7305;
                    pT = 7305;
                } else {
                    mR = 1/2;
                    tR = 2/3;
                }
                articleInfo = `NCP art. 100 (${ageAtExpiry}, expiră < 60 ani) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
            } else {
                if (sentenceOver10) {
                    mR = 1/2;
                    tR = 2/3;
                    pM = 7305;
                    pT = 7305;
                } else {
                    mR = 1/3;
                    tR = 1/2;
                }
                articleInfo = `NCP art. 100 (${ageAtExpiry}, expiră ≥ 60 ani) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
            }
        } else {
            const rule = liberationRules.find(r =>
                r.article === art &&
                r.age.includes(ageAtExpiry) &&
                ((r.life && life) || 
                 (!r.life && ((r.maxYears && !sentenceOver10) ||
                              (r.minYears && sentenceOver10) ||
                              (!r.maxYears && !r.minYears))))
            );
            if (rule) {
                mR = rule.mandatory[0] / rule.mandatory[1];
                tR = rule.total[0] / rule.total[1];
                pM = rule.mandatory[2] || Infinity;
                pT = rule.total[2] || Infinity;
                articleInfo = `${art} (${ageAtExpiry}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
            } else {
                return { error: 'Nu există regulă de liberare pentru această combinație.' };
            }
        }
    }

    return { mR, tR, pM, pT, articleInfo };
}

/**
 * Unifică intervalele de perioade deduse și calculează totalul de zile.
 * @param {Array<[Date, Date]>} intervals - perechi [start, end]
 * @returns {number} - total zile deduse (cu capete incluse)
 */
function sumIntervals(intervals) {
    if (!intervals.length) return 0;
    const sorted = intervals.slice().sort((a, b) => a[0].getTime() - b[0].getTime());
    let total = daysBetween(sorted[0][0], sorted[0][1]) + 1;
    let currentEnd = sorted[0][1];
    for (let i = 1; i < sorted.length; i++) {
        const [start, end] = sorted[i];
        if (start <= currentEnd) {
            if (end > currentEnd) {
                total += daysBetween(currentEnd, end);
                currentEnd = end;
            }
        } else {
            total += daysBetween(start, end) + 1;
            currentEnd = end;
        }
    }
    return total;
}


// ========== CALIBRARE OPERAȚIONALĂ LC 2026 ==========
// Tabel operațional furnizat: plafon 20 ani = 7.305 zile; schimbarea fracțiilor NCP art. 100 se produce la împlinirea efectivă a vârstei de 60 ani.
const LC_TWENTY_YEAR_CAP_DAYS = 7305;

function thresholdDate(startDate, thresholdDays, dedDays = 0, nonExecDays = 0) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.max(0, thresholdDays) - 1 - dedDays + nonExecDays);
    return d;
}

function ageThresholdBirthday(birthDate, years) {
    const d = new Date(birthDate);
    const month = d.getMonth(), day = d.getDate();
    d.setDate(1);
    d.setFullYear(d.getFullYear() + years);
    d.setMonth(month);
    d.setDate(Math.min(day, new Date(d.getFullYear(), month + 1, 0).getDate()));
    return d;
}

function sixtiethBirthday(birthDate) {
    return ageThresholdBirthday(birthDate, 60);
}

function vcpElderlyBirthday(birthDate, currentSex) {
    return ageThresholdBirthday(birthDate, currentSex === 'F' ? 55 : 60);
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
            lifeThreshold: true, ageTransitionApplied: false, ageRegime: 'life', ageThresholdYears: null
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
            ageRegime: usedElder ? 'elderly' : 'young', ageThresholdYears: 60,
            ageTransitionApplied: m.transitionApplied || t.transitionApplied,
            articleInfo: `NCP art. 100 (${usedElder ? 'fracții 60+ aplicate de la data împlinirii vârstei' : 'fracții sub 60 ani'}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`
        };
    }

    if (art === 'VCP59' || art === 'VCP591') {
        const is59 = art === 'VCP59';
        const youngMR = is59 ? (sentenceOver10 ? 2/3 : 1/2) : (sentenceOver10 ? 1/2 : 1/3);
        const youngTR = is59 ? (sentenceOver10 ? 3/4 : 2/3) : (sentenceOver10 ? 2/3 : 1/2);
        // Condițiile favorabile de vârstă din VCP: corespondent art. 60 alin. (2) pentru art. 59,
        // respectiv art. 60 alin. (3) pentru art. 59¹. Articolul selectat rămâne neschimbat pe mandat.
        const elderMR = 1/100;
        const elderTR = is59 ? (sentenceOver10 ? 1/2 : 1/3) : (sentenceOver10 ? 1/3 : 1/4);
        const birthday = vcpElderlyBirthday(birthDate, currentSex);
        const m = resolveAgeTransitionThreshold(startDate, birthday,
            cappedFractionDays(totalDays, youngMR), cappedFractionDays(totalDays, elderMR), dedDays, nonExecDays);
        const t = resolveAgeTransitionThreshold(startDate, birthday,
            cappedFractionDays(totalDays, youngTR), cappedFractionDays(totalDays, elderTR), dedDays, nonExecDays);
        const usedElder = m.usedElderlyRule || t.usedElderlyRule;
        const articleLabel = is59 ? 'VCP art. 59' : 'VCP art. 59¹';
        return {
            mR: m.usedElderlyRule ? elderMR : youngMR,
            tR: t.usedElderlyRule ? elderTR : youngTR,
            mDays: m.days, tDays: t.days, mDate: m.date, tDate: t.date,
            pM: Infinity, pT: Infinity,
            elderlyBirthday: birthday,
            ageRegime: usedElder ? 'elderly' : 'young', ageThresholdYears: currentSex === 'F' ? 55 : 60,
            ageTransitionApplied: m.transitionApplied || t.transitionApplied,
            articleInfo: `${articleLabel} (${usedElder ? 'condiții VCP pentru pragul de vârstă aplicate de la data împlinirii' : 'condiții VCP înainte de pragul de vârstă'}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`
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

    if (type === 'interruption') {
        // Întreruperea executării: nu se adaugă nici ziua plecării, nici ziua revenirii.
        first.setDate(first.getDate() + 1);
        last.setDate(last.getDate() - 1);
    } else if (type === 'escape' || type === 'illness') {
        // Evadare / boală provocată voit: ziua inițială nu este executată,
        // iar ziua prinderii / externării se consideră executată.
        first.setDate(first.getDate() + 1);
    } else {
        first.setDate(first.getDate() + 1);
    }

    if (last < first) return null;
    return [first, last];
}

function sumNonExecutedPeriods(rows) {
    const effective = rows.map(r => getNonExecEffectiveInterval(r.type, r.start, r.end)).filter(Boolean);
    return sumIntervals(effective);
}

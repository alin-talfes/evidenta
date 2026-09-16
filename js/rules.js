// ========== ALGORITM LIBERARE CONDIȚIONATĂ ==========
// Matricea de mai jos definește configurațiile operaționale ale algoritmului.
// Valorile tehnice (inclusiv 1/100) se păstrează ca atare; nu se substituie cu interpretări doctrinare.
const liberationRules = [
    { article:"NCP100", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,2], total:[2,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"NCP100", age:["MAJOR","TANAR"], minYears:10, mandatory:[2,3,7305], total:[3,4,7305], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"NCP100", age:["BATRAN"], maxYears:10, mandatory:[1,3], total:[1,2], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"NCP100", age:["BATRAN"], minYears:10, mandatory:[1,2,7305], total:[2,3,7305], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"NCP99", age:["MINOR","TANAR","MAJOR","BATRAN"], life:true, mandatory:[1,2,7305], total:[1,2,7305], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"NCP124", age:["MINOR","TANAR","MAJOR","BATRAN"], mandatory:[1,2], total:[1,2], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"NCP125", age:["MINOR","TANAR","MAJOR","BATRAN"], mandatory:[1,2], total:[1,2], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },

    { article:"VCP59", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,2], total:[2,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"VCP59", age:["MAJOR","TANAR"], minYears:10, mandatory:[2,3], total:[3,4], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"VCP591", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,3], total:[1,2], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"VCP591", age:["MAJOR","TANAR"], minYears:10, mandatory:[1,2], total:[2,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    // 1/100 este valoarea tehnică utilizată pentru fracția obligatorie în aceste configurații.
    { article:"VCP602", age:["BATRAN"], maxYears:10, mandatory:[1,100], total:[1,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"VCP602", age:["BATRAN"], minYears:10, mandatory:[1,100], total:[1,2], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"VCP603", age:["BATRAN"], maxYears:10, mandatory:[1,100], total:[1,4], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"VCP603", age:["BATRAN"], minYears:10, mandatory:[1,100], total:[1,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"VCP551", age:["MINOR","TANAR","MAJOR","BATRAN"], life:true, mandatory:[1,2,7305], total:[1,2,7305], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },

    { article:"PRE14059", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,3], total:[1,2], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"PRE14059", age:["MAJOR","TANAR"], minYears:10, mandatory:[1,2], total:[2,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"PRE14060", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,2], total:[2,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"PRE14060", age:["MAJOR","TANAR"], minYears:10, mandatory:[2,3], total:[3,4], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"PRE140604", age:["BATRAN"], maxYears:10, mandatory:[1,100], total:[1,4], source:"ALGORITM LIBERARE CONDIȚIONATĂ" },
    { article:"PRE140604", age:["BATRAN"], minYears:10, mandatory:[1,100], total:[1,3], source:"ALGORITM LIBERARE CONDIȚIONATĂ" }
];

/**
 * Determină categoria de vârstă la o dată dată.
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
 * Calculează fracțiile de liberare condiționată și plafoanele pentru regulile statice.
 */
function getLiberationFractions(life, art, ageAtExpiry, sentenceOver10, totalDays, birthDate, theorExp) {
    let mR = 1/2, tR = 2/3, pM = Infinity, pT = Infinity, articleInfo = '';

    if (life) {
        mR = 1/2;
        tR = 1/2;
        pM = totalDays;
        pT = totalDays;
        articleInfo = art === 'VCP551' ? 'VCP art. 55¹ (viață)' : 'NCP art. 99 (viață)';
    } else if (art === 'NCP100') {
        const birthday60 = sixtiethBirthday(birthDate);
        const expiresBefore60 = theorExp < birthday60;
        if (expiresBefore60) {
            if (sentenceOver10) {
                mR = 2/3; tR = 3/4; pM = 7305; pT = 7305;
            } else {
                mR = 1/2; tR = 2/3;
            }
            articleInfo = `NCP art. 100 (${ageAtExpiry}, expiră < 60 ani) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
        } else {
            if (sentenceOver10) {
                mR = 1/2; tR = 2/3; pM = 7305; pT = 7305;
            } else {
                mR = 1/3; tR = 1/2;
            }
            articleInfo = `NCP art. 100 (${ageAtExpiry}, expiră ≥ 60 ani) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
        }
    } else {
        const rule = liberationRules.find(r =>
            r.article === art &&
            r.age.includes(ageAtExpiry) &&
            !r.life &&
            ((r.maxYears && !sentenceOver10) || (r.minYears && sentenceOver10) || (!r.maxYears && !r.minYears))
        );
        if (!rule) return { error: 'Nu există configurație în algoritmul de liberare condiționată pentru această combinație de articol, vârstă și durată.' };
        mR = rule.mandatory[0] / rule.mandatory[1];
        tR = rule.total[0] / rule.total[1];
        pM = rule.mandatory[2] || Infinity;
        pT = rule.total[2] || Infinity;
        articleInfo = `${art} (${ageAtExpiry}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
    }

    return { mR, tR, pM, pT, articleInfo };
}

/**
 * Însumează integral intervalele introduse, cu ambele capete incluse.
 * Suprapunerile nu sunt deduplicate: sunt calculate integral și semnalate separat în UI.
 */
function sumIntervals(intervals) {
    return (intervals || []).reduce((sum, interval) => {
        const [start, end] = interval || [];
        if (!(start instanceof Date) || !(end instanceof Date) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return sum;
        return sum + daysBetween(start, end) + 1;
    }, 0);
}

// ========== CALIBRARE OPERAȚIONALĂ LC 2026 ==========
const LC_TWENTY_YEAR_CAP_DAYS = 7305;
const VCP_LIFE_ARTICLE = 'VCP551';
const VCP_AGE_GUARDED_ARTICLES = new Set(['VCP602', 'VCP603', 'PRE140604']);

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

function laterDate(a, b) {
    return a > b ? new Date(a) : new Date(b);
}

function calendarThresholdDays(startDate, years) {
    const end = addCalendarSafe(startDate, years, 0, 0);
    end.setDate(end.getDate() - 1);
    return daysBetween(startDate, end) + 1;
}

function resolveAgeTransitionThreshold(startDate, birthday, youngDays, elderDays, dedDays, nonExecDays) {
    const youngDate = thresholdDate(startDate, youngDays, dedDays, nonExecDays);
    const elderDate = thresholdDate(startDate, elderDays, dedDays, nonExecDays);
    if (startDate >= birthday) return { date: elderDate, days: elderDays, usedElderlyRule: true, transitionApplied: false };
    if (youngDate < birthday) return { date: youngDate, days: youngDays, usedElderlyRule: false, transitionApplied: false };
    return {
        date: elderDate < birthday ? new Date(birthday) : elderDate,
        days: elderDays,
        usedElderlyRule: true,
        transitionApplied: true
    };
}

function buildLifeSchedule({ art, birthDate, startDate, currentSex, dedDays, nonExecDays }) {
    const twentyYearDate = thresholdDate(startDate, LC_TWENTY_YEAR_CAP_DAYS, dedDays, nonExecDays);

    if (art !== VCP_LIFE_ARTICLE) {
        return {
            mR: 1/2, tR: 1/2,
            mDays: LC_TWENTY_YEAR_CAP_DAYS, tDays: LC_TWENTY_YEAR_CAP_DAYS,
            mDate: twentyYearDate, tDate: new Date(twentyYearDate),
            pM: LC_TWENTY_YEAR_CAP_DAYS, pT: LC_TWENTY_YEAR_CAP_DAYS,
            articleInfo: 'NCP art. 99 (detențiune pe viață — prag 20 ani / 7.305 zile)',
            lifeThreshold: true,
            ageTransitionApplied: false,
            ageRegime: 'life',
            ageThresholdYears: null,
            vcpLifeElderlyApplied: false,
            workReductionFloorDate: new Date(twentyYearDate)
        };
    }

    const birthday = vcpElderlyBirthday(birthDate, currentSex);
    const elderDays = calendarThresholdDays(startDate, 15);
    const elderDateRaw = thresholdDate(startDate, elderDays, dedDays, nonExecDays);
    const validBirthday = birthday instanceof Date && !Number.isNaN(birthday.getTime());
    const ageThresholdYears = currentSex === 'F' ? 55 : 60;

    let useElder = false;
    let finalDate = new Date(twentyYearDate);
    if (validBirthday && startDate >= birthday) {
        useElder = true;
        finalDate = elderDateRaw;
    } else if (validBirthday && twentyYearDate >= birthday) {
        useElder = true;
        finalDate = elderDateRaw < birthday ? new Date(birthday) : elderDateRaw;
    }

    if (!useElder) {
        return {
            mR: 1/2, tR: 1/2,
            mDays: LC_TWENTY_YEAR_CAP_DAYS, tDays: LC_TWENTY_YEAR_CAP_DAYS,
            mDate: twentyYearDate, tDate: new Date(twentyYearDate),
            pM: LC_TWENTY_YEAR_CAP_DAYS, pT: LC_TWENTY_YEAR_CAP_DAYS,
            articleInfo: 'VCP art. 55¹ · prag efectiv 20 ani',
            lifeThreshold: true,
            ageTransitionApplied: false,
            ageRegime: 'young',
            ageThresholdYears,
            elderlyBirthday: validBirthday ? new Date(birthday) : null,
            vcpLifeElderlyApplied: false,
            workReductionFloorDate: new Date(twentyYearDate)
        };
    }

    return {
        mR: 1/2, tR: 1/2,
        mDays: elderDays, tDays: elderDays,
        mDate: new Date(finalDate), tDate: new Date(finalDate),
        pM: elderDays, pT: elderDays,
        articleInfo: `VCP art. 55¹ · prag efectiv 15 ani după împlinirea vârstei de ${ageThresholdYears} ani`,
        lifeThreshold: true,
        ageTransitionApplied: validBirthday && startDate < birthday,
        ageRegime: 'elderly',
        ageThresholdYears,
        elderlyBirthday: validBirthday ? new Date(birthday) : null,
        vcpLifeElderlyApplied: true,
        workReductionFloorDate: new Date(finalDate)
    };
}

function applyVcpAgeFloor(result, { art, birthDate, startDate, currentSex }) {
    if (!result || result.error || !VCP_AGE_GUARDED_ARTICLES.has(art)) return result;
    const birthday = vcpElderlyBirthday(birthDate, currentSex);
    if (!(birthday instanceof Date) || Number.isNaN(birthday.getTime())) return result;
    if (!(startDate instanceof Date) || startDate >= birthday) return result;

    let clamped = false;
    if (result.mDate instanceof Date && result.mDate < birthday) {
        result.mDate = new Date(birthday);
        clamped = true;
    }
    if (result.tDate instanceof Date && result.tDate < birthday) {
        result.tDate = new Date(birthday);
        clamped = true;
    }
    if (!clamped) return result;

    result.elderlyBirthday = new Date(birthday);
    result.ageRegime = 'elderly';
    result.ageThresholdYears = currentSex === 'F' ? 55 : 60;
    result.ageTransitionApplied = true;
    result.workReductionFloorDate = laterDate(result.mDate, birthday);
    result.articleInfo = `${result.articleInfo || art} · efecte nu mai devreme de pragul de vârstă`;
    return result;
}

function calculateLiberationSchedule({ life, art, sentenceOver10, totalDays, birthDate, startDate, currentSex, theorExp, dedDays = 0, nonExecDays = 0 }) {
    if (life) {
        return buildLifeSchedule({ art, birthDate, startDate, currentSex, dedDays, nonExecDays });
    }

    if (art === 'NCP100') {
        const youngMR = sentenceOver10 ? 2/3 : 1/2;
        const youngTR = sentenceOver10 ? 3/4 : 2/3;
        const elderMR = sentenceOver10 ? 1/2 : 1/3;
        const elderTR = sentenceOver10 ? 2/3 : 1/2;
        const cap = sentenceOver10 ? LC_TWENTY_YEAR_CAP_DAYS : Infinity;
        const birthday60 = sixtiethBirthday(birthDate);
        const m = resolveAgeTransitionThreshold(
            startDate, birthday60,
            cappedFractionDays(totalDays, youngMR, cap),
            cappedFractionDays(totalDays, elderMR, cap),
            dedDays, nonExecDays
        );
        const t = resolveAgeTransitionThreshold(
            startDate, birthday60,
            cappedFractionDays(totalDays, youngTR, cap),
            cappedFractionDays(totalDays, elderTR, cap),
            dedDays, nonExecDays
        );
        const usedElder = m.usedElderlyRule || t.usedElderlyRule;
        const floor = (t.usedElderlyRule && startDate < birthday60) ? laterDate(m.date, birthday60) : new Date(m.date);
        return {
            mR: m.usedElderlyRule ? elderMR : youngMR,
            tR: t.usedElderlyRule ? elderTR : youngTR,
            mDays: m.days, tDays: t.days,
            mDate: m.date, tDate: t.date,
            pM: cap, pT: cap,
            birthday60,
            ageRegime: usedElder ? 'elderly' : 'young',
            ageThresholdYears: 60,
            ageTransitionApplied: m.transitionApplied || t.transitionApplied,
            workReductionFloorDate: floor,
            articleInfo: `NCP art. 100 (${usedElder ? 'fracții 60+ aplicate de la data împlinirii vârstei' : 'fracții sub 60 ani'}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`
        };
    }

    if (art === 'VCP59' || art === 'VCP591') {
        const is59 = art === 'VCP59';
        const youngMR = is59 ? (sentenceOver10 ? 2/3 : 1/2) : (sentenceOver10 ? 1/2 : 1/3);
        const youngTR = is59 ? (sentenceOver10 ? 3/4 : 2/3) : (sentenceOver10 ? 2/3 : 1/2);
        // 1/100 este sentinelul operațional pentru lipsa unui prag efectiv distinct la regimul favorabil de vârstă.
        const elderMR = 1/100;
        const elderTR = is59 ? (sentenceOver10 ? 1/2 : 1/3) : (sentenceOver10 ? 1/3 : 1/4);
        const birthday = vcpElderlyBirthday(birthDate, currentSex);
        const m = resolveAgeTransitionThreshold(
            startDate, birthday,
            cappedFractionDays(totalDays, youngMR),
            cappedFractionDays(totalDays, elderMR),
            dedDays, nonExecDays
        );
        const t = resolveAgeTransitionThreshold(
            startDate, birthday,
            cappedFractionDays(totalDays, youngTR),
            cappedFractionDays(totalDays, elderTR),
            dedDays, nonExecDays
        );
        const usedElder = m.usedElderlyRule || t.usedElderlyRule;
        const floor = (t.usedElderlyRule && startDate < birthday) ? laterDate(m.date, birthday) : new Date(m.date);
        const articleLabel = is59 ? 'VCP art. 59' : 'VCP art. 59¹';
        return {
            mR: m.usedElderlyRule ? elderMR : youngMR,
            tR: t.usedElderlyRule ? elderTR : youngTR,
            mDays: m.days, tDays: t.days,
            mDate: m.date, tDate: t.date,
            pM: Infinity, pT: Infinity,
            elderlyBirthday: birthday,
            ageRegime: usedElder ? 'elderly' : 'young',
            ageThresholdYears: currentSex === 'F' ? 55 : 60,
            ageTransitionApplied: m.transitionApplied || t.transitionApplied,
            workReductionFloorDate: floor,
            articleInfo: `${articleLabel} (${usedElder ? 'condiții VCP pentru pragul de vârstă aplicate de la data împlinirii' : 'condiții VCP înainte de pragul de vârstă'}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`
        };
    }

    const referenceDate = theorExp || startDate;
    const ageCategory = getAgeCategoryAtDate(birthDate, referenceDate, currentSex, art);
    const fractions = getLiberationFractions(false, art, ageCategory, sentenceOver10, totalDays, birthDate, theorExp);
    if (fractions.error) return fractions;
    const mDays = cappedFractionDays(totalDays, fractions.mR, fractions.pM);
    const tDays = cappedFractionDays(totalDays, fractions.tR, fractions.pT);
    const mDate = thresholdDate(startDate, mDays, dedDays, nonExecDays);
    const result = {
        ...fractions,
        mDays,
        tDays,
        mDate,
        tDate: thresholdDate(startDate, tDays, dedDays, nonExecDays),
        ageTransitionApplied: false,
        workReductionFloorDate: new Date(mDate)
    };
    return applyVcpAgeFloor(result, { art, birthDate, startDate, currentSex });
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
        // Nu se adaugă nici ziua plecării, nici ziua revenirii.
        first.setDate(first.getDate() + 1);
        last.setDate(last.getDate() - 1);
    } else if (type === 'escape' || type === 'illness') {
        // Configurația curentă păstrează convenția operațională existentă pentru capetele intervalului.
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
(function(root){
'use strict';

const GUARDED_ARTICLES = new Set(['VCP602','VCP603','PRE140604']);
const VCP_LIFE_ARTICLE = 'VCP551';

function laterDate(a,b){ return a > b ? new Date(a) : new Date(b); }

function calendarThresholdDays(startDate, years){
    const end = root.addCalendarSafe(startDate, years, 0, 0);
    end.setDate(end.getDate() - 1);
    return root.daysBetween(startDate, end) + 1;
}

function applyVcpLifeRule(args, result){
    if (!args?.life || args.art !== VCP_LIFE_ARTICLE) return result;
    const birthday = root.vcpElderlyBirthday(args.birthDate, args.currentSex);
    if (!(birthday instanceof Date) || Number.isNaN(birthday.getTime())) return result;

    const youngDate = new Date(result.mDate);
    const elderDays = calendarThresholdDays(args.startDate, 15);
    const elderDateRaw = root.thresholdDate(args.startDate, elderDays, args.dedDays || 0, args.nonExecDays || 0);

    let useElder = false;
    let finalDate = youngDate;
    if (args.startDate >= birthday) {
        useElder = true;
        finalDate = elderDateRaw;
    } else if (youngDate >= birthday) {
        useElder = true;
        finalDate = elderDateRaw < birthday ? new Date(birthday) : elderDateRaw;
    }

    if (!useElder) {
        result.ageRegime = 'young';
        result.ageThresholdYears = args.currentSex === 'F' ? 55 : 60;
        result.elderlyBirthday = new Date(birthday);
        result.vcpLifeElderlyApplied = false;
        result.articleInfo = 'VCP art. 55¹ · prag efectiv 20 ani';
        return result;
    }

    result.mDays = elderDays;
    result.tDays = elderDays;
    result.mDate = new Date(finalDate);
    result.tDate = new Date(finalDate);
    result.pM = elderDays;
    result.pT = elderDays;
    result.elderlyBirthday = new Date(birthday);
    result.ageRegime = 'elderly';
    result.ageThresholdYears = args.currentSex === 'F' ? 55 : 60;
    result.ageTransitionApplied = args.startDate < birthday;
    result.vcpLifeElderlyApplied = true;
    result.workReductionFloorDate = new Date(finalDate);
    result.articleInfo = `VCP art. 55¹ · prag efectiv 15 ani după împlinirea vârstei de ${result.ageThresholdYears} ani`;
    return result;
}

function patchMainResult(){
    const calc = root.lastCalculation;
    if (!calc?.life || calc.art !== VCP_LIFE_ARTICLE) return;
    const fifteen = calc.mDays !== root.LC_TWENTY_YEAR_CAP_DAYS;
    const years = fifteen ? 15 : 20;
    const results = document.getElementById('resultsContent');
    if (results) {
        Array.from(results.querySelectorAll('.result-item')).forEach(item => {
            const label = item.querySelector('.result-label')?.textContent?.trim() || '';
            const value = item.querySelector('.result-value');
            if (!value) return;
            if (label === 'Detențiune pe viață') value.textContent = `Fără dată de expirare. Prag VCP art. 55¹: ${years} ani / ${calc.mDays} zile.`;
            if (label === 'prag LC') {
                item.querySelector('.result-label').textContent = 'Prag VCP art. 55¹';
                value.textContent = `${years} ani / ${calc.mDays} zile`;
            }
        });
    }
    const steps = document.getElementById('stepsList');
    steps?.querySelectorAll('li').forEach(li => {
        if ((li.textContent || '').includes('Pragul minim și data propozabilă coincid la')) {
            li.textContent = `VCP art. 55¹: pragul minim și data propozabilă coincid la ${years} ani (${calc.mDays} zile); zilele muncite nu reduc acest prag.`;
        }
    });
}

function install(){
    if (root.__EVIDENTA_LEGAL_RELEASE_GUARDS__) return true;
    const original = root.calculateLiberationSchedule;
    if (typeof original !== 'function' || typeof root.vcpElderlyBirthday !== 'function') return false;

    root.calculateLiberationSchedule = function(args){
        let result = original(args);
        if (!result || result.error) return result;

        if (args?.life && args.art === VCP_LIFE_ARTICLE) return applyVcpLifeRule(args, result);
        if (args?.life || !GUARDED_ARTICLES.has(args?.art)) return result;

        const birthday = root.vcpElderlyBirthday(args.birthDate, args.currentSex);
        if (!(birthday instanceof Date) || Number.isNaN(birthday.getTime())) return result;
        if (!(args.startDate instanceof Date) || args.startDate >= birthday) return result;

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
        result.ageThresholdYears = args.currentSex === 'F' ? 55 : 60;
        result.ageTransitionApplied = true;
        result.workReductionFloorDate = laterDate(result.mDate, birthday);
        result.articleInfo = `${result.articleInfo || args.art} · efecte nu mai devreme de pragul de vârstă`;
        return result;
    };

    if (typeof root.buildLcDetails === 'function') {
        const originalDetails = root.buildLcDetails;
        root.buildLcDetails = function(args){
            const details = originalDetails(args);
            if (!args?.life || args.art !== VCP_LIFE_ARTICLE || !args.schedule) return details;
            const s = args.schedule;
            const years = s.vcpLifeElderlyApplied ? 15 : 20;
            details.sentenceBand = 'Detențiune pe viață · VCP';
            details.age = s.vcpLifeElderlyApplied
                ? `Pragul de ${years} ani se aplică după împlinirea vârstei de ${s.ageThresholdYears} ani.`
                : `Se aplică pragul de ${years} ani; pragul favorabil de vârstă nu este incident înaintea acestei date.`;
            details.minimum = `Prag efectiv: ${s.mDays} zile. Zilele muncite nu reduc acest prag.`;
            details.proposed = `Data de împlinire a pragului: ${root.fmtDate(s.tDate)}.`;
            return details;
        };
    }

    if (typeof root.calculateAll === 'function') {
        const originalCalculateAll = root.calculateAll;
        root.calculateAll = function(...args){
            const value = originalCalculateAll.apply(this,args);
            patchMainResult();
            return value;
        };
    }

    if (typeof root.buildNarrativeText === 'function') {
        const originalNarrative = root.buildNarrativeText;
        root.buildNarrativeText = function(){
            let text = originalNarrative();
            const calc = root.lastCalculation;
            if (!text || !calc?.life || calc.art !== VCP_LIFE_ARTICLE) return text;
            const years = calc.mDays !== root.LC_TWENTY_YEAR_CAP_DAYS ? 15 : 20;
            return text.replaceAll('prag LC 20 ani', `prag VCP art. 55¹ ${years} ani`);
        };
    }

    root.__EVIDENTA_LEGAL_RELEASE_GUARDS__ = true;
    root.EVIDENTA_LEGAL_RELEASE_GUARDS = { guardedArticles: [...GUARDED_ARTICLES], vcpLifeArticle:VCP_LIFE_ARTICLE };
    return true;
}

if (!install() && typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
    else setTimeout(install, 0);
}

})(typeof window !== 'undefined' ? window : globalThis);

(function(root){
'use strict';

const GUARDED_ARTICLES = new Set(['VCP602','VCP603','PRE140604']);

function laterDate(a,b){ return a > b ? new Date(a) : new Date(b); }

function install(){
    if (root.__EVIDENTA_LEGAL_RELEASE_GUARDS__) return true;
    const original = root.calculateLiberationSchedule;
    if (typeof original !== 'function' || typeof root.vcpElderlyBirthday !== 'function') return false;

    root.calculateLiberationSchedule = function(args){
        const result = original(args);
        if (!result || result.error || args?.life || !GUARDED_ARTICLES.has(args?.art)) return result;

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

    root.__EVIDENTA_LEGAL_RELEASE_GUARDS__ = true;
    root.EVIDENTA_LEGAL_RELEASE_GUARDS = { guardedArticles: [...GUARDED_ARTICLES] };
    return true;
}

if (!install() && typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
    else setTimeout(install, 0);
}

})(typeof window !== 'undefined' ? window : globalThis);

from pathlib import Path
import re

# Cache busting + theme color on all HTML pages.
for path in [Path('index.html'), Path('termene.html'), Path('contopiri.html'), Path('transfer/index.html'), Path('transfer/rules.html')]:
    s = path.read_text(encoding='utf-8')
    s = re.sub(r'(?:\.\./)?css/style\.css\?v=\d+', lambda m: m.group(0).split('?')[0] + '?v=38', s)
    s = s.replace('content="#061426"', 'content="#0b1220"')
    path.write_text(s, encoding='utf-8')

# VCP: articolul rămâne neschimbat; la pragul de vârstă se schimbă condițiile din cadrul VCP.
p = Path('js/rules.js')
s = p.read_text(encoding='utf-8')
old = '''function sixtiethBirthday(birthDate) {
    const d = new Date(birthDate);
    const month = d.getMonth(), day = d.getDate();
    d.setDate(1);
    d.setFullYear(d.getFullYear() + 60);
    d.setMonth(month);
    d.setDate(Math.min(day, new Date(d.getFullYear(), month + 1, 0).getDate()));
    return d;
}'''
new = '''function ageThresholdBirthday(birthDate, years) {
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
}'''
assert old in s
s = s.replace(old, new, 1)
marker = '''    const referenceDate = theorExp || startDate;
    const ageCategory = getAgeCategoryAtDate(birthDate, referenceDate, currentSex, art);'''
insert = '''    if (art === 'VCP59' || art === 'VCP591') {
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
            ageTransitionApplied: m.transitionApplied || t.transitionApplied,
            articleInfo: `${articleLabel} (${usedElder ? 'condiții VCP pentru pragul de vârstă aplicate de la data împlinirii' : 'condiții VCP înainte de pragul de vârstă'}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`
        };
    }

    const referenceDate = theorExp || startDate;
    const ageCategory = getAgeCategoryAtDate(birthDate, referenceDate, currentSex, art);'''
assert marker in s
s = s.replace(marker, insert, 1)
p.write_text(s, encoding='utf-8')

# Regression tests for VCP transition and cache/palette consistency.
p = Path('tests/run-tests.js')
s = p.read_text(encoding='utf-8')
marker = "console.log('All audit regression tests passed.');"
add = '''// VCP: articolul rămâne neschimbat; se schimbă doar condițiile la pragul de vârstă (60 M / 55 F).
let vcpMale=lr.__schedule({life:false,art:'VCP59',sentenceOver10:false,totalDays:2200,birthDate:new Date(1968,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2032,0,1),dedDays:0,nonExecDays:0});
assert.equal(vcpMale.mR,1/100); assert.equal(vcpMale.tR,1/3); assert(vcpMale.ageTransitionApplied); assert(vcpMale.articleInfo.includes('VCP art. 59'));
let vcpFemale=lr.__schedule({life:false,art:'VCP591',sentenceOver10:false,totalDays:1800,birthDate:new Date(1972,0,1),startDate:new Date(2026,0,1),currentSex:'F',theorExp:new Date(2031,0,1),dedDays:0,nonExecDays:0});
assert.equal(vcpFemale.mR,1/100); assert.equal(vcpFemale.tR,1/4); assert(vcpFemale.articleInfo.includes('VCP art. 59¹'));
let vcpYoung=lr.__schedule({life:false,art:'VCP59',sentenceOver10:false,totalDays:900,birthDate:new Date(1985,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2028,5,1),dedDays:0,nonExecDays:0});
assert.equal(vcpYoung.mR,1/2); assert.equal(vcpYoung.tR,2/3); assert(!vcpYoung.ageTransitionApplied);
for(const f of ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']){ const h=fs.readFileSync(f,'utf8'); assert(/style\.css\?v=38/.test(h),f+' stale css cache version'); }

'''
assert marker in s
s = s.replace(marker, add + marker, 1)
p.write_text(s, encoding='utf-8')

p = Path('version.json')
s = p.read_text(encoding='utf-8')
s = re.sub(r'"version"\s*:\s*"[^"]+"', '"version": "0.168"', s)
p.write_text(s, encoding='utf-8')

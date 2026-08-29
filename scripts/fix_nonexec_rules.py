from pathlib import Path

p=Path('js/rules.js')
s=p.read_text(encoding='utf-8')
old="""function getNonExecEffectiveInterval(type, start, end) {
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
"""
new="""function getNonExecEffectiveInterval(type, start, end) {
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
"""
if old not in s:
    raise SystemExit('Expected getNonExecEffectiveInterval block not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')

p=Path('tests/run-tests.js')
s=p.read_text(encoding='utf-8')
# Replace old overlap total expectation if present.
s=s.replace("let nonRows=[{type:'escape',start:new Date(2026,0,1),end:new Date(2026,0,10)},{type:'interruption',start:new Date(2026,0,5),end:new Date(2026,0,12)}]; assert.equal(lr.__non(nonRows),10);",
            "let nonRows=[{type:'escape',start:new Date(2026,0,1),end:new Date(2026,0,10)},{type:'interruption',start:new Date(2026,0,5),end:new Date(2026,0,12)}]; assert.equal(lr.__non(nonRows),11);")
append="""
// Reguli perioade neexecutate: evadare/boală exclud doar prima zi; întreruperea exclude ambele capete.
let escape9=lr.__non([{type:'escape',start:new Date(2000,0,1),end:new Date(2000,0,10)}]); assert.equal(escape9,9);
let illness9=lr.__non([{type:'illness',start:new Date(2000,0,1),end:new Date(2000,0,10)}]); assert.equal(illness9,9);
let interruption8=lr.__non([{type:'interruption',start:new Date(2000,0,1),end:new Date(2000,0,10)}]); assert.equal(interruption8,8);
"""
if 'let escape9=' not in s:
    s += append
p.write_text(s,encoding='utf-8')

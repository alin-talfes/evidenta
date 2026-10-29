// ========== EXPORT / COPIERE / PAGINĂ REZULTATE ==========

function ensureCurrentCalculationForAction() {
    // Exporturile trebuie să consume structura produsă de motorul curent, nu rezultatul legacy „quick”.
    if (window.lastCalculation && !window.lastCalculation.quick) return true;
    const controller = window.EvidentaPedepseOperational;
    if (controller && controller.mode === 'quick' && typeof controller.setMode === 'function') {
        controller.setMode('full');
    }
    if (typeof window.calculatePedepseSafely === 'function') {
        window.calculatePedepseSafely();
    } else if (typeof window.calculateAll === 'function') {
        window.calculateAll();
    }
    return !!window.lastCalculation && !window.lastCalculation.quick;
}

function mapNonExecType(type) {
    switch (type) {
        case 'escape': return 'Evadare';
        case 'illness': return 'Boală provocată voit';
        case 'interruption': return 'Întrerupere';
        default: return type;
    }
}

function buildNarrativeText() {
    const calc = window.lastCalculation;
    if (!calc) {
        alert('Nu există rezultate de calcul. Apasă întâi „CALCULEAZĂ”.');
        return '';
    }

    const input = calc.inputData || {};
    const dedPeriodDays = Array.isArray(calc.dedIntervals) ? sumIntervals(calc.dedIntervals) : 0;
    const dedPeriods = Array.isArray(calc.dedIntervals) && calc.dedIntervals.length
        ? calc.dedIntervals.map(([a, b]) => `${fmtDate(a)}–${fmtDate(b)}`).join('; ')
        : '—';
    const recursDays = Number(calc.recursDays || 0);
    const nonPeriods = Array.isArray(calc.nonRowsData) && calc.nonRowsData.length
        ? calc.nonRowsData.map(p => `${mapNonExecType(p.type)} ${p.start}–${p.end}`).join('; ')
        : '—';
    const duration = calc.life
        ? 'Detențiune pe viață'
        : `${calc.duration?.y || 0} ani, ${calc.duration?.m || 0} luni, ${calc.duration?.d || 0} zile`;
    const lifeThresholdText = calc.life
        ? (calc.art === 'VCP551'
            ? `prag VCP art. 55¹ ${calc.lifeThresholdYears || (calc.vcpLifeElderlyApplied ? 15 : 20)} ani`
            : 'prag LC 20 ani')
        : '';

    const fractionText = (ratio) => {
        if (!Number.isFinite(ratio)) return '—';
        const known = [[1/100,'1/100'],[1/4,'1/4'],[1/3,'1/3'],[1/2,'1/2'],[2/3,'2/3'],[3/4,'3/4']];
        const found = known.find(([value]) => Math.abs(value - ratio) < 1e-9);
        return found ? found[1] : String(ratio);
    };

    const inputLines = [
        'INPUT',
        `DATA NAȘTERII: ${input.birthDate || fmtDate(calc.birthDate) || '—'}`,
        `ARTICOL / CONFIGURAȚIE algoritm liberare condiționată: ${calc.art || input.art || '—'}`,
        `DATA ÎNCEPERII PEDEPSEI: ${input.start || fmtDate(calc.startDate) || '—'}`,
        `DATA PRIMIRII ÎN PENITENCIAR/CENTRU: ${input.prisonReceived || (calc.prisonReceivedDate ? fmtDate(calc.prisonReceivedDate) : '—')}`,
        `PERIOADA: ${duration}`,
        `ZILE DEDUSE: ${dedPeriodDays} zile | PERIOADE: ${dedPeriods}`,
        `ZILE LEGEA 169/2017: ${recursDays} zile`,
        `ZILE NEEXECUTATE: ${calc.non || 0} zile | PERIOADE: ${nonPeriods}`
    ];

    const reanalysisText = calc.reanalysisLabel && calc.fDate
        ? `${calc.reanalysisLabel}: ${calc.fifth == null ? '' : `${calc.fifth} zile fără deduceri | `}DATA: ${fmtDate(calc.fDate)}`
        : (calc.isEducationalMeasure ? 'NU SE APLICĂ AUTOMAT 1/5 PENTRU MĂSURA EDUCATIVĂ' : '—');

    const outputLines = [
        'OUTPUT',
        `EXPIRARE REALĂ: ${calc.realExp ? fmtDate(calc.realExp) : '—'}`,
        `FRACȚIE MINIMĂ: ${calc.life ? lifeThresholdText : fractionText(calc.mR)} = ${calc.mDays ?? '—'} zile fără deduceri | DATA: ${calc.mDate ? fmtDate(calc.mDate) : '—'}`,
        `FRACȚIE TOTALĂ / PROPOZABILĂ: ${calc.life ? lifeThresholdText : fractionText(calc.tR)} = ${calc.tDays ?? '—'} zile fără deduceri | DATA: ${calc.tDate ? fmtDate(calc.tDate) : '—'}`,
        `PROPOZABILĂ DUPĂ ZILE MUNCITE: ${calc.life ? '—' : (calc.workDaysResult || fmtDate(calc.tDate) || '—')}${calc.life ? '' : ` | ZILE MUNCITE APLICATE: ${calc.workDaysApplied || 0}`}`,
        `REANALIZARE REGIM: ${reanalysisText}`,
        `CARANTINĂ: ${calc.quarantineEnd ? fmtDate(calc.quarantineEnd) : '— (necalculată fără data primirii în penitenciar/centru)'}`
    ];

    return inputLines.join('\n') + '\n\n' + outputLines.join('\n');
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('Rezumatul input/output a fost copiat.');
    } catch (e) {
        alert('Copierea a eșuat: ' + e.message);
    }
    document.body.removeChild(textarea);
}

function copyResults() {
    if (!ensureCurrentCalculationForAction()) {
        alert('Motorul actual nu a produs un rezultat valid. Verifică datele și apasă CALCULEAZĂ.');
        return;
    }
    const text = buildNarrativeText();
    if (!text) return;
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Rezumatul input/output a fost copiat.'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function getInputData() {
    if (window.lastCalculation?.inputData) return JSON.parse(JSON.stringify(window.lastCalculation.inputData));
    const dedRows = Array.from(document.querySelectorAll('.deduction-row')).map(r => ({ start: r.querySelector('.ded-start')?.value.trim() || '', end: r.querySelector('.ded-end')?.value.trim() || '' })).filter(r => r.start || r.end);
    const nonRows = Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({ type: r.querySelector('.ne-type')?.value || '', start: r.querySelector('.ne-start')?.value.trim() || '', end: r.querySelector('.ne-end')?.value.trim() || '' })).filter(r => r.start || r.end);
    return {
        sex: currentSex === 'M' ? 'Masculin' : 'Feminin',
        birthDate: document.getElementById('birthDate').value.trim(),
        observations: document.getElementById('observations').value.trim(),
        life: document.getElementById('lifeSentence').checked,
        art: document.getElementById('liberationArticle').value,
        y: document.getElementById('durYears').value,
        m: document.getElementById('durMonths').value,
        d: document.getElementById('durDays').value,
        start: document.getElementById('startDate').value.trim(),
        prisonReceived: document.getElementById('prisonReceivedDate')?.value.trim() || '',
        condRelease: document.getElementById('conditionalReleaseDate').value.trim(),
        dedRows,
        manDed: Array.from(document.querySelectorAll('.manual-days')).map(i => i.value),
        nonRows
    };
}

function buildResultsPageHTML() {
    const calc = window.lastCalculation;
    if (!calc) {
        alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.');
        return null;
    }

    const input = calc.inputData || getInputData();
    const lc = calc.lcDetails || { article: calc.articleInfo || calc.art || '—', sentenceBand: '', age: '—', minimum: '—', proposed: '—' };
    const duration = calc.life ? 'Detențiune pe viață' : `${calc.duration?.y || 0} ani, ${calc.duration?.m || 0} luni, ${calc.duration?.d || 0} zile`;
    const ded = (calc.dedIntervals || []).map(([a,b]) => `${fmtDate(a)}–${fmtDate(b)}`).join('; ') || '—';
    const non = (calc.nonRowsData || []).map(p => `${mapNonExecType(p.type)} ${p.start}–${p.end}`).join('; ') || '—';
    const row = (label, value, cls='') => `<div class="item ${cls}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? '—'))}</strong></div>`;

    const inputHtml = [
        row('Sex', calc.sex === 'M' ? 'Masculin' : 'Feminin'),
        row('Data nașterii', fmtDate(calc.birthDate)),
        row('Pedeapsă', duration, 'wide'),
        row('Început executare', fmtDate(calc.startDate)),
        input.prisonReceived ? row('Primire penitenciar/centru', input.prisonReceived) : '',
        row('Articol / configurație', lc.article + (lc.sentenceBand ? ` · ${lc.sentenceBand}` : '')),
        row('Perioade deduse', `${calc.ded} zile · ${ded}`, 'wide'),
        row('Recurs compensatoriu', `${calc.recursDays || 0} zile`),
        row('Perioade neexecutate', `${calc.non} zile · ${non}`, 'wide'),
        input.observations ? row('Observații', input.observations, 'wide') : ''
    ].join('');

    const reanalysisRow = calc.reanalysisLabel && calc.fDate
        ? row(calc.reanalysisLabel, fmtDate(calc.fDate))
        : (calc.isEducationalMeasure ? row('Reanalizare regim', '1/5 nu se aplică automat măsurii educative', 'wide') : '');

    const outputHtml = [
        row('Expirare teoretică', calc.theorExp ? fmtDate(calc.theorExp) : '—'),
        row('Expirare reală', calc.realExp ? fmtDate(calc.realExp) : '—', 'em'),
        row('Fracție minimă / prag', `${fmtDate(calc.mDate)} · ${lc.minimum}`, 'wide'),
        row('Fracție totală / data propozabilă', `${fmtDate(calc.tDate)} · ${lc.proposed}`, 'wide'),
        calc.workDaysResult ? row('Propozabilă după zile muncite', `${calc.workDaysResult} (${calc.workDaysApplied || 0} zile aplicate)`, 'wide') : '',
        reanalysisRow,
        calc.quarantineEnd ? row('Carantină expiră', `${fmtDate(calc.quarantineEnd)} · calculată de la primire`) : '',
        row('Condiție vârstă LC', lc.age, 'wide')
    ].join('');

    return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>Inmate Pocket Calculator — rezultat</title><style>@page{size:A4 portrait;margin:7mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#172033;margin:0;font-size:8.8pt;line-height:1.25}h1{font-size:14pt;text-align:center;margin:0 0 5mm}h2{font-size:9.5pt;margin:3mm 0 1.5mm;border-bottom:1px solid #b7c5d6;padding-bottom:1mm}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm}.item{border:1px solid #d5dfeb;border-radius:2mm;padding:1.7mm 2mm;break-inside:avoid}.item.wide{grid-column:1/-1}.item.em{border-width:1.5px;border-color:#2563eb}.item span{display:block;text-transform:uppercase;font-size:6.8pt;color:#5b6b7f;font-weight:700;letter-spacing:.03em;margin-bottom:.5mm}.item strong{font-size:8.5pt}.note{margin-top:2mm;padding:1.8mm 2mm;background:#f3f6fa;border-radius:2mm;font-size:7.4pt}.toolbar{text-align:center;margin-bottom:4mm}.toolbar button{padding:2mm 4mm;margin:0 1mm}.footer{text-align:center;margin-top:3mm;font-size:6.8pt;color:#6f8094}@media print{.toolbar{display:none}body{font-size:8.3pt}h1{margin-bottom:3mm}}</style></head><body><div class="toolbar"><button onclick="window.print()">Printează / Salvează PDF</button><button onclick="window.close()">Închide</button></div><h1>EVIDENȚĂ PEDEPSE ȘI LIBERARE CONDIȚIONATĂ</h1><h2>DATE INTRODUSE</h2><div class="grid">${inputHtml}</div><h2>REZULTATE</h2><div class="grid">${outputHtml}</div><div class="note"><strong>Regulă LC:</strong> ${escapeHtml(lc.article)} · ${escapeHtml(lc.sentenceBand || '')}<br>${escapeHtml(lc.age)}<br><strong>Minim:</strong> ${escapeHtml(lc.minimum)}<br><strong>Totală/propozabilă:</strong> ${escapeHtml(lc.proposed)}</div><div class="footer">Date generate local · Inmate Pocket Calculator · © Alin Talfeș</div></body></html>`;
}

function exportPDF() {
    if (!ensureCurrentCalculationForAction()) {
        alert('Motorul actual nu a produs un rezultat valid. Verifică datele și apasă CALCULEAZĂ.');
        return;
    }
    let html;
    try {
        html = buildResultsPageHTML();
        if (!html) return;
    } catch (e) {
        alert('Eroare la construirea paginii de rezultate: ' + e.message);
        return;
    }

    const resultWindow = window.open('', '_blank');
    if (resultWindow) {
        resultWindow.document.open();
        resultWindow.document.write(html);
        resultWindow.document.close();
        resultWindow.focus();
        return;
    }

    try {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rezultate-evidenta-ppl.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        alert('Fereastra nouă a fost blocată. Am descărcat pagina compactă de rezultate.');
    } catch (e) {
        alert('Eroare la deschiderea paginii de rezultate: ' + e.message);
    }
}

/* EXPORT PV INCARCERARE */
function pvEsc(v){return escapeHtml(String(v??''));}
function pvDate(v){if(!v)return '';if(v instanceof Date)return Number.isNaN(v.getTime())?'':fmtDate(v);const d=typeof parseDate==='function'?parseDate(String(v)):null;return d?fmtDate(d):String(v).trim();}
function pvLine(v,w=''){const s=v==null||v==='—'?'':String(v);return '<span class="pvline '+w+'">'+(s?pvEsc(s):'&nbsp;')+'</span>';}
function pvDuration(c){if(c.life)return 'detențiune pe viață';const d=c.duration||{};return [Number(d.y||0)?d.y+' ani':'',Number(d.m||0)?d.m+' luni':'',Number(d.d||0)?d.d+' zile':''].filter(Boolean).join(', ');}
function pvType(t){return t==='retention24h'?'Reținere 24 h':t==='preventive'?'Arest preventiv':t==='houseArrest'?'Arest la domiciliu':'Altă perioadă dedusă';}
function buildPvIncarcerareHTML(){
 const c=window.lastCalculation;if(!c){alert('Apasă întâi CALCULEAZĂ.');return null;}
 const i=c.inputData||getInputData(),life=!!c.life,duration=pvDuration(c),birth=pvDate(c.birthDate||i.birthDate),start=pvDate(c.startDate||i.start),expiry=pvDate(c.realExp),todayText=pvDate(new Date());
 const typed=Array.isArray(c.dedRowsData)?c.dedRowsData:(i.dedRows||[]).map(r=>({...r,label:pvType(r.type)}));
 const deductionRows=typed.filter(r=>r.start||r.end).map(r=>({label:r.label||pvType(r.type),start:r.start||'',end:r.type==='retention24h'?'':(r.end||''),days:Number(r.days||0)}));
 const arrestPeriods=deductionRows.filter(r=>/arest preventiv|reținere|arest la domiciliu/i.test(r.label));
 const arrestText=arrestPeriods.length?arrestPeriods.map(r=>pvEsc(r.start)+(r.end?' – '+pvEsc(r.end):'')+(r.days?' ('+pvEsc(r.days)+' zile)':'')).join('; '):'—';
 const manualRows=(i.manDed||[]).map(v=>Math.max(0,parseInt(v,10)||0)).filter(v=>v>0);
 const recurs=manualRows.reduce((a,b)=>a+b,0),ded=Number(c.ded||0),nonDays=Number(c.non||0);
 const recursText=manualRows.length?manualRows.map((days,n)=>'tranșa '+(n+1)+': '+days+' zile').join('; '):'';
 const nonRows=(c.nonRowsData||[]).filter(r=>r.start||r.end||Number(r.days||0)>0);
 const nonText=nonRows.length?nonRows.map(r=>pvEsc(mapNonExecType(r.type))+': '+pvEsc(r.start||'dată început necompletată')+(r.end?' – '+pvEsc(r.end):'')+' ('+Number(r.days||0)+' zile)').join('; '):'';
 const end=life?'detențiune pe viață':(expiry==='—'?'':expiry);
 return \`<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PROCES-VERBAL DE CONFIRMARE</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{color:#111;font:12pt/1 "Times New Roman",serif;margin:0}.toolbar{text-align:center;margin-bottom:18px;font:14px Arial}.toolbar button{padding:8px 14px;background:#fff;border:1px solid #444}.doc{max-width:186mm;margin:auto}h1{text-align:center;font-size:12pt;margin:0 0 1mm}.sub{text-align:center;font-weight:bold;text-transform:uppercase;margin:0 0 3mm}p{margin:0 0 1.5mm;text-align:justify}.pvline{display:inline-block;min-width:22mm;min-height:5mm;border-bottom:1px solid #111;padding:0 1mm;text-align:center}.medium{min-width:35mm}.long{min-width:58mm}.wide{min-width:75mm}.block{display:block;width:100%;min-height:7mm;border-bottom:1px solid #111;margin-bottom:3mm}.sign{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-top:4mm;text-align:center;break-inside:avoid}.sign span{display:block;margin-top:9mm;border-bottom:1px solid #111;min-height:4mm}@media screen{body{padding:16px;background:#eee}.doc{background:white;max-width:210mm;min-height:297mm;padding:10mm 12mm;box-shadow:0 2px 16px #0002}}@media print{.toolbar{display:none}.doc{max-width:none;min-height:0;padding:10mm 12mm;break-after:avoid;page-break-after:avoid}.doc .sign{break-inside:avoid;page-break-inside:avoid}}</style></head><body><div class="toolbar"><button onclick="window.print()">Printează / Salvează PDF</button> <button onclick="window.close()">Închide</button></div><main class="doc"><h1>PROCES-VERBAL DE CONFIRMARE</h1><p class="sub">A PRIMIRII PERSOANELOR CONDAMNATE ÎN BAZA MANDATULUI DE EXECUTARE A PEDEPSEI ÎNCHISORII/DETENȚIUNII PE VIAȚĂ</p>
<p>Către,<br>Instanța (emitentă a mandatului de executare/detențiunii pe viață) \${pvLine('', 'wide')}</p>
<p>Noi, directorul \${pvLine('', 'long')} asistat de șeful structurii evidență deținuți, astăzi \${pvLine(todayText,'medium')}, am primit la acest loc de deținere pe numitul(a) \${pvLine('', 'long')}, fiul/fiica lui \${pvLine('', 'medium')} și al(a) \${pvLine('', 'medium')}, născut(ă) la \${pvLine(birth,'medium')}, în \${pvLine('', 'long')}, CNP \${pvLine('', 'medium')}, cu domiciliul în</p>\${pvLine('', 'block')}
<p>În baza mandatului de executare nr. \${pvLine('', 'medium')} din \${pvLine('', 'medium')}, emis de \${pvLine('', 'long')}, conform hotărârii penale nr. \${pvLine('', 'medium')} din data de \${pvLine('', 'medium')}, prin care a fost condamnat(ă) la \${pvLine(duration,'medium')} \${pvEsc(life?'detențiune pe viață':'închisoare')}, pentru săvârșirea infracțiunii prevăzute de</p>\${pvLine('', 'block')}
<p>Persoana a fost înregistrată sub numărul \${pvLine('', 'medium')}.</p>
<p>A fost arestat(ă) la data de \${pvLine('', 'medium')} de către \${pvLine('', 'long')}. Pedeapsa a început la data de \${pvLine(start,'medium')} și urmează să expire în termen la data de \${pvLine(end,'medium')}, întrucât se scad \${pvEsc(ded)} zile, arest preventiv/reținere/arest la domiciliu executate în perioada \${arrestText}, precum și un număr de \${pvEsc(recurs)} zile considerate executate suplimentar ca măsură compensatorie\${manualRows.length?' ('+pvEsc(recursText)+')':''}, și se adaugă un număr de \${pvEsc(nonDays)} zile\${nonRows.length?' ('+nonText+')':''}.</p>
<p>Prezentul proces-verbal a fost emis și comunicat în baza art. 557 alin. (7) și (8) din Codul de procedură penală.</p>
<div class="sign"><div><strong>Director</strong><span></span></div><div><strong>Șef structură evidență deținuți</strong><span></span></div></div></main></body></html>\`;
}
function buildNotaInternaHTML(){
 const c=window.lastCalculation;if(!c){alert('Apasă întâi CALCULEAZĂ.');return null;}
 const i=c.inputData||getInputData(),life=!!c.life,fmt=(v)=>pvDate(v),start=fmt(c.startDate||i.start),expiry=fmt(c.realExp),birth=fmt(c.birthDate||i.birthDate),duration=pvDuration(c),ded=Number(c.ded||0),manual=(i.manDed||[]).map(v=>Math.max(0,parseInt(v,10)||0)).filter(v=>v>0).reduce((a,b)=>a+b,0),recurs=Math.max(Number(c.recursDays||0),manual),nonDays=Number(c.non||0);
 const rows=Array.isArray(c.dedRowsData)?c.dedRowsData:(i.dedRows||[]).map(r=>({...r,label:pvType(r.type)}));
 const deductionText=rows.filter(r=>r.start||r.end).map(r=>(r.label||pvType(r.type))+': '+(r.start||'dată necompletată')+(r.end?' – '+r.end:'')+(r.days?' ('+r.days+' zile)':'')).join('; ');
 const nonText=(c.nonRowsData||[]).map(r=>mapNonExecType(r.type)+': '+(r.start||'')+(r.end?' – '+r.end:'')+' ('+Number(r.days||0)+' zile)').join('; ');
 const facts=[
 'Persoana este condamnată la '+(life?'detențiune pe viață':duration)+'. Data începerii executării pedepsei înregistrată în calcul este '+(start||'necompletată')+'.',
 'Data expirării pedepsei după aplicarea ajustărilor înregistrate în aplicație este '+(expiry||'necompletată')+'.',
 'În calcul sunt înregistrate '+ded+' zile deduse în total. Zile considerate executate suplimentar cu titlu compensatoriu: '+recurs+'.'+(deductionText?' Perioade deduse: '+deductionText+'.':' Nu sunt introduse detalii calendaristice pentru perioadele deduse.'),
 (nonDays?'Sunt înregistrate '+nonDays+' zile pentru perioade care nu se consideră executate.':'Nu sunt înregistrate zile pentru perioade care nu se consideră executate.')+(nonText?' Detalii: '+nonText+'.':''),
 'Data pragului minim pentru liberare condiționată indicată de calcul este '+(fmt(c.mDate)||'necalculată')+', iar data fracției totale/propozabile este '+(fmt(c.workDaysResult||c.tDate)||'necalculată')+'. Aceste rezultate trebuie confruntate cu mandatul, hotărârea penală, actele privind arestarea preventivă și celelalte înscrisuri din dosarul individual.',
 'Compartimentul Organizarea Muncii este rugat să verifice concordanța datelor și perioadelor de deducere/adăugare cu documentele justificative și să efectueze operațiunile ce intră în competența sa. Nota sintetizează datele disponibile în aplicație și nu înlocuiește actele judiciare sau verificarea de specialitate.'
 ];
 const fields=[['Nume și prenume',''],['Fiul/fiica lui',''],['și al/a',''],['Data nașterii',birth],['Locul nașterii',''],['CNP',''],['Domiciliul',''],['Număr matricol',''],['Mandat de executare nr.',''],['Hotărârea penală nr.',''],['Instanța emitentă','']];
 const trs=fields.map(([k,v])=>'<tr><th>'+pvEsc(k)+'</th><td>'+(v?pvEsc(v):'&nbsp;')+'</td></tr>').join('');
 const ps=facts.map(p=>'<p>'+pvEsc(p)+'</p>').join('');
 return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>NOTĂ INTERNĂ</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;color:#111;font:10pt/1 "Times New Roman",serif}.toolbar{text-align:center;margin-bottom:12px;font:13px Arial}.toolbar button{padding:7px 12px;border:1px solid #555;background:white}.page{width:100%;min-height:281mm;display:flex;flex-direction:column}.heading{text-align:center;margin:0 0 1.5mm}.heading h1{font-size:10pt;letter-spacing:0;margin:0 0 .7mm}.heading h2{font-size:10pt;margin:0;text-transform:uppercase}.to{font-weight:bold;margin:0 0 1.5mm}.columns{display:grid;grid-template-columns:39% 61%;border:1px solid #222;align-items:stretch}.left{border-right:1px solid #222}.left h3,.right h3{font-size:10pt;text-align:center;text-transform:uppercase;margin:0;padding:.7mm;border-bottom:1px solid #222}.left table{width:100%;border-collapse:collapse;font-size:10pt}.left th,.left td{border-bottom:1px solid #aaa;padding:.7mm;text-align:left;vertical-align:top}.left th{width:42%;font-weight:normal}.left td{height:4.5mm}.right{padding:0 1.2mm .7mm}.right h3{margin:0 -1.2mm 1mm}.right p{margin:0 0 1mm;text-align:justify}.right p:last-child{margin-bottom:0}.foot{margin-top:2mm;padding-top:1mm;display:grid;grid-template-columns:1fr 1fr;gap:12mm;break-inside:avoid}.footbox{font-weight:bold;border-top:1px solid #111;padding-top:.7mm;min-height:12mm}.footline{margin-top:4mm;border-bottom:1px solid #111;height:2.5mm}@media screen{body{background:#eee;padding:16px}.page{background:white;max-width:210mm;min-height:297mm;margin:auto;padding:8mm 9mm;box-shadow:0 2px 14px #0002}}@media print{.toolbar{display:none}.page{width:100%;min-height:0;height:auto;padding:8mm 9mm;break-after:avoid;page-break-after:avoid}.foot{break-inside:avoid;page-break-inside:avoid}}</style></head><body><div class="toolbar"><button onclick="window.print()">Printează / Salvează PDF</button><button onclick="window.close()">Închide</button></div><main class="page"><header class="heading"><h1>NOTĂ INTERNĂ</h1><h2>Către Compartimentul Organizarea Muncii</h2></header><p class="to">Obiect: Situația juridică și datele de executare a pedepsei persoanei private de libertate</p><section class="columns"><div class="left"><h3>Date de stare civilă și identificare</h3><table>${trs}</table></div><div class="right"><h3>Situația juridică și executarea pedepsei</h3>${ps}</div></section><footer class="foot"><div class="footbox">AM PRIMIT<div class="footline"></div><div class="footline"></div></div><div class="footbox">AM PREDAT<div class="footline"></div><div class="footline"></div></div></footer></main></body></html>`;
}
function exportPvIncarcerarePDF(){if(!ensureCurrentCalculationForAction()){alert('Motorul actual nu a produs un rezultat valid. Verifică datele și apasă CALCULEAZĂ.');return;}let html;try{html=buildPvIncarcerareHTML();if(!html)return;const nota=buildNotaInternaHTML();if(!nota)return;const css=nota.match(/<style>([\s\S]*?)<\/style>/);const page=nota.match(/<main class="page">([\s\S]*?)<\/main>/);if(!css||!page)throw new Error('Structura notei interne este incompletă');html=html.replace('</head>','<style>'+css[1]+'</style></head>').replace('</main></body></html>','</main><main class="page" style="page-break-before:always;break-before:page">'+page[1]+'</main></body></html>');}catch(e){console.error(e);alert('Nu s-a putut pregăti procesul-verbal și nota internă.');return;}const standalone=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches;const w=standalone?null:window.open('','_blank');if(w){w.document.open();w.document.write(html);w.document.close();w.focus();return;}if(!standalone){console.warn('Fereastra nouă a fost blocată; se folosește vizualizarea de tipărire în aceeași fereastră.');}html=html.replace('<button onclick="window.print()">Printează / Salvează PDF</button> <button onclick="window.close()">Închide</button>','<button type="button" id="pvPrintButton">Printează / Salvează PDF</button> <a id="pvBackButton" href="./" style="display:inline-block;padding:8px 14px;margin-left:8px;border:1px solid #444;background:#fff;color:#111;text-decoration:none;font:14px Arial">Înapoi la aplicație</a>');document.open();document.write(html);document.close();const printButton=document.getElementById('pvPrintButton');if(printButton)printButton.addEventListener('click',()=>{window.focus();window.print();});}

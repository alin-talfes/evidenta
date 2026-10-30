(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const caseType = $('caseType');
const guidance = $('caseGuidance');

const caseRules = {
 request: {
  title: 'Cerere de transfer formulată de persoana condamnată',
  tone: 'success',
  text: 'Circuit principal: art. 45 alin. (2) din Legea nr. 254/2013. Comisia prevăzută la art. 32 emite un aviz consultativ, motivat. Transferul este dispus de directorul general ANP. Utilizează anexa nr. 16 din Instrucțiunile OMJ nr. 2.188/C/2022.'
 },
 admin: {
  title: 'Propunere de transfer inițiată de administrație',
  tone: 'warning',
  text: 'Nu este o cerere obișnuită a PPL. Se verifică situația prevăzută de art. 108 din HG nr. 157/2016 și circuitul art. 68–71 din Instrucțiunile OMJ nr. 2.188/C/2022. Pentru propunerile comisiei din circuitul art. 68–70 se utilizează anexa nr. 15.'
 },
 provisional: {
  title: 'Transfer după stabilirea provizorie a regimului',
  tone: 'warning',
  text: 'Circuit distinct: art. 45 alin. (1) din Legea nr. 254/2013 și art. 68 alin. (2) din Instrucțiuni. Transferul se dispune de directorul locului de deținere, potrivit profilării. Nu îl trata automat ca cerere de transfer la ANP.'
 },
 judicial: {
  title: 'Transfer solicitat pentru activitatea unui organ judiciar',
  tone: 'warning',
  text: 'Circuit distinct: art. 45 alin. (3)–(4) din Legea nr. 254/2013 și art. 68 alin. (3)–(4), art. 78 din Instrucțiuni. Se urmează solicitarea/circuitul organului judiciar; nu se substituie procedurii cererilor obișnuite de transfer.'
 },
 third: {
  title: 'Cerere formulată de aparținător / altă persoană',
  tone: 'warning',
  text: 'Potrivit art. 73 alin. (3) din Instrucțiuni și art. 108 alin. (3) din HG nr. 157/2016, cererea intră în procedura de transfer numai dacă este însușită expres de PPL. În lipsa însușirii nu se emite aviz negativ pe fond; se comunică această condiție procedurală.'
 },
 legal: {
  title: 'Situație juridică specială',
  tone: 'error',
  text: 'Oprire pentru verificare juridică: arestarea preventivă, măsura educativă privativă de libertate ori un transfer temporar judiciar pot avea temei și circuit distinct. Nu aplica automat art. 45 alin. (2); identifică norma și autoritatea competente.'
 }
};

function renderGuidance() {
 const item = caseRules[caseType.value] || caseRules.request;
 guidance.className = 'committee-result ' + item.tone;
 guidance.innerHTML = '<strong>' + item.title + '</strong><p>' + item.text + '</p>';
}
caseType.addEventListener('change', renderGuidance);
renderGuidance();

document.querySelectorAll('[data-tab]').forEach(btn => {
 btn.addEventListener('click', () => {
  const tab = btn.dataset.tab;
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
  document.querySelectorAll('.committee-pane').forEach(p => p.hidden = p.id !== 'pane-' + tab);
 });
});

function parseDate(value) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
 const [y,m,d] = value.split('-').map(Number);
 const date = new Date(Date.UTC(y,m-1,d));
 if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m-1 || date.getUTCDate() !== d) return null;
 return date;
}
function addCalendarDays(date, days) {
 const result = new Date(date.getTime());
 result.setUTCDate(result.getUTCDate() + days);
 return result;
}
function iso(date) { return date.toISOString().slice(0,10); }
function localTodayIso() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10); }
function roDate(date) { return new Intl.DateTimeFormat('ro-RO',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(date); }
function calculate() {
 const useTransferred = $('wronglyForwarded').value === 'yes';
 const dateText = useTransferred ? ($('competentDate').value || $('receivedDate').value) : $('receivedDate').value;
 const start = parseDate(dateText);
 const extension = Number($('extensionDays').value);
 const notified = $('extensionNotified').value === 'yes';
 const result = $('deadlineResult');
 if (!start) {
  result.className='committee-result error';
  result.textContent=useTransferred ? 'Introdu data înregistrării la autoritatea competentă (sau data înregistrării inițiale, dacă aceeași instituție este competentă).' : 'Introdu o dată validă a înregistrării.';
  return;
 }
 if (!Number.isInteger(extension) || extension < 0 || extension > 15) {
  result.className='committee-result error'; result.textContent='Prelungirea trebuie să fie un număr întreg între 0 și 15 zile.'; return;
 }
 if (extension > 0 && !notified) {
  result.className='committee-result error';
  result.textContent='Prelungirea nu poate fi tratată ca aplicată în calculator fără notificarea prealabilă a petentului. Verifică respectarea art. 9 OG nr. 27/2002.';
  return;
 }
 const base = addCalendarDays(start,30);
 const finalDate = addCalendarDays(base,extension);
 const now = parseDate(new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10));
 const remaining = Math.ceil((finalDate-now)/86400000);
 result.className='committee-result ' + (remaining < 0 ? 'error' : remaining <= 5 ? 'warning' : 'success');
 result.innerHTML = '<div class="committee-kpis"><div class="committee-kpi"><strong>' + roDate(base) + '</strong><span>Termen standard (30 zile)</span></div><div class="committee-kpi"><strong>' + roDate(finalDate) + '</strong><span>Termen calculat</span></div><div class="committee-kpi"><strong>' + (remaining < 0 ? 'Depășit cu ' + Math.abs(remaining) : remaining===0 ? 'Astăzi' : remaining + ' zile') + '</strong><span>Raportat la data curentă</span></div></div><p>Data de referință: ' + roDate(start) + (useTransferred ? ' — înregistrarea la autoritatea competentă, conform art. 8 alin. (2).' : ' — înregistrarea petiției.') + '</p>' + (extension ? '<p>Prelungire: ' + extension + ' zile, cu notificare prealabilă indicată ca efectuată.</p>' : '<p>Nu a fost introdusă prelungire.</p>') + '<p><strong>Verifică ultima zi calendaristică și eventualele reguli generale de calcul al termenelor.</strong></p>';
}
$('calculateDeadline').addEventListener('click',calculate);
$('todayDeadline').addEventListener('click',()=>{$('receivedDate').value=localTodayIso();$('wronglyForwarded').value='no';calculate();});

$('generateOpinion').addEventListener('click',()=>{
 const positive=$('opinionType').value==='positive';
 const reasons=$('reasons').value.trim();
 const destination=$('destination').value.trim() || '[unitatea/zonă solicitată]';
 if (!reasons) { $('opinionOutput').value='Completează motivarea cu fapte concrete și verificate înainte de generare.'; return; }
 const text = 'Analizând cererea formulată de persoana privată de libertate [nume], prin care solicită transferul la ' + destination + ', comisia a examinat motivele invocate și datele relevante din evidențele unității.\n\n' + reasons + '\n\n' + (positive ? 'Având în vedere motivele concrete invocate și datele verificate, comisia apreciază că solicitarea este justificată.\nAVIZ: FAVORABIL solicitării de transfer la ' + destination + ', cu caracter consultativ. Dispunerea transferului revine autorității competente, în condițiile art. 45 alin. (2) din Legea nr. 254/2013.' : 'Elementele verificate nu susțin favorabilitatea solicitării, pentru motivele individualizate mai sus.\nAVIZ: NEGATIV, cu caracter consultativ; acesta nu reprezintă dispoziția finală a directorului general ANP.') + '\n\nData: [data]    Președinte și membri: [semnături]    Secretar: [semnătură]';
 $('opinionOutput').value=text;
});
$('copyOpinion').addEventListener('click',async()=>{
 const output=$('opinionOutput');
 if (!output.value.trim()) { output.focus(); return; }
 try {
  await navigator.clipboard.writeText(output.value);
  $('copyOpinion').textContent='Copiat';
  setTimeout(()=> $('copyOpinion').textContent='Copiază textul',1600);
 } catch { output.focus(); output.select(); document.execCommand('copy'); }
});
})();

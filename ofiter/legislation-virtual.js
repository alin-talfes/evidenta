(()=>{
  if(window.TRAINING_LEGISLATION_VIRTUAL)return;
  window.TRAINING_LEGISLATION_VIRTUAL="virtual-v2";
  const INITIAL=8,STEP=12,limits=new Map();
  const esc=value=>typeof escapeHtml==="function"?escapeHtml(String(value??"")):String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const textOf=a=>[a.number,a.heading,a.intro,...(a.items||[]),...(a.subsections||[]).flatMap(s=>[s.intro,...(s.items||[])])].join(" ").toLowerCase();
  function render(){
    const host=document.getElementById("legislation-content");if(!host||!Array.isArray(legislationActs))return;
    const query=(document.getElementById("legislation-search")?.value||"").trim().toLowerCase(),filter=document.getElementById("legislation-act")?.value||"all";
    const acts=legislationActs.filter(act=>filter==="all"||act.id===filter);
    host.innerHTML=acts.map(act=>{
      const matching=(act.articles||[]).filter(article=>!query||textOf(article).includes(query));
      const limit=query?Math.max(20,limits.get(act.id)||INITIAL):(limits.get(act.id)||INITIAL),visible=matching.slice(0,limit),remaining=Math.max(0,matching.length-visible.length);
      const articles=visible.length?visible.map(article=>typeof renderLegalArticle==="function"?renderLegalArticle(article):`<article class="legal-article"><h3>${esc(article.number)} · ${esc(article.heading)}</h3><p>${esc(article.intro)}</p></article>`).join(""):'<div class="empty">Niciun articol nu corespunde căutării.</div>';
      return `<section class="legal-act" data-virtual-act="${esc(act.id)}"><header><div><p class="eyebrow">${esc(act.scope)}</p><h2>${esc(act.title)}</h2></div><div class="legal-act-actions"><span class="integration-status ${act.status==="integrat"?"done":"pending"}">${act.status==="integrat"?"✓ Integrat":"În curs de integrare"}</span><a class="official-link" href="${esc(act.url)}" target="_blank" rel="noopener">Forma consolidată ↗</a></div></header>${act.articles?.length?articles:'<div class="legal-placeholder">Textul selectat este în curs de verificare și integrare.</div>'}${remaining?`<button type="button" class="secondary legislation-more" data-legislation-more="${esc(act.id)}">Încarcă încă ${Math.min(STEP,remaining)} · ${remaining} rămase</button>`:""}</section>`;
    }).join("");
  }
  document.getElementById("legislation-content")?.addEventListener("click",event=>{const button=event.target.closest("[data-legislation-more]");if(!button)return;const id=button.dataset.legislationMore;limits.set(id,(limits.get(id)||INITIAL)+STEP);requestAnimationFrame(render)});
  const search=document.getElementById("legislation-search");if(search){search.oninput=render;search.addEventListener("input",()=>{limits.clear()},{capture:true})}
  const select=document.getElementById("legislation-act");if(select){select.onchange=()=>{limits.clear();render()};select.addEventListener("change",()=>{limits.clear()},{capture:true})}
  renderLegislation=render;render();
})();

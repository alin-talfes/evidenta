(function () {
  "use strict";
  const data = window.INSTRUCTAJ_DATA;
  const list = document.getElementById("workflow-list");
  const detail = document.getElementById("workflow-detail");
  const search = document.getElementById("search");
  const filters = document.getElementById("category-filters");
  const count = document.getElementById("result-count");
  const refs = document.getElementById("code-references");
  const storageKey = "evidenta-instructaj-progress-v1";
  let category = "Toate";
  let selected = null;
  let progress = loadProgress();

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (_) { return {}; }
  }
  function saveProgress() { localStorage.setItem(storageKey, JSON.stringify(progress)); }
  function esc(value) {
    return String(value).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[ch]);
  }
  function filtered() {
    const q = search.value.trim().toLocaleLowerCase("ro");
    return data.workflows.filter(w => (category === "Toate" || w.category === category) && (!q || [w.title,w.summary,w.category,...w.legal,...w.steps].join(" ").toLocaleLowerCase("ro").includes(q)));
  }
  function renderFilters() {
    filters.innerHTML = ["Toate", ...data.categories].map(name => `<button type="button" class="filter${category===name?" active":""}" data-category="${esc(name)}">${esc(name)}</button>`).join("");
  }
  function renderList() {
    const items = filtered();
    count.textContent = `${items.length} ${items.length === 1 ? "procedură" : "proceduri"}`;
    list.innerHTML = items.map(w => {
      const done = Object.keys(progress[w.id] || {}).filter(k => progress[w.id][k]).length;
      return `<button type="button" class="workflow-card${selected===w.id?" selected":""}" data-id="${esc(w.id)}">
        <span class="card-meta">${esc(w.category)} · ${w.steps.length} pași</span>
        <strong>${esc(w.title)}</strong><span>${esc(w.summary)}</span>
        ${done ? `<small>${done}/${w.steps.length} pași bifați</small>` : ""}
      </button>`;
    }).join("") || `<p class="empty">Nu am găsit o procedură pentru această căutare.</p>`;
  }
  function renderDetail(id, focus) {
    const w = data.workflows.find(item => item.id === id);
    if (!w) { detail.innerHTML = ""; return; }
    selected = id;
    const state = progress[id] || {};
    detail.innerHTML = `<div class="detail-head"><div><span class="badge">${esc(w.category)}</span><h2>${esc(w.title)}</h2><p>${esc(w.summary)}</p></div><button class="close-detail" type="button" aria-label="Închide fișa">×</button></div>
      <div class="legal-box"><span>Temei principal</span>${w.legal.map(x=>`<strong>${esc(x)}</strong>`).join("")}</div>
      <div class="trigger"><strong>Când folosești fișa:</strong> ${esc(w.trigger)}</div>
      <section><h3>Pașii de lucru</h3><ol class="steps">${w.steps.map((step,i)=>`<li><label><input type="checkbox" data-step="${i}" ${state[i]?"checked":""}><span><b>Pasul ${i+1}</b>${esc(step)}</span></label></li>`).join("")}</ol></section>
      <div class="two-columns"><section class="check-panel"><h3>Control înainte de finalizare</h3><ul>${w.checks.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section><section class="warning-panel"><h3>Erori frecvente</h3><ul>${w.pitfalls.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section></div>
      ${w.codeNote?`<section class="code-note"><h3>Legătura cu Codul penal/procedural</h3><p>${esc(w.codeNote)}</p></section>`:""}
      <p class="source-note">Explicație practică elaborată pe baza articolelor indicate. Pentru decizia concretă se citește textul integral și forma consolidată oficială.</p>`;
    renderList();
    if (focus) detail.focus({preventScroll:true});
  }
  function renderReferences() {
    refs.innerHTML = data.codeReferences.map(r => `<article><span>${esc(r.code)}</span><h3>${esc(r.articles)}</h3><p>${esc(r.role)}</p></article>`).join("");
  }

  filters.addEventListener("click", e => {
    const btn = e.target.closest("[data-category]"); if (!btn) return;
    category = btn.dataset.category; renderFilters(); renderList();
  });
  search.addEventListener("input", renderList);
  list.addEventListener("click", e => {
    const card = e.target.closest("[data-id]"); if (!card) return;
    renderDetail(card.dataset.id, true);
    detail.scrollIntoView({behavior:"smooth", block:"start"});
    history.replaceState(null,"",`#${card.dataset.id}`);
  });
  detail.addEventListener("change", e => {
    if (!e.target.matches("[data-step]") || !selected) return;
    progress[selected] = progress[selected] || {};
    progress[selected][e.target.dataset.step] = e.target.checked;
    saveProgress(); renderList();
  });
  detail.addEventListener("click", e => {
    if (!e.target.closest(".close-detail")) return;
    selected = null; detail.innerHTML = ""; renderList(); history.replaceState(null,"",location.pathname);
  });
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!Object.keys(progress).length || confirm("Resetezi toate bifările salvate pe acest dispozitiv?")) {
      progress = {}; saveProgress(); renderList(); if (selected) renderDetail(selected, false);
    }
  });

  renderFilters(); renderList(); renderReferences();
  const hash = decodeURIComponent(location.hash.slice(1));
  if (data.workflows.some(w => w.id === hash)) renderDetail(hash, false);
})();

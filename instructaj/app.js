(function () {
  "use strict";

  const data = window.INSTRUCTAJ_DATA;
  const list = document.getElementById("workflow-list");
  const detail = document.getElementById("workflow-detail");
  const search = document.getElementById("search");
  const filters = document.getElementById("category-filters");
  const count = document.getElementById("result-count");
  const refs = document.getElementById("code-references");
  const glossary = document.getElementById("glossary");

  let category = "Toate";
  let selected = null;

  function esc(value) {
    return String(value).replace(/[&<>\"]/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;"
    })[ch]);
  }

  function normalizeLearningUi() {
    const heroPanel = document.querySelector(".hero-panel");
    if (heroPanel) {
      heroPanel.innerHTML = `
        <div class="hero-panel-head">
          <span class="status-dot" aria-hidden="true"></span>
          <span>Mod de studiu</span>
        </div>
        <div class="study-guide">
          <div><span>1</span><p><strong>Înțelege baza juridică</strong><small>Acte, definitivare, MEPI, deduceri și liberare.</small></p></div>
          <div><span>2</span><p><strong>Deschide situația de lucru</strong><small>Procedura este prezentată în ordine logică, fără checklist.</small></p></div>
          <div><span>3</span><p><strong>Verifică temeiul</strong><small>Compară întotdeauna cu actul concret și norma consolidată.</small></p></div>
        </div>
        <div class="hero-actions">
          <a class="button primary" href="#fundamente">Începe cu bazele</a>
          <a class="button secondary" href="#proceduri">Mergi la proceduri</a>
        </div>`;
    }

    const proceduresIntro = document.querySelector("#proceduri .section-heading p:last-child");
    if (proceduresIntro) {
      proceduresIntro.textContent = "Alege o situație și urmărește explicația în ordinea logică a operațiunilor. Pașii sunt material de studiu, fără bifare sau progres artificial.";
    }

    const legacySequence = document.querySelector(".learning-checklist");
    if (legacySequence) legacySequence.className = "study-sequence";

    const methodItems = document.querySelectorAll(".method-card li");
    for (const item of methodItems) {
      if (item.textContent.toLocaleLowerCase("ro").includes("bifează")) {
        item.innerHTML = "<strong>Lucrează în ordinea din fișă</strong> și tratează fiecare pas ca reper procedural, nu ca simplă listă mecanică.";
      }
    }
  }

  function filtered() {
    const q = search.value.trim().toLocaleLowerCase("ro");
    return data.workflows.filter(workflow => {
      const matchesCategory = category === "Toate" || workflow.category === category;
      const haystack = [
        workflow.title,
        workflow.summary,
        workflow.category,
        ...workflow.legal,
        ...workflow.steps,
        workflow.responsible,
        workflow.deadline,
        workflow.result,
        workflow.stop,
        workflow.practice,
        ...workflow.documents,
        ...workflow.legalRules
      ].join(" ").toLocaleLowerCase("ro");
      return matchesCategory && (!q || haystack.includes(q));
    });
  }

  function renderFilters() {
    filters.innerHTML = ["Toate", ...data.categories].map(name => `
      <button type="button" class="filter${category === name ? " active" : ""}" data-category="${esc(name)}">
        ${esc(name)}
      </button>
    `).join("");
  }

  function renderList() {
    const items = filtered();
    count.textContent = `${items.length} ${items.length === 1 ? "procedură" : "proceduri"}`;

    list.innerHTML = items.map((workflow, index) => `
      <button type="button"
        class="workflow-card${selected === workflow.id ? " selected" : ""}"
        data-id="${esc(workflow.id)}">
        <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="card-meta">${esc(workflow.category)} · ${workflow.steps.length} pași</span>
        <strong>${esc(workflow.title)}</strong>
        <span class="workflow-summary">${esc(workflow.summary)}</span>
        <small>Deschide fișa →</small>
      </button>
    `).join("") || `<p class="empty">Nu am găsit o procedură pentru această căutare.</p>`;
  }

  function renderDetail(id, focus) {
    const workflow = data.workflows.find(item => item.id === id);
    if (!workflow) {
      detail.innerHTML = "";
      return;
    }

    selected = id;

    detail.innerHTML = `
      <div class="detail-head">
        <div>
          <span class="badge">${esc(workflow.category)}</span>
          <h2>${esc(workflow.title)}</h2>
          <p>${esc(workflow.summary)}</p>
        </div>
        <button class="close-detail" type="button" aria-label="Închide fișa">×</button>
      </div>

      <div class="legal-box">
        <span>Temei principal</span>
        ${workflow.legal.map(item => `<strong>${esc(item)}</strong>`).join("")}
      </div>

      <div class="trigger"><strong>Când folosești fișa:</strong> ${esc(workflow.trigger)}</div>

      <div class="operational-grid">
        <section><span class="panel-label">Responsabilitate</span><h3>Cine răspunde</h3><p>${esc(workflow.responsible)}</p></section>
        <section><span class="panel-label">Moment</span><h3>Când trebuie făcut</h3><p>${esc(workflow.deadline)}</p></section>
        <section><span class="panel-label">Input</span><h3>Documente necesare</h3><ul>${workflow.documents.map(item => `<li>${esc(item)}</li>`).join("")}</ul></section>
        <section><span class="panel-label">Output</span><h3>Rezultatul corect</h3><p>${esc(workflow.result)}</p></section>
      </div>

      <section class="mandatory-panel">
        <span class="panel-label">Regulă obligatorie</span>
        <h3>Ce cere norma</h3>
        <ul>${workflow.legalRules.map(item => `<li>${esc(item)}</li>`).join("")}</ul>
      </section>

      <section class="steps-section">
        <div class="steps-heading">
          <div><span class="panel-label">Ordine procedurală</span><h3>Pașii de lucru</h3></div>
          <small>Material de studiu · fără bifare</small>
        </div>
        <ol class="study-steps">
          ${workflow.steps.map((step, index) => `
            <li>
              <span class="step-number">${String(index + 1).padStart(2, "0")}</span>
              <div><b>Pasul ${index + 1}</b><p>${esc(step)}</p></div>
            </li>
          `).join("")}
        </ol>
      </section>

      <div class="two-columns">
        <section class="check-panel"><span class="panel-label">Verificare</span><h3>Control înainte de finalizare</h3><ul>${workflow.checks.map(item => `<li>${esc(item)}</li>`).join("")}</ul></section>
        <section class="warning-panel"><span class="panel-label">Atenție</span><h3>Erori frecvente</h3><ul>${workflow.pitfalls.map(item => `<li>${esc(item)}</li>`).join("")}</ul></section>
      </div>

      <div class="two-columns">
        <section class="stop-panel"><span class="panel-label">Stop rule</span><h3>Când oprești și ceri lămuriri</h3><p>${esc(workflow.stop)}</p></section>
        <section class="practice-panel"><span class="panel-label">Practic</span><h3>Recomandare de lucru</h3><p>${esc(workflow.practice)}</p></section>
      </div>

      ${workflow.codeNote ? `<section class="code-note"><span class="panel-label">Context juridic</span><h3>Legătura cu Codul penal/procedural</h3><p>${esc(workflow.codeNote)}</p></section>` : ""}

      <p class="source-note">Fișă de instruire elaborată pe baza articolelor indicate. Pentru operațiunea concretă se verifică actul primit, textul integral al normei și forma consolidată oficială.</p>
    `;

    renderList();
    if (focus) detail.focus({ preventScroll: true });
  }

  function renderReferences() {
    refs.innerHTML = data.codeReferences.map(reference => `
      <article>
        <span>${esc(reference.code)}</span>
        <h3>${esc(reference.articles)}</h3>
        <p>${esc(reference.role)}</p>
      </article>
    `).join("");
  }

  function renderGlossary() {
    glossary.innerHTML = data.glossary.map((item, index) => `
      <article>
        <span class="glossary-index">${String(index + 1).padStart(2, "0")}</span>
        <h3>${esc(item.term)}</h3>
        <p>${esc(item.meaning)}</p>
      </article>
    `).join("");
  }

  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    category = button.dataset.category;
    renderFilters();
    renderList();
  });

  search.addEventListener("input", renderList);

  list.addEventListener("click", event => {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    renderDetail(card.dataset.id, true);
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${card.dataset.id}`);
  });

  detail.addEventListener("click", event => {
    if (!event.target.closest(".close-detail")) return;
    selected = null;
    detail.innerHTML = "";
    renderList();
    history.replaceState(null, "", location.pathname);
  });

  normalizeLearningUi();
  renderFilters();
  renderList();
  renderReferences();
  renderGlossary();

  const hash = decodeURIComponent(location.hash.slice(1));
  if (data.workflows.some(workflow => workflow.id === hash)) renderDetail(hash, false);
})();

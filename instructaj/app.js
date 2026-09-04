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
  const learningProgress = document.getElementById("learning-progress");
  const storageKey = "evidenta-instructaj-progress-v1";

  let category = "Toate";
  let selected = null;
  let progress = loadProgress();

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveProgress() {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }

  function esc(value) {
    return String(value).replace(/[&<>"]/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;"
    })[ch]);
  }

  function workflowDone(workflow) {
    const state = progress[workflow.id] || {};
    return workflow.steps.reduce((sum, _, index) => sum + (state[index] ? 1 : 0), 0);
  }

  function totalProgress() {
    const total = data.workflows.reduce((sum, workflow) => sum + workflow.steps.length, 0);
    const done = data.workflows.reduce((sum, workflow) => sum + workflowDone(workflow), 0);
    const percent = total ? Math.round((done / total) * 100) : 0;
    const completedWorkflows = data.workflows.filter(workflow => workflowDone(workflow) === workflow.steps.length).length;
    return { total, done, percent, completedWorkflows };
  }

  function renderLearningProgress() {
    if (!learningProgress) return;
    const state = totalProgress();
    learningProgress.innerHTML = `
      <div class="progress-summary">
        <strong>${state.percent}%</strong>
        <span>${state.done}/${state.total} pași parcurși</span>
      </div>
      <div class="progress-track" role="progressbar" aria-label="Progres total" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${state.percent}">
        <i style="width:${state.percent}%"></i>
      </div>
      <small>${state.completedWorkflows}/${data.workflows.length} proceduri finalizate · progres salvat pe acest dispozitiv</small>
    `;
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

    list.innerHTML = items.map(workflow => {
      const done = workflowDone(workflow);
      const percent = Math.round((done / workflow.steps.length) * 100);
      const completed = done === workflow.steps.length;
      return `
        <button type="button"
          class="workflow-card${selected === workflow.id ? " selected" : ""}${completed ? " completed" : ""}"
          data-id="${esc(workflow.id)}">
          <span class="card-meta">${esc(workflow.category)} · ${workflow.steps.length} pași</span>
          <strong>${esc(workflow.title)}</strong>
          <span class="workflow-summary">${esc(workflow.summary)}</span>
          <div class="card-progress" aria-hidden="true"><i style="width:${percent}%"></i></div>
          <small>${completed ? "Procedură parcursă" : `${done}/${workflow.steps.length} pași bifați`}</small>
        </button>
      `;
    }).join("") || `<p class="empty">Nu am găsit o procedură pentru această căutare.</p>`;
  }

  function renderDetail(id, focus) {
    const workflow = data.workflows.find(item => item.id === id);
    if (!workflow) {
      detail.innerHTML = "";
      return;
    }

    selected = id;
    const state = progress[id] || {};
    const done = workflowDone(workflow);
    const percent = Math.round((done / workflow.steps.length) * 100);

    detail.innerHTML = `
      <div class="detail-head">
        <div>
          <span class="badge">${esc(workflow.category)}</span>
          <h2>${esc(workflow.title)}</h2>
          <p>${esc(workflow.summary)}</p>
        </div>
        <button class="close-detail" type="button" aria-label="Închide fișa">×</button>
      </div>

      <div class="detail-progress">
        <div><strong>Progresul fișei</strong><span>${done}/${workflow.steps.length} pași</span></div>
        <div class="progress-track" role="progressbar" aria-label="Progresul fișei" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
          <i style="width:${percent}%"></i>
        </div>
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
          <div><span class="panel-label">Checklist</span><h3>Pașii de lucru</h3></div>
          <small>Bifează după efectuare</small>
        </div>
        <ol class="steps">
          ${workflow.steps.map((step, index) => `
            <li>
              <label>
                <input type="checkbox" data-step="${index}" ${state[index] ? "checked" : ""}>
                <span><b>Pasul ${index + 1}</b>${esc(step)}</span>
              </label>
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

  detail.addEventListener("change", event => {
    if (!event.target.matches("[data-step]") || !selected) return;
    progress[selected] = progress[selected] || {};
    progress[selected][event.target.dataset.step] = event.target.checked;
    saveProgress();
    renderLearningProgress();
    renderDetail(selected, false);
  });

  detail.addEventListener("click", event => {
    if (!event.target.closest(".close-detail")) return;
    selected = null;
    detail.innerHTML = "";
    renderList();
    history.replaceState(null, "", location.pathname);
  });

  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!Object.keys(progress).length || confirm("Resetezi toate bifările salvate pe acest dispozitiv?")) {
      progress = {};
      saveProgress();
      renderLearningProgress();
      renderList();
      if (selected) renderDetail(selected, false);
    }
  });

  renderFilters();
  renderLearningProgress();
  renderList();
  renderReferences();
  renderGlossary();

  const hash = decodeURIComponent(location.hash.slice(1));
  if (data.workflows.some(workflow => workflow.id === hash)) renderDetail(hash, false);
})();

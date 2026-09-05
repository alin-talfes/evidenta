(() => {
  'use strict';

  if (window.__EVIDENTA_OFFICER_COCKPIT__) return;
  window.__EVIDENTA_OFFICER_COCKPIT__ = true;

  const STATE_KEY = 'evidenta-training';
  const LAST_VIEW_KEY = 'evidenta-training-last-view';
  const LAST_EXAM_KEY = 'evidenta-training-last-exam';
  const $ = selector => document.querySelector(selector);

  function readJson(key, fallback = {}) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function readState() {
    return readJson(STATE_KEY, {});
  }

  function dueIds(state) {
    const due = new Set(Array.isArray(state.mistakes) ? state.mistakes.map(String) : []);
    const now = Date.now();
    Object.entries(state.questionStats || {}).forEach(([id, raw]) => {
      if (!raw || typeof raw !== 'object') return;
      const attempts = Math.max(0, Number(raw.attempts) || 0);
      if (!attempts) return;
      const next = Date.parse(raw.nextReview || '');
      if (Number.isFinite(next) && next <= now) due.add(String(id));
    });
    return due;
  }

  function datasetAvailable() {
    return typeof questions !== 'undefined' && Array.isArray(questions) &&
      typeof laws !== 'undefined' && Array.isArray(laws);
  }

  function lawLabel(id) {
    if (!datasetAvailable()) return id || '—';
    return laws.find(item => item.id === id)?.short || id || '—';
  }

  function weakestTopic(state) {
    if (!datasetAvailable()) return null;
    const byLaw = new Map();

    questions.forEach(question => {
      const stats = state.questionStats?.[String(question.id)];
      if (!stats || Number(stats.attempts) <= 0) return;
      const current = byLaw.get(question.law) || { law: question.law, attempts: 0, correct: 0 };
      current.attempts += Math.max(0, Number(stats.attempts) || 0);
      current.correct += Math.max(0, Number(stats.correct) || 0);
      byLaw.set(question.law, current);
    });

    return [...byLaw.values()]
      .filter(item => item.attempts >= 2)
      .map(item => ({ ...item, accuracy: Math.round(item.correct / item.attempts * 100) }))
      .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)[0] || null;
  }

  function legislationProgress(state) {
    if (typeof legislationActs === 'undefined' || !Array.isArray(legislationActs)) {
      return { read: Array.isArray(state.readArticles) ? state.readArticles.length : 0, total: 0, percent: null };
    }
    const total = legislationActs.reduce((sum, act) => sum + (Array.isArray(act.articles) ? act.articles.length : 0), 0);
    const read = Array.isArray(state.readArticles) ? state.readArticles.length : 0;
    return { read, total, percent: total ? Math.min(100, Math.round(read / total * 100)) : null };
  }

  function lastExam() {
    const value = readJson(LAST_EXAM_KEY, null);
    if (!value || !Number.isFinite(Number(value.score))) return null;
    return { score: Math.max(0, Math.min(100, Math.round(Number(value.score)))), date: value.date || null };
  }

  function recommendedAction(metrics) {
    if (metrics.due > 0) {
      return {
        view: 'mistakes',
        label: 'Începe repetarea scadentă',
        title: `${metrics.due} ${metrics.due === 1 ? 'grilă este scadentă' : 'grile sunt scadente'} pentru repetare`,
        reason: 'Repetiția spațiată are prioritate pentru a nu pierde informația deja parcursă.'
      };
    }
    if (metrics.answered < 10) {
      return {
        view: 'quiz',
        adaptive: true,
        label: 'Pornește o sesiune adaptivă',
        title: 'Construiește o bază de progres măsurabilă',
        reason: 'Sunt prea puține răspunsuri pentru a identifica stabil un punct slab. O sesiune adaptivă oferă rapid date utile.'
      };
    }
    if (metrics.weak && metrics.weak.accuracy < 75) {
      return {
        view: 'quiz',
        adaptive: true,
        law: metrics.weak.law,
        label: `Consolidează ${lawLabel(metrics.weak.law)}`,
        title: `${lawLabel(metrics.weak.law)} este zona cea mai vulnerabilă`,
        reason: `Acuratețe ${metrics.weak.accuracy}% din ${metrics.weak.attempts} răspunsuri înregistrate pe această materie.`
      };
    }
    if (metrics.legal.percent !== null && metrics.legal.percent < 50) {
      return {
        view: 'legislation',
        label: 'Continuă bibliografia',
        title: 'Bibliografia integrată este încă parcursă parțial',
        reason: `${metrics.legal.percent}% din articolele integrate sunt marcate ca învățate.`
      };
    }
    return {
      view: 'exam',
      label: 'Pornește o simulare',
      title: 'Poți trece la verificare în condiții de examen',
      reason: 'Nu există repetări scadente, iar progresul curent permite o verificare mai largă.'
    };
  }

  function metricsFromState() {
    const state = readState();
    const answered = Math.max(0, Number(state.answered) || 0);
    const correct = Math.min(answered, Math.max(0, Number(state.correct) || 0));
    const accuracy = answered ? Math.round(correct / answered * 100) : null;
    const due = dueIds(state).size;
    const legal = legislationProgress(state);
    const weak = weakestTopic(state);
    const streak = Math.max(0, Number(state.streak) || 0);
    return { state, answered, correct, accuracy, due, legal, weak, streak, exam: lastExam() };
  }

  function ensureHost() {
    let host = $('#learning-cockpit');
    if (host) return host;
    const dashboard = $('#dashboard');
    const hero = dashboard?.querySelector('.learning-hero');
    if (!dashboard || !hero) return null;
    host = document.createElement('section');
    host.id = 'learning-cockpit';
    host.className = 'learning-cockpit';
    host.setAttribute('aria-live', 'polite');
    hero.insertAdjacentElement('afterend', host);
    return host;
  }

  function formatLastExam(exam) {
    if (!exam) return 'Nicio simulare salvată';
    const date = exam.date ? new Date(exam.date) : null;
    const validDate = date instanceof Date && !Number.isNaN(date.getTime());
    return `${exam.score}%${validDate ? ` · ${date.toLocaleDateString('ro-RO')}` : ''}`;
  }

  function renderCockpit() {
    const host = ensureHost();
    if (!host) return;

    const metrics = metricsFromState();
    const recommendation = recommendedAction(metrics);
    const lastView = localStorage.getItem(LAST_VIEW_KEY) || 'quiz';
    const lastViewLabel = ({
      dashboard: 'Tablou de bord',
      quiz: 'Grile',
      synthesis: 'Sinteză',
      calculations: 'Calcule',
      mistakes: 'Repetare',
      exam: 'Simulări',
      legislation: 'Legislație',
      official: 'Subiecte ANP',
      interview: 'Interviu'
    })[lastView] || 'Grile';

    host.innerHTML = `
      <div class="learning-cockpit__focus">
        <div>
          <span class="learning-cockpit__eyebrow">Următoarea acțiune recomandată</span>
          <h2>${recommendation.title}</h2>
          <p>${recommendation.reason}</p>
        </div>
        <button type="button" class="primary" data-cockpit-action="recommended">${recommendation.label} →</button>
      </div>

      <div class="learning-cockpit__metrics" aria-label="Progres curent">
        <article class="learning-cockpit__metric">
          <span>Acuratețe grile</span>
          <strong>${metrics.accuracy === null ? '—' : `${metrics.accuracy}%`}</strong>
          <small>${metrics.answered} răspunsuri înregistrate</small>
        </article>
        <article class="learning-cockpit__metric ${metrics.due ? 'needs-attention' : ''}">
          <span>Repetări scadente</span>
          <strong>${metrics.due}</strong>
          <small>${metrics.due ? 'de lucrat astăzi' : 'repetarea este la zi'}</small>
        </article>
        <article class="learning-cockpit__metric">
          <span>Bibliografie parcursă</span>
          <strong>${metrics.legal.percent === null ? metrics.legal.read : `${metrics.legal.percent}%`}</strong>
          <small>${metrics.legal.total ? `${metrics.legal.read} / ${metrics.legal.total} articole integrate` : `${metrics.legal.read} articole marcate`}</small>
        </article>
        <article class="learning-cockpit__metric">
          <span>Serie de studiu</span>
          <strong>${metrics.streak}</strong>
          <small>${metrics.streak === 1 ? 'zi activă' : 'zile consecutive'}</small>
        </article>
      </div>

      <div class="learning-cockpit__context">
        <article>
          <span>Punct vulnerabil</span>
          <strong>${metrics.weak ? `${lawLabel(metrics.weak.law)} · ${metrics.weak.accuracy}%` : 'Se determină din progres'}</strong>
          <small>${metrics.weak ? `${metrics.weak.attempts} răspunsuri analizate` : 'Este nevoie de mai multe răspunsuri pentru o recomandare stabilă.'}</small>
        </article>
        <article>
          <span>Ultima simulare</span>
          <strong>${formatLastExam(metrics.exam)}</strong>
          <small>Se actualizează după finalizarea unei simulări de grile.</small>
        </article>
      </div>

      <div class="learning-cockpit__actions">
        <button type="button" class="secondary" data-cockpit-view="${lastView}">Continuă: ${lastViewLabel}</button>
        <button type="button" class="secondary" data-cockpit-view="mistakes"${metrics.due ? '' : ' disabled'}>Repetări (${metrics.due})</button>
        <button type="button" class="secondary" data-cockpit-view="exam">Simulare</button>
      </div>`;

    host.dataset.recommendedView = recommendation.view;
    host.dataset.recommendedAdaptive = recommendation.adaptive ? 'true' : 'false';
    host.dataset.recommendedLaw = recommendation.law || '';
  }

  function goToView(view) {
    if (!view) return;
    localStorage.setItem(LAST_VIEW_KEY, view);

    if (typeof window.showView === 'function') {
      window.showView(view);
      try { history.replaceState(null, '', `#${view}`); } catch {}
      return;
    }

    const nav = document.querySelector(`.sidebar .nav-item[data-view="${CSS.escape(view)}"]`);
    if (nav) {
      nav.click();
      return;
    }

    window.TRAINING_BOOT?.visualView?.(view);
    window.TRAINING_BOOT?.ensureApp?.().catch(() => {});
  }

  function runRecommendation() {
    const host = ensureHost();
    if (!host) return;
    const view = host.dataset.recommendedView || 'quiz';
    const adaptive = host.dataset.recommendedAdaptive === 'true';
    const law = host.dataset.recommendedLaw || '';

    const launch = () => {
      if (view === 'quiz' && law) {
        const select = $('#quiz-module');
        if (select && [...select.options].some(option => option.value === law)) select.value = law;
      }
      if (adaptive) {
        const action = $('[data-start-adaptive]') || $('#adaptive-start');
        if (action) {
          action.click();
          return;
        }
      }
      goToView(view);
    };

    if (document.documentElement.dataset.appReady === 'true') {
      launch();
    } else {
      window.TRAINING_BOOT?.ensureApp?.().then(launch).catch(() => goToView(view));
    }
  }

  function rememberNavigation(event) {
    const target = event.target.closest?.('.nav-item[data-view], [data-go], [data-cockpit-view]');
    const view = target?.dataset.view || target?.dataset.go || target?.dataset.cockpitView;
    if (view) localStorage.setItem(LAST_VIEW_KEY, view);
  }

  function captureExamResult() {
    const area = $('#exam-area');
    if (!area) return;
    const score = area.querySelector('.score-screen .score-ring b')?.textContent?.match(/(\d+)\s*%/);
    if (!score || !area.textContent.includes('Simulare încheiată')) return;
    const value = Math.max(0, Math.min(100, Number(score[1])));
    const previous = lastExam();
    if (previous?.score === value && previous?.date && Date.now() - Date.parse(previous.date) < 3000) return;
    localStorage.setItem(LAST_EXAM_KEY, JSON.stringify({ score: value, date: new Date().toISOString() }));
    renderCockpit();
  }

  function observeExam() {
    const area = $('#exam-area');
    if (!area || area.dataset.cockpitObserved === 'true') return;
    area.dataset.cockpitObserved = 'true';
    let timer;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(captureExamResult, 50);
    }).observe(area, { childList: true, subtree: true, characterData: true });
  }

  function bind() {
    const host = ensureHost();
    if (!host || host.dataset.cockpitBound === 'true') return;
    host.dataset.cockpitBound = 'true';

    host.addEventListener('click', event => {
      if (event.target.closest('[data-cockpit-action="recommended"]')) {
        runRecommendation();
        return;
      }
      const button = event.target.closest('[data-cockpit-view]');
      if (button && !button.disabled) goToView(button.dataset.cockpitView);
    });

    document.addEventListener('click', event => {
      rememberNavigation(event);
      setTimeout(renderCockpit, 80);
    }, true);
  }

  function init() {
    renderCockpit();
    bind();
    observeExam();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  document.addEventListener('training:app-ready', () => {
    renderCockpit();
    bind();
    observeExam();
  });
  window.addEventListener('storage', event => {
    if ([STATE_KEY, LAST_VIEW_KEY, LAST_EXAM_KEY].includes(event.key)) renderCockpit();
  });
})();

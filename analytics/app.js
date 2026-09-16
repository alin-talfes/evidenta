(() => {
  'use strict';

  const SUPABASE_URL = 'https://pqydyzrtlfvtxldmcdzs.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_quC7kGVn6z_zXuF7vG8s0Q_0LuQGvSP';
  const SESSION_KEY = 'ev_analytics_admin_session_v1';

  const $ = id => document.getElementById(id);
  const loginView = $('loginView');
  const dashboardView = $('dashboardView');
  const loginForm = $('loginForm');
  const loginError = $('loginError');
  const status = $('status');
  let session = null;

  function saveSession(value) {
    session = value;
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)); } catch (_) {}
  }

  function clearSession() {
    session = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
  }

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; }
  }

  async function authRequest(path, body, token = null) {
    const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store', credentials: 'omit'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'Autentificarea a eșuat.');
    return data;
  }

  async function signIn(email, password) {
    const data = await authRequest('/auth/v1/token?grant_type=password', { email, password });
    const expiresAt = data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);
    const next = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
      user: data.user
    };
    saveSession(next);
    return next;
  }

  async function ensureAccessToken() {
    if (!session) session = readSession();
    if (!session?.access_token) throw new Error('Sesiunea nu este activă.');
    if (Number(session.expires_at || 0) * 1000 > Date.now() + 60_000) return session.access_token;
    if (!session.refresh_token) throw new Error('Sesiunea a expirat.');

    const data = await authRequest('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh_token });
    saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token || session.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
      user: data.user || session.user
    });
    return session.access_token;
  }

  async function restGet(path) {
    const token = await ensureAccessToken();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      cache: 'no-store', credentials: 'omit'
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `Eroare API (${response.status}).`);
    return data;
  }

  async function rpc(name, args) {
    const token = await ensureAccessToken();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args), cache: 'no-store', credentials: 'omit'
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || `Eroare analytics (${response.status}).`);
    return data;
  }

  async function ensureAdmin() {
    const userId = session?.user?.id;
    if (!userId) throw new Error('Nu am putut identifica utilizatorul autentificat.');
    const rows = await restGet(`profiles?select=role,active&id=eq.${encodeURIComponent(userId)}`);
    const profile = Array.isArray(rows) ? rows[0] : null;
    if (!profile || profile.active !== true || profile.role !== 'admin') throw new Error('Contul nu are drept de administrator pentru analytics.');
    return true;
  }

  function showLogin(message = '') {
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
    loginError.textContent = message;
  }

  function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loginError.textContent = '';
  }

  function n(value) {
    return new Intl.NumberFormat('ro-RO').format(Number(value || 0));
  }

  function percent(part, total) {
    const p = Number(part || 0), t = Number(total || 0);
    return t > 0 ? `${Math.round((p / t) * 100)}%` : '0%';
  }

  function routeLabel(route) {
    const labels = {
      '/': 'Pedepse',
      '/ai/': 'AI Documente',
      '/contopiri/': 'Contopiri',
      '/transfer/': 'Transfer',
      '/transfer/rules/': 'Reguli transfer',
      '/instructaj/': 'Instructaj',
      '/semnalmente/': 'Semnalmente',
      '/semnalmente/benchmark/': 'Semnalmente · Benchmark'
    };
    return labels[route] || route;
  }

  function renderSummary(summary, days) {
    $('metricTotalDevices').textContent = n(summary.total_devices);
    $('metricActiveDevices').textContent = n(summary.active_devices_period);
    $('metricTodayDevices').textContent = n(summary.active_devices_today);
    $('metricPageViews').textContent = n(summary.page_views_period);
    $('metricSessions').textContent = n(summary.sessions_period);
    $('metricPwa').textContent = percent(summary.standalone_devices_period, summary.active_devices_period);
    $('metricActiveLabel').textContent = `în ultimele ${days} zile`;
    $('metricViewsLabel').textContent = `în ultimele ${days} zile`;
    $('mobileCount').textContent = n(summary.mobile_devices_period);
    $('tabletCount').textContent = n(summary.tablet_devices_period);
    $('desktopCount').textContent = n(summary.desktop_devices_period);
    $('newDevicesCount').textContent = n(summary.new_devices_period);
  }

  function renderDaily(rows) {
    const chart = $('dailyChart');
    const items = Array.isArray(rows) ? rows : [];
    const max = Math.max(1, ...items.map(item => Number(item.page_views || 0)));
    chart.innerHTML = items.map(item => {
      const views = Number(item.page_views || 0);
      const devices = Number(item.devices || 0);
      const hViews = Math.max(2, Math.round((views / max) * 100));
      const hDevices = Math.max(2, Math.round((devices / max) * 100));
      const date = new Date(`${item.day}T12:00:00`);
      const label = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: '2-digit' }).format(date);
      return `<div class="daily-item" title="${label}: ${views} accesări · ${devices} dispozitive">
        <div class="daily-bars"><i class="daily-bar" style="height:${hViews}%"></i><i class="daily-bar devices" style="height:${hDevices}%"></i></div>
        <span class="daily-label">${label}</span>
      </div>`;
    }).join('');
  }

  function renderModules(rows) {
    const body = $('modulesBody');
    const items = Array.isArray(rows) ? rows : [];
    body.innerHTML = items.length ? items.map(item => `<tr>
      <td>${routeLabel(item.route)}</td>
      <td>${n(item.page_views)}</td>
      <td>${n(item.devices)}</td>
      <td>${n(item.sessions)}</td>
    </tr>`).join('') : '<tr><td colspan="4">Nu există încă date pentru perioada selectată.</td></tr>';
  }

  async function loadDashboard() {
    const days = Number($('periodSelect').value || 30);
    status.textContent = 'Se încarcă statisticile…';
    try {
      const [summary, daily, modules] = await Promise.all([
        rpc('analytics_summary', { p_days: days }),
        rpc('analytics_daily', { p_days: days }),
        rpc('analytics_modules', { p_days: days })
      ]);
      renderSummary(summary || {}, days);
      renderDaily(daily || []);
      renderModules(modules || []);
      const last = summary?.last_event_at ? new Date(summary.last_event_at).toLocaleString('ro-RO') : '—';
      status.textContent = `Actualizat · ultima accesare înregistrată: ${last}`;
    } catch (error) {
      status.textContent = error?.message || 'Statisticile nu au putut fi încărcate.';
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    loginError.textContent = 'Se verifică accesul…';
    try {
      await signIn($('email').value.trim(), $('password').value);
      await ensureAdmin();
      showDashboard();
      await loadDashboard();
      $('password').value = '';
    } catch (error) {
      clearSession();
      showLogin(error?.message || 'Autentificarea a eșuat.');
    }
  });

  $('periodSelect').addEventListener('change', loadDashboard);
  $('refreshBtn').addEventListener('click', loadDashboard);
  $('logoutBtn').addEventListener('click', async () => {
    const token = session?.access_token;
    if (token) {
      fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
        credentials: 'omit'
      }).catch(() => {});
    }
    clearSession();
    showLogin('');
  });

  (async () => {
    session = readSession();
    if (!session) return showLogin('');
    try {
      await ensureAccessToken();
      await ensureAdmin();
      showDashboard();
      await loadDashboard();
    } catch (_) {
      clearSession();
      showLogin('Sesiunea anterioară nu mai este validă. Autentifică-te din nou.');
    }
  })();
})();

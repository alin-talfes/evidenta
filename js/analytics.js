(() => {
  'use strict';

  if (window.__EVIDENTA_ANALYTICS__) return;
  window.__EVIDENTA_ANALYTICS__ = true;

  const SUPABASE_URL = 'https://pqydyzrtlfvtxldmcdzs.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_quC7kGVn6z_zXuF7vG8s0Q_0LuQGvSP';
  const CONSENT_KEY = 'ev_analytics_consent_v1';
  const DEVICE_KEY = 'ev_analytics_device_v1';
  const SESSION_KEY = 'ev_analytics_session_v1';
  const SESSION_TTL_MS = 30 * 60 * 1000;
  const scriptUrl = new URL(document.currentScript?.src || location.href, location.href);
  const rootUrl = new URL('../', scriptUrl);
  let versionPromise = null;
  let started = false;

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = [...bytes].map(v => v.toString(16).padStart(2, '0'));
    return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10).join('')}`;
  }

  function consent() {
    return storageGet(CONSENT_KEY);
  }

  function routeName() {
    const rootPath = rootUrl.pathname.endsWith('/') ? rootUrl.pathname : `${rootUrl.pathname}/`;
    let relative = location.pathname.startsWith(rootPath) ? location.pathname.slice(rootPath.length) : location.pathname.replace(/^\/+/, '');
    relative = decodeURIComponent(relative).replace(/^\/+/, '').replace(/index\.html$/i, '');
    if (!relative) return '/';
    if (!relative.endsWith('/')) relative += '/';
    return `/${relative}`.replace(/\/{2,}/g, '/').slice(0, 80);
  }

  function deviceKind() {
    const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  function displayMode() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true ? 'standalone' : 'browser';
  }

  function getDeviceId() {
    let id = storageGet(DEVICE_KEY);
    if (!id) {
      id = uuid();
      storageSet(DEVICE_KEY, id);
    }
    return id;
  }

  function getSession() {
    const now = Date.now();
    let current = null;
    try { current = JSON.parse(storageGet(SESSION_KEY) || 'null'); } catch (_) {}
    const valid = current && typeof current.id === 'string' && Number.isFinite(current.lastSeen) && now - current.lastSeen < SESSION_TTL_MS;
    const next = valid ? { id: current.id, lastSeen: now } : { id: uuid(), lastSeen: now };
    storageSet(SESSION_KEY, JSON.stringify(next));
    return { ...next, isNew: !valid };
  }

  async function appVersion() {
    if (versionPromise) return versionPromise;
    versionPromise = fetch(new URL('version.json', rootUrl), { cache: 'no-store', credentials: 'same-origin' })
      .then(response => response.ok ? response.json() : null)
      .then(data => typeof data?.version === 'string' ? data.version.slice(0, 24) : null)
      .catch(() => null);
    return versionPromise;
  }

  async function postEvent(eventType, session) {
    if (consent() !== 'accepted') return;
    if (!['app_open', 'page_view'].includes(eventType)) return;
    const route = routeName();
    if (route === '/analytics/') return;

    const payload = {
      device_id: getDeviceId(),
      session_id: session.id,
      event_type: eventType,
      route,
      app_version: await appVersion(),
      display_mode: displayMode(),
      device_kind: deviceKind()
    };

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        keepalive: true,
        referrerPolicy: 'no-referrer',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      // Analytics must never affect the operational application.
    }
  }

  async function startTracking() {
    if (started || consent() !== 'accepted') return;
    started = true;
    const session = getSession();
    if (session.isNew) void postEvent('app_open', session);
    void postEvent('page_view', session);
  }

  function removeDialog() {
    document.querySelector('.ev-analytics-consent')?.remove();
  }

  function ensureSettingsControl() {
    if (!document.body || document.querySelector('[data-ev-analytics-settings]')) return;
    const wrap = document.createElement('div');
    wrap.className = 'ev-analytics-settings';
    wrap.dataset.evAnalyticsSettings = 'true';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Setări statistici';
    button.addEventListener('click', () => showConsentDialog(true));
    wrap.appendChild(button);
    document.body.appendChild(wrap);
  }

  function setConsent(value) {
    if (value === 'accepted') {
      storageSet(CONSENT_KEY, 'accepted');
      started = false;
      removeDialog();
      ensureSettingsControl();
      void startTracking();
      return;
    }

    storageSet(CONSENT_KEY, 'declined');
    storageRemove(DEVICE_KEY);
    storageRemove(SESSION_KEY);
    started = false;
    removeDialog();
    ensureSettingsControl();
  }

  function showConsentDialog(settingsMode = false) {
    removeDialog();
    const current = consent();
    const overlay = document.createElement('div');
    overlay.className = 'ev-analytics-consent';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ev-analytics-consent-title');

    overlay.innerHTML = `
      <div class="ev-analytics-consent__card">
        <div class="ev-analytics-consent__head">
          <div>
            <span>CONFIDENȚIALITATE</span>
            <h2 id="ev-analytics-consent-title">Statistici anonime de utilizare</h2>
          </div>
          ${settingsMode ? '<button type="button" class="ev-analytics-consent__close" aria-label="Închide">×</button>' : ''}
        </div>
        <p>Cu acordul tău, aplicația salvează pe acest dispozitiv un identificator aleatoriu pentru a număra dispozitivele, sesiunile și paginile accesate.</p>
        <p class="ev-analytics-consent__privacy">Nu salvăm în tabelele de analytics IP-ul, user-agentul, numele dispozitivului, datele introduse în calcule, documentele sau date despre persoane private de libertate.</p>
        ${settingsMode && current ? `<p class="ev-analytics-consent__state">Stare actuală: <strong>${current === 'accepted' ? 'statistici active' : 'statistici dezactivate'}</strong>.</p>` : ''}
        <div class="ev-analytics-consent__actions">
          <button type="button" data-analytics-choice="accepted" class="ev-analytics-consent__accept">${current === 'accepted' ? 'PĂSTREAZĂ ACTIVE' : 'ACCEPT'}</button>
          <button type="button" data-analytics-choice="declined" class="ev-analytics-consent__decline">${current === 'declined' ? 'PĂSTREAZĂ DEZACTIVATE' : 'REFUZ'}</button>
        </div>
      </div>`;

    overlay.addEventListener('click', event => {
      const choice = event.target.closest('[data-analytics-choice]')?.dataset.analyticsChoice;
      if (choice) setConsent(choice);
      if (settingsMode && event.target.closest('.ev-analytics-consent__close')) removeDialog();
    });
    document.body.appendChild(overlay);
    overlay.querySelector('[data-analytics-choice]')?.focus();
  }

  function init() {
    if (!document.body) return;
    if (location.protocol !== 'https:' || /^(localhost|127\.0\.0\.1)$/i.test(location.hostname)) return;
    if (routeName() === '/analytics/') return;

    ensureSettingsControl();
    if (consent() === 'accepted') void startTracking();
    else if (consent() !== 'declined') showConsentDialog(false);
  }

  window.EvidentaAnalytics = Object.freeze({
    get consent() { return consent(); },
    setConsent,
    openSettings: () => showConsentDialog(true),
    trackPageView: () => {
      if (consent() !== 'accepted') return;
      const session = getSession();
      void postEvent('page_view', session);
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

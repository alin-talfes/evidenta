// Shared theme + universal product shell for the entire Evidenta PPL application.
(function () {
    'use strict';

    const THEME_STORAGE_KEY = 'evidenta-theme';
    const LEGACY_KEYS = ['anpTheme', 'descriere-semnalmente-theme'];
    const THEME_CONTROL_SELECTOR = '#themeToggle, #btn-theme, #theme-btn, #evidenta-theme-toggle';
    const scriptUrl = new URL(document.currentScript?.src || location.href, location.href);
    const rootUrl = new URL('../', scriptUrl);

    function ensureStylesheet(href, dataAttribute) {
        if (document.querySelector(`link[${dataAttribute}], link[href*="${href.split('/').pop().split('?')[0]}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = new URL(href, scriptUrl).href;
        link.setAttribute(dataAttribute, 'true');
        document.head.appendChild(link);
    }

    function ensureSharedStyles() {
        ensureStylesheet('../css/design-system.css?v=4', 'data-evidenta-design-system');
        ensureStylesheet('../css/unified-shell.css?v=1', 'data-evidenta-unified-shell');
        ensureStylesheet('../css/visual-audit.css?v=1', 'data-evidenta-visual-audit');
    }

    function validTheme(value) {
        return value === 'light' || value === 'dark' ? value : null;
    }

    function readTheme() {
        const canonical = validTheme(localStorage.getItem(THEME_STORAGE_KEY));
        if (canonical) return canonical;

        for (const key of LEGACY_KEYS) {
            const legacy = validTheme(localStorage.getItem(key));
            if (legacy) {
                localStorage.setItem(THEME_STORAGE_KEY, legacy);
                return legacy;
            }
        }

        return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function persistTheme(theme) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        for (const key of LEGACY_KEYS) localStorage.setItem(key, theme);
    }

    function updateThemeMeta(theme) {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = theme === 'light' ? '#f8fafc' : '#0b1220';
    }

    function updateThemeButtons(theme) {
        const isLight = theme === 'light';
        document.querySelectorAll(THEME_CONTROL_SELECTOR).forEach(button => {
            button.textContent = isLight ? '☀️' : '🌙';
            button.setAttribute('aria-pressed', String(isLight));
            button.setAttribute('aria-label', isLight ? 'Activează tema întunecată' : 'Activează tema luminoasă');
            button.setAttribute('title', isLight ? 'Temă întunecată' : 'Temă luminoasă');
        });
    }

    function applyTheme(theme = readTheme(), { persist = false } = {}) {
        const resolved = validTheme(theme) || 'dark';
        document.documentElement.dataset.theme = resolved;
        document.documentElement.style.colorScheme = resolved;

        if (document.body) {
            document.body.classList.toggle('light', resolved === 'light');
            document.body.classList.toggle('dark', resolved === 'dark');
        }

        if (persist) persistTheme(resolved);
        updateThemeMeta(resolved);
        updateThemeButtons(resolved);
        window.dispatchEvent(new CustomEvent('evidenta:themechange', { detail: { theme: resolved } }));
        return resolved;
    }

    function toggleTheme() {
        const current = validTheme(document.documentElement.dataset.theme) || readTheme();
        return applyTheme(current === 'light' ? 'dark' : 'light', { persist: true });
    }

    function relativePage() {
        const rootPath = rootUrl.pathname.endsWith('/') ? rootUrl.pathname : `${rootUrl.pathname}/`;
        const pathname = location.pathname;
        if (!pathname.startsWith(rootPath)) return '';
        return decodeURIComponent(pathname.slice(rootPath.length)).replace(/^\/+|\/+$/g, '');
    }

    function pageContext() {
        const page = relativePage();
        const contexts = {
            '': ['pedepse', 'CALCUL ȘI EVIDENȚĂ', 'Pedepse și liberare condiționată', 'Durata pedepsei, deduceri, expirare și termene de liberare condiționată.'],
            'index.html': ['pedepse', 'CALCUL ȘI EVIDENȚĂ', 'Pedepse și liberare condiționată', 'Durata pedepsei, deduceri, expirare și termene de liberare condiționată.'],
            'contopiri.html': ['contopiri', 'CALCUL ȘI EVIDENȚĂ', 'Contopiri', 'Instrument de lucru pentru operațiunile de contopire și recalcularea situației juridice.'],
            'transfer': ['transfer', 'TRANSFER ȘI PROFILARE', 'Transfer și profilare', 'Identificarea unităților compatibile și aplicarea criteriilor de transfer.'],
            'transfer/index.html': ['transfer', 'TRANSFER ȘI PROFILARE', 'Transfer și profilare', 'Identificarea unităților compatibile și aplicarea criteriilor de transfer.'],
            'transfer/rules.html': ['transfer', 'TRANSFER ȘI PROFILARE', 'Reguli transfer', 'Regulile operaționale și juridice folosite pentru verificarea transferului.'],
            'instructaj': ['instructaj', 'ÎNVĂȚARE ȘI PROCEDURI', 'Instructaj', 'Fundamente juridice, glosar și proceduri de evidență organizate pentru lucru curent.'],
            'instructaj/index.html': ['instructaj', 'ÎNVĂȚARE ȘI PROCEDURI', 'Instructaj', 'Fundamente juridice, glosar și proceduri de evidență organizate pentru lucru curent.'],
            'semnalmente': ['semnalmente', 'DESCRIERE ASISTATĂ', 'Semnalmente', 'Analiză facială asistată și generarea unei fișe descriptive verificabile de operator.'],
            'semnalmente/index.html': ['semnalmente', 'DESCRIERE ASISTATĂ', 'Semnalmente', 'Analiză facială asistată și generarea unei fișe descriptive verificabile de operator.'],
            'semnalmente/benchmark.html': ['semnalmente', 'VALIDARE ȘI CALIBRARE', 'Semnalmente · Benchmark', 'Calibrare locală, măsurarea performanței și analiza erorilor motorului Semnalmente.'],
            'ofiter': [null, 'SPAȚIU PRIVAT DE ÎNVĂȚARE', 'Ofițer evidență', 'Pregătire structurată pentru concurs: grile, sinteză, calcule, legislație și interviu.'],
            'ofiter/index.html': [null, 'SPAȚIU PRIVAT DE ÎNVĂȚARE', 'Ofițer evidență', 'Pregătire structurată pentru concurs: grile, sinteză, calcule, legislație și interviu.']
        };
        const [navKey, kicker, title, subtitle] = contexts[page] || [null, 'EVIDENȚĂ PPL', document.title || 'Evidență PPL', 'Instrument de lucru din suita Evidență PPL.'];
        return { page, navKey, kicker, title, subtitle, isOfficer: page === 'ofiter' || page === 'ofiter/index.html' };
    }

    function publicModules() {
        return [
            ['pedepse', 'Pedepse', new URL('./', rootUrl).href],
            ['contopiri', 'Contopiri', new URL('contopiri.html', rootUrl).href],
            ['transfer', 'Transfer', new URL('transfer/', rootUrl).href],
            ['instructaj', 'Instructaj', new URL('instructaj/', rootUrl).href],
            ['semnalmente', 'Semnalmente', new URL('semnalmente/', rootUrl).href]
        ];
    }

    function removeRetiredModuleLinks() {
        document.querySelectorAll('a[href]').forEach(link => {
            try {
                if (new URL(link.getAttribute('href'), location.href).pathname.endsWith('/termene.html')) link.remove();
            } catch (_) {
                // Ignore malformed legacy href values.
            }
        });
    }

    function buildUniversalShell() {
        if (!document.body || document.querySelector('[data-evidenta-shell]')) return;

        const context = pageContext();
        document.body.classList.add('ev-unified');
        document.body.dataset.evPage = context.page || context.navKey || 'evidenta';

        const shell = document.createElement('header');
        shell.className = 'ev-shell';
        shell.dataset.evidentaShell = 'true';

        const navItems = publicModules().map(([key, label, href]) => {
            const current = context.navKey === key ? ' aria-current="page"' : '';
            return `<a href="${href}"${current}>${label}</a>`;
        }).join('');

        shell.innerHTML = `
            <div class="ev-shell__bar">
                <a class="ev-shell__brand" href="${rootUrl.href}" aria-label="Evidență PPL — pagina principală">
                    <span class="ev-shell__mark" aria-hidden="true">EV</span>
                    <span class="ev-shell__brand-copy"><strong>Evidență PPL</strong><small>instrumente de evidență</small></span>
                </a>
                <nav class="ev-shell__nav" aria-label="Modulele Evidență PPL">${navItems}</nav>
                <div class="ev-shell__actions">
                    <button type="button" id="evidenta-theme-toggle" class="ev-shell__theme" aria-label="Schimbă tema"></button>
                </div>
            </div>
            <div class="ev-shell__module">
                <div class="ev-shell__module-copy">
                    <p class="ev-shell__kicker">${context.kicker}</p>
                    <h1>${context.title}</h1>
                    <p>${context.subtitle}</p>
                </div>
                ${context.isOfficer ? '<span class="ev-shell__badge">Acces restricționat</span>' : ''}
            </div>`;

        const skipLink = document.body.querySelector(':scope > .skip-link');
        if (skipLink) skipLink.insertAdjacentElement('afterend', shell);
        else document.body.prepend(shell);

        const actions = shell.querySelector('.ev-shell__actions');
        const logout = document.getElementById('access-logout');
        if (logout && actions) actions.prepend(logout);

        updateThemeButtons(validTheme(document.documentElement.dataset.theme) || readTheme());
    }

    function ensureFallbackControl() {
        if (document.querySelector('#evidenta-theme-toggle')) return;
        const host = document.querySelector('.top-actions, .header-actions, .app-nav, .site-header');
        if (!host) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'evidenta-theme-toggle';
        button.className = 'icon-btn evidenta-theme-toggle';
        host.appendChild(button);
        updateThemeButtons(validTheme(document.documentElement.dataset.theme) || readTheme());
    }

    ensureSharedStyles();
    const initialTheme = readTheme();
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.style.colorScheme = initialTheme;
    persistTheme(initialTheme);
    updateThemeMeta(initialTheme);

    document.addEventListener('click', event => {
        const button = event.target.closest?.(THEME_CONTROL_SELECTOR);
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        toggleTheme();
    }, true);

    function initThemeAndShell() {
        applyTheme(readTheme());
        removeRetiredModuleLinks();
        buildUniversalShell();
        ensureFallbackControl();
        updateThemeButtons(readTheme());
    }

    window.addEventListener('storage', event => {
        if (event.key !== THEME_STORAGE_KEY && !LEGACY_KEYS.includes(event.key)) return;
        applyTheme(readTheme());
    });

    window.applyTheme = theme => applyTheme(theme || readTheme());
    window.toggleTheme = toggleTheme;
    window.EVIDENTA_THEME_STORAGE_KEY = THEME_STORAGE_KEY;
    window.EVIDENTA_THEME = { get: readTheme, set: theme => applyTheme(theme, { persist: true }), toggle: toggleTheme };
    window.EVIDENTA_SHELL = { rebuild: buildUniversalShell, context: pageContext };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeAndShell, { once: true });
    } else {
        initThemeAndShell();
    }
})();

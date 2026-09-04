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

    function ensureScript(href, dataAttribute) {
        const expected = new URL(href, scriptUrl).href;
        const exactAlreadyLoaded = [...document.scripts].some(script => script.src === expected);
        if (document.querySelector(`script[${dataAttribute}]`) || exactAlreadyLoaded) return;
        const script = document.createElement('script');
        script.src = expected;
        script.defer = true;
        script.setAttribute(dataAttribute, 'true');
        document.head.appendChild(script);
    }

    function ensureSharedAssets() {
        ensureStylesheet('../css/design-system.css?v=4', 'data-evidenta-design-system');
        ensureStylesheet('../css/unified-shell.css?v=2', 'data-evidenta-unified-shell');
        ensureStylesheet('../css/visual-audit.css?v=1', 'data-evidenta-visual-audit');
        ensureScript('../js/version.js?v=39', 'data-evidenta-version-controller');
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
            '': ['pedepse', 'Pedepse și liberare condiționată', 'Calculul pedepsei, deducerilor, expirării și liberării condiționate.'],
            'index.html': ['pedepse', 'Pedepse și liberare condiționată', 'Calculul pedepsei, deducerilor, expirării și liberării condiționate.'],
            'contopiri.html': ['contopiri', 'Contopiri', 'Calculul pedepsei rezultante pentru situații deja calificate juridic.'],
            'transfer': ['transfer', 'Transfer și profilare', 'Filtrarea destinațiilor potrivit criteriilor de transfer și profilare.'],
            'transfer/index.html': ['transfer', 'Transfer și profilare', 'Filtrarea destinațiilor potrivit criteriilor de transfer și profilare.'],
            'transfer/rules.html': ['transfer', 'Reguli transfer', 'Anexele și regulile utilizate pentru transfer și profilare.'],
            'instructaj': ['instructaj', 'Instructaj', 'Fundamente juridice și proceduri de evidență.'],
            'instructaj/index.html': ['instructaj', 'Instructaj', 'Fundamente juridice și proceduri de evidență.'],
            'semnalmente': ['semnalmente', 'Semnalmente', 'Analiză facială asistată pentru fișe descriptive.'],
            'semnalmente/index.html': ['semnalmente', 'Semnalmente', 'Analiză facială asistată pentru fișe descriptive.'],
            'semnalmente/benchmark.html': ['semnalmente', 'Semnalmente · Benchmark', 'Validarea și calibrarea motorului Semnalmente.'],
            'ofiter': [null, 'Ofițer evidență', 'Pregătire pentru concursul de ofițer evidență.'],
            'ofiter/index.html': [null, 'Ofițer evidență', 'Pregătire pentru concursul de ofițer evidență.']
        };
        const [navKey, title, description] = contexts[page] || [null, document.title || 'Evidență PPL', 'Evidență PPL'];
        return { page, navKey, title, description, isOfficer: page === 'ofiter' || page === 'ofiter/index.html' };
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

    function updateDescription(context) {
        let description = document.querySelector('meta[name="description"]');
        if (!description) {
            description = document.createElement('meta');
            description.name = 'description';
            document.head.appendChild(description);
        }
        description.content = context.description;

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.content = context.description;
    }

    function removeRetiredModuleLinks() {
        document.querySelectorAll('a[href]').forEach(link => {
            try {
                if (new URL(link.getAttribute('href'), location.href).pathname.endsWith('/termene.html')) link.remove();
            } catch (_) {}
        });
    }

    function removeElements(selectors) {
        document.querySelectorAll(selectors.join(',')).forEach(element => element.remove());
    }

    function pruneEditorialNoise() {
        if (!document.body) return;

        removeElements([
            'body > .container > .app-nav',
            'body > .container > .header',
            'body > .container > header.header',
            'body > .site-header',
            'body > .app-shell > .topbar',
            'body > .app-shell > header.topbar',
            'body > .app-shell .suite-nav',
            'body > .app-shell .suite-links',
            'footer:not(.ev-footer)',
            '#themeToggle',
            '#theme-btn',
            '#btn-theme',
            '.quality-checklist',
            '.analysis-panel > div > .section-kicker',
            '.analysis-panel > div > h2 + p',
            '.results-section .results-heading-row .section-kicker',
            '#results-heading + p',
            '.saved-list .saved-heading-row .section-kicker',
            '.benchmark-shell .section-kicker',
            '.learning-hero .eyebrow',
            '.learning-modules-head .eyebrow',
            '.dashboard-bibliography .eyebrow',
            '.page-heading > div > .eyebrow',
            '.workflow-card > small',
            '.steps-heading > small'
        ]);

        document.querySelectorAll('.help-text').forEach(element => {
            if (element.textContent?.includes('Rezultatul se actualizează automat')) element.remove();
        });

        document.querySelectorAll('.modal p').forEach(element => {
            const text = element.textContent || '';
            if (text.includes('Instrumente disponibile') || text.includes('Mod de utilizare') || text.includes('Calculator termene procedurale')) {
                element.remove();
            }
        });

        const sectionHub = document.querySelector('.section-hub');
        if (sectionHub) {
            document.querySelector('body > main > .hero')?.remove();
            const hubHelp = sectionHub.querySelector('.section-hub-head > p:last-child');
            if (hubHelp?.textContent?.includes('Deschide o singură categorie')) hubHelp.remove();
        }
    }

    function buildUniversalShell() {
        if (!document.body || document.querySelector('[data-evidenta-shell]')) return;

        const context = pageContext();
        document.body.classList.add('ev-unified');
        document.body.dataset.evPage = context.page || context.navKey || 'evidenta';
        updateDescription(context);

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
                    <span class="ev-shell__brand-copy"><strong>Evidență PPL</strong></span>
                </a>
                <nav class="ev-shell__nav" aria-label="Modulele Evidență PPL">${navItems}</nav>
                <div class="ev-shell__actions">
                    <button type="button" id="evidenta-theme-toggle" class="ev-shell__theme" aria-label="Schimbă tema"></button>
                </div>
            </div>
            <div class="ev-shell__module">
                <h1>${context.title}</h1>
                ${context.isOfficer ? '<span class="ev-shell__badge">Acces restricționat</span>' : ''}
            </div>`;

        const skipLink = document.body.querySelector(':scope > .skip-link');
        if (skipLink) skipLink.insertAdjacentElement('afterend', shell);
        else document.body.prepend(shell);

        const actions = shell.querySelector('.ev-shell__actions');
        const logout = document.getElementById('access-logout');
        if (logout && actions) actions.prepend(logout);

        updateThemeButtons(validTheme(document.documentElement.dataset.theme) || readTheme());
        window.dispatchEvent(new CustomEvent('evidenta:shellready'));
    }

    ensureSharedAssets();
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
        pruneEditorialNoise();
        buildUniversalShell();
        pruneEditorialNoise();
        updateThemeButtons(readTheme());

        let scheduled = false;
        const observer = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
                scheduled = false;
                pruneEditorialNoise();
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
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

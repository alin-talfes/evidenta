(() => {
    'use strict';

    if (window.__EVIDENTA_VERSION_FOOTER__) return;
    window.__EVIDENTA_VERSION_FOOTER__ = true;

    const scriptUrl = document.currentScript?.src || new URL('js/version.js', document.baseURI).href;
    const versionUrl = new URL('../version.json', scriptUrl).href;
    const homeUrl = new URL('../', scriptUrl).href;
    let currentVersion = '—';

    function ensureScript(selector, src, datasetKey) {
        if (document.querySelector(selector)) return;
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        if (datasetKey) script.dataset[datasetKey] = 'true';
        document.head.appendChild(script);
    }

    function ensureUxUpgrades() {
        ensureScript(
            'script[data-evidenta-ux-controller]',
            new URL('./ux-upgrades.js?v=3', scriptUrl).href,
            'evidentaUxController'
        );
    }

    function ensureLegalReleaseGuards() {
        ensureScript(
            'script[data-evidenta-legal-release-guards]',
            new URL('./release-guards.js?v=1', scriptUrl).href,
            'evidentaLegalReleaseGuards'
        );
    }

    function ensurePageControllers() {
        if (document.getElementById('resultsCard') && document.getElementById('birthDate')) {
            ensureScript(
                'script[data-evidenta-pedepse-controller]',
                new URL('./pedepse-ux.js?v=2', scriptUrl).href,
                'evidentaPedepseController'
            );
        }

        if (location.pathname.includes('/ofiter/')) {
            ensureScript(
                'script[data-evidenta-officer-cockpit]',
                new URL('../ofiter/dashboard-cockpit.js?v=1', scriptUrl).href,
                'evidentaOfficerCockpit'
            );
        }
    }

    function ensureCalculationParity() {
        ensureScript(
            'script[data-evidenta-quarantine-rules]',
            new URL('./quarantine-rules.js?v=1', scriptUrl).href,
            'evidentaQuarantineRules'
        );
        if (location.pathname.includes('/ai/')) {
            ensureScript(
                'script[data-evidenta-ai-result-parity]',
                new URL('../ai/result-pedepse.js?v=1', scriptUrl).href,
                'evidentaAiResultParity'
            );
        } else if (document.getElementById('resultsCard') && document.getElementById('prisonReceivedDate')) {
            ensureScript(
                'script[data-evidenta-quarantine-ui]',
                new URL('./quarantine-ui.js?v=1', scriptUrl).href,
                'evidentaQuarantineUi'
            );
        }
    }

    function ensureOperationalUpgrades() {
        ensureScript(
            'script[data-evidenta-operational-upgrades]',
            new URL('./operational-upgrades.js?v=1', scriptUrl).href,
            'evidentaOperationalUpgrades'
        );
        /*
         * operational-corrections-v4 este punctul unic de compatibilitate pentru
         * Pedepse și încarcă doar controllerele stabile curente: modes-v5,
         * optional-fix-v2 și disclosure-hardening-v2.
         */
        ensureScript(
            'script[data-evidenta-operational-corrections]',
            new URL('./operational-corrections-v4.js?v=2', scriptUrl).href,
            'evidentaOperationalCorrections'
        );
        ensureScript(
            'script[data-evidenta-operational-finalize]',
            new URL('./operational-finalize.js?v=1', scriptUrl).href,
            'evidentaOperationalFinalize'
        );
        ensureScript(
            'script[data-evidenta-mobile-operational-v2]',
            new URL('./mobile-operational-v2.js?v=2', scriptUrl).href,
            'evidentaMobileOperationalV2'
        );
        ensureScript(
            'script[data-evidenta-pwa-register]',
            new URL('./pwa-register.js?v=2', scriptUrl).href,
            'evidentaPwaRegister'
        );
    }

    function ensureAiNavigation() {
        const nav = document.querySelector('.ev-shell__nav');
        if (!nav || [...nav.querySelectorAll('a')].some(a => {
            try { return /\/ai\/?$/.test(new URL(a.href, location.href).pathname); }
            catch (_) { return false; }
        })) return;
        const link = document.createElement('a');
        link.href = new URL('../ai/', scriptUrl).href;
        link.textContent = 'AI · BETA';
        link.dataset.aiDocumentsLink = 'true';
        if (/\/ai(?:\/|\/index\.html)?$/.test(location.pathname)) link.setAttribute('aria-current', 'page');
        const contopiri = [...nav.querySelectorAll('a')].find(a => /\/contopiri\/?$/.test(new URL(a.href, location.href).pathname));
        if (contopiri) nav.insertBefore(link, contopiri);
        else nav.appendChild(link);
    }

    function removeLegacyFooters() {
        document.querySelectorAll('footer').forEach(footer => footer.remove());
    }

    function normalizeBrandContainer() {
        let brand = document.querySelector('.ev-shell__brand');
        if (!brand || brand.tagName !== 'A') return brand;

        const replacement = document.createElement('div');
        replacement.className = brand.className;
        replacement.setAttribute('aria-label', 'Identitate Evidență PPL');
        while (brand.firstChild) replacement.appendChild(brand.firstChild);
        brand.replaceWith(replacement);
        return replacement;
    }

    function renderBrandIdentity(versionText = currentVersion) {
        removeLegacyFooters();
        const brand = normalizeBrandContainer();
        const copy = brand?.querySelector('.ev-shell__brand-copy') || document.querySelector('.ev-shell__brand-copy');
        if (!copy) return;
        copy.replaceChildren();

        const home = document.createElement('a');
        home.className = 'ev-shell__brand-home';
        home.href = homeUrl;
        home.setAttribute('aria-label', 'Evidență PPL — pagina principală');

        const title = document.createElement('strong');
        title.textContent = 'Evidență PPL';
        home.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'ev-shell__brand-meta';
        meta.append(document.createTextNode(` - versiune ${versionText} - copyright (c) `));

        const author = document.createElement('a');
        author.href = 'https://wa.me/alin.talfes';
        author.target = '_blank';
        author.rel = 'noopener noreferrer';
        author.textContent = 'Alin Talfeș';
        author.setAttribute('aria-label', 'Alin Talfeș pe WhatsApp');
        meta.appendChild(author);

        copy.append(home, meta);
    }

    async function initVersionIdentity() {
        removeLegacyFooters();
        try {
            const response = await fetch(versionUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const version = typeof data?.version === 'string' ? data.version.trim() : '';
            if (!version) throw new Error('Versiune invalidă');
            currentVersion = version;
        } catch (error) {
            console.error('Nu s-a putut încărca version.json:', error);
            currentVersion = '—';
        }
        renderBrandIdentity(currentVersion);
    }

    window.addEventListener('evidenta:shellready', () => {
        ensureAiNavigation();
        renderBrandIdentity(currentVersion);
    });
    ensureUxUpgrades();
    ensureLegalReleaseGuards();
    ensurePageControllers();
    ensureCalculationParity();
    ensureOperationalUpgrades();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ensureLegalReleaseGuards();
            ensurePageControllers();
            ensureCalculationParity();
            ensureOperationalUpgrades();
            ensureAiNavigation();
            initVersionIdentity();
        }, { once: true });
    } else {
        ensureLegalReleaseGuards();
        ensurePageControllers();
        ensureCalculationParity();
        ensureOperationalUpgrades();
        ensureAiNavigation();
        initVersionIdentity();
    }
})();
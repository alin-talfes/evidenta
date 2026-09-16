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

    function ensureStyle(selector, href, datasetKey) {
        if (document.querySelector(selector)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        if (datasetKey) link.dataset[datasetKey] = 'true';
        document.head.appendChild(link);
    }

    function ensureUxUpgrades() {
        ensureScript('script[data-evidenta-ux-controller]', new URL('./ux-upgrades.js?v=3', scriptUrl).href, 'evidentaUxController');
    }

    function ensureLegalReleaseGuards() {
        ensureScript('script[data-evidenta-legal-release-guards]', new URL('./release-guards.js?v=1', scriptUrl).href, 'evidentaLegalReleaseGuards');
    }

    function ensurePageControllers() {
        if (document.getElementById('resultsCard') && document.getElementById('birthDate')) {
            ensureScript('script[data-evidenta-pedepse-controller]', new URL('./pedepse-ux.js?v=2', scriptUrl).href, 'evidentaPedepseController');
        }
        if (location.pathname.includes('/ofiter/')) {
            ensureScript('script[data-evidenta-officer-cockpit]', new URL('../ofiter/dashboard-cockpit.js?v=1', scriptUrl).href, 'evidentaOfficerCockpit');
        }
    }

    function ensureCalculationParity() {
        ensureScript('script[data-evidenta-quarantine-rules]', new URL('./quarantine-rules.js?v=1', scriptUrl).href, 'evidentaQuarantineRules');
        if (location.pathname.includes('/ai/')) {
            ensureScript('script[data-evidenta-ai-result-parity]', new URL('../ai/result-pedepse.js?v=1', scriptUrl).href, 'evidentaAiResultParity');
        } else if (document.getElementById('resultsCard') && document.getElementById('prisonReceivedDate')) {
            ensureScript('script[data-evidenta-quarantine-ui]', new URL('./quarantine-ui.js?v=2', scriptUrl).href, 'evidentaQuarantineUi');
        }
    }

    function ensureGlobalOperationalControllers() {
        ensureStyle(
            'link[data-evidenta-disclosure-hardening]',
            new URL('../css/disclosure-hardening.css?v=2', scriptUrl).href,
            'evidentaDisclosureHardening'
        );
        ensureScript(
            'script[data-evidenta-no-nonoptional-disclosures]',
            new URL('./no-nonoptional-disclosures-v1.js?v=3', scriptUrl).href,
            'evidentaNoNonoptionalDisclosures'
        );
        ensureScript(
            'script[data-evidenta-disclosure-hardening-v2]',
            new URL('./disclosure-hardening-v2.js?v=2', scriptUrl).href,
            'evidentaDisclosureHardeningV2'
        );
    }

    function ensurePedepseOperationalControllers() {
        ensureScript(
            'script[data-evidenta-pedepse-modes-v5]',
            new URL('./pedepse-modes-v5.js?v=1', scriptUrl).href,
            'evidentaPedepseModesV5'
        );
        ensureScript(
            'script[data-evidenta-pedepse-optional-fix-v2]',
            new URL('./pedepse-optional-fix-v2.js?v=1', scriptUrl).href,
            'evidentaPedepseOptionalFixV2'
        );
        ensureScript(
            'script[data-evidenta-pedepse-prison-date]',
            new URL('./pedepse-prison-date.js?v=1', scriptUrl).href,
            'evidentaPedepsePrisonDate'
        );
    }

    function operationalPage() {
        const base = new URL('../', scriptUrl);
        const rootPath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
        if (!location.pathname.startsWith(rootPath)) return '';
        return location.pathname.slice(rootPath.length).replace(/^\/+|\/+$/g, '');
    }

    function isPedepsePage(p = operationalPage()) {
        return !p || p === 'index.html' || p === 'pedepse';
    }

    function ensureModuleOperationalControllers() {
        ensureStyle('link[data-evidenta-operational-upgrades]', new URL('../css/operational-upgrades.css?v=1', scriptUrl).href, 'evidentaOperationalUpgrades');
        ensureStyle('link[data-evidenta-mobile-modules]', new URL('../css/mobile-modules.css?v=1', scriptUrl).href, 'evidentaMobileModules');
        ensureScript('script[data-evidenta-operational-navigation]', new URL('./operational-navigation.js?v=3', scriptUrl).href, 'evidentaOperationalNavigation');

        const p = operationalPage();
        if (isPedepsePage(p)) {
            ensureScript('script[data-evidenta-operational-pedepse]', new URL('./operational-pedepse.js?v=3', scriptUrl).href, 'evidentaOperationalPedepse');
        } else if (p.startsWith('ai')) {
            ensureScript('script[data-evidenta-operational-ai]', new URL('./operational-ai.js?v=3', scriptUrl).href, 'evidentaOperationalAi');
        } else if (p.startsWith('contopiri')) {
            ensureScript('script[data-evidenta-operational-contopiri]', new URL('./operational-contopiri.js?v=2', scriptUrl).href, 'evidentaOperationalContopiri');
        } else if (p === 'transfer' || p === 'transfer/index.html') {
            ensureScript('script[data-evidenta-operational-transfer]', new URL('./operational-transfer.js?v=2', scriptUrl).href, 'evidentaOperationalTransfer');
        } else if (p.startsWith('instructaj')) {
            ensureScript('script[data-evidenta-operational-instructaj]', new URL('./operational-instructaj.js?v=1', scriptUrl).href, 'evidentaOperationalInstructaj');
        } else if (p.startsWith('semnalmente')) {
            ensureScript('script[data-evidenta-operational-semnalmente]', new URL('./operational-semnalmente.js?v=2', scriptUrl).href, 'evidentaOperationalSemnalmente');
        }
        return p;
    }

    function ensureOperationalRuntime() {
        const p = ensureModuleOperationalControllers();
        if (isPedepsePage(p)) ensurePedepseOperationalControllers();
        ensureGlobalOperationalControllers();
        ensureScript('script[data-evidenta-pwa-register]', new URL('./pwa-register.js?v=2', scriptUrl).href, 'evidentaPwaRegister');
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

    window.addEventListener('evidenta:shellready', () => renderBrandIdentity(currentVersion));
    ensureUxUpgrades();
    ensureLegalReleaseGuards();
    ensurePageControllers();
    ensureCalculationParity();
    ensureOperationalRuntime();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ensureLegalReleaseGuards();
            ensurePageControllers();
            ensureCalculationParity();
            ensureOperationalRuntime();
            initVersionIdentity();
        }, { once: true });
    } else {
        ensureLegalReleaseGuards();
        ensurePageControllers();
        ensureCalculationParity();
        ensureOperationalRuntime();
        initVersionIdentity();
    }
})();
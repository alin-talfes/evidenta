(() => {
    'use strict';

    if (window.__EVIDENTA_VERSION_FOOTER__) return;
    window.__EVIDENTA_VERSION_FOOTER__ = true;

    const scriptUrl = document.currentScript?.src || new URL('js/version.js', document.baseURI).href;
    const versionUrl = new URL('../version.json', scriptUrl).href;

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
            new URL('./ux-upgrades.js?v=1', scriptUrl).href,
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
                new URL('./pedepse-ux.js?v=1', scriptUrl).href,
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

    function ensureAiNavigation() {
        const nav = document.querySelector('.ev-shell__nav');
        if (!nav || nav.querySelector('[data-ai-documents-link]')) return;
        const link = document.createElement('a');
        link.href = new URL('../ai/', scriptUrl).href;
        link.textContent = 'AI · ALPHA';
        link.dataset.aiDocumentsLink = 'true';
        if (/\/ai(?:\/|\/index\.html)?$/.test(location.pathname)) link.setAttribute('aria-current', 'page');
        const contopiri = [...nav.querySelectorAll('a')].find(a => /\/contopiri\/?$/.test(new URL(a.href, location.href).pathname));
        if (contopiri?.nextSibling) nav.insertBefore(link, contopiri.nextSibling);
        else nav.appendChild(link);
    }

    function renderFooter(versionText) {
        document.querySelectorAll('footer').forEach(footer => footer.remove());

        const footer = document.createElement('footer');
        footer.className = 'ev-footer';
        footer.dataset.evidentaFooter = 'true';
        footer.setAttribute('role', 'contentinfo');

        const inner = document.createElement('div');
        inner.className = 'ev-footer__inner';

        const version = document.createElement('span');
        version.className = 'ev-footer__version';
        version.textContent = `Versiune ${versionText}`;

        const copyright = document.createElement('span');
        copyright.className = 'ev-footer__copyright';
        copyright.textContent = '© Alin Talfeș';

        inner.append(version, copyright);
        footer.appendChild(inner);
        document.body.appendChild(footer);
    }

    async function initFooter() {
        try {
            const response = await fetch(versionUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const version = typeof data?.version === 'string' ? data.version.trim() : '';
            if (!version) throw new Error('Versiune invalidă');
            renderFooter(version);
        } catch (error) {
            console.error('Nu s-a putut încărca version.json:', error);
            renderFooter('—');
        }
    }

    window.addEventListener('evidenta:shellready', ensureAiNavigation);
    ensureUxUpgrades();
    ensureLegalReleaseGuards();
    ensurePageControllers();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ensureLegalReleaseGuards();
            ensurePageControllers();
            ensureAiNavigation();
            initFooter();
        }, { once: true });
    } else {
        ensureLegalReleaseGuards();
        ensureAiNavigation();
        initFooter();
    }
})();

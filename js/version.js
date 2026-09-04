(() => {
    'use strict';

    if (window.__EVIDENTA_VERSION_FOOTER__) return;
    window.__EVIDENTA_VERSION_FOOTER__ = true;

    const scriptUrl = document.currentScript?.src || new URL('js/version.js', document.baseURI).href;
    const versionUrl = new URL('../version.json', scriptUrl).href;

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFooter, { once: true });
    } else {
        initFooter();
    }
})();

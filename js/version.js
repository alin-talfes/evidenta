(() => {
    'use strict';

    if (window.__EVIDENTA_VERSION_FOOTER__) return;
    window.__EVIDENTA_VERSION_FOOTER__ = true;

    const scriptUrl = document.currentScript?.src || new URL('js/version.js', document.baseURI).href;
    const versionUrl = new URL('../version.json', scriptUrl).href;
    const homeUrl = new URL('../', scriptUrl).href;
    let currentVersion = '—';
    let bootstrapped = false;

    function removeLegacyFooters() {
        document.querySelectorAll('footer').forEach(footer => footer.remove());
    }

    function normalizeBrandContainer() {
        let brand = document.querySelector('.ev-shell__brand');
        if (!brand || brand.tagName !== 'A') return brand;
        const replacement = document.createElement('div');
        replacement.className = brand.className;
        replacement.setAttribute('aria-label', 'Identitate Inmate Pocket Calculator');
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
        home.setAttribute('aria-label', 'Inmate Pocket Calculator — pagina principală');
        const title = document.createElement('strong');
        title.textContent = 'Inmate Pocket Calculator';
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

    function bootstrap() {
        if (bootstrapped) return;
        bootstrapped = true;
        initVersionIdentity();
    }

    window.addEventListener('evidenta:shellready', () => renderBrandIdentity(currentVersion));

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    } else {
        bootstrap();
    }
})();

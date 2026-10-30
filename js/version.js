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
        const mark = brand?.querySelector('.ev-shell__mark');
        if (mark) {
            mark.innerHTML = '<svg class="ev-shell__calculator" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="2.5"></rect><rect x="7" y="5.5" width="10" height="4" rx="1"></rect><path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 16.5h.01M12 16.5h.01M16.5 16.5h.01"></path></svg>';
            mark.setAttribute('aria-label', 'Calculator');
        }
        const mark = brand?.querySelector('.ev-shell__mark');
        if (mark) {
            mark.innerHTML = '<svg class="ev-shell__calculator" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="2.5"></rect><rect x="7" y="5.5" width="10" height="4" rx="1"></rect><path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 16.5h.01M12 16.5h.01M16.5 16.5h.01"></path></svg>';
            mark.setAttribute('aria-label', 'Calculator');
        }
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

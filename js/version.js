(() => {
    const scriptUrl = document.currentScript?.src || new URL('js/version.js', document.baseURI).href;
    const versionUrl = new URL('../version.json', scriptUrl).href;

    function renderFooter(versionText) {
        const container = document.querySelector('.container') || document.body;
        let footer = document.querySelector('footer.footer');
        if (!footer) {
            footer = document.createElement('footer');
            footer.className = 'footer';
            footer.setAttribute('role', 'contentinfo');
            container.appendChild(footer);
        }

        footer.replaceChildren();
        const firstLine = document.createElement('div');
        const version = document.createElement('span');
        version.id = 'app-version';
        version.textContent = versionText;
        firstLine.append(version, document.createTextNode(' | © Alin Talfeș'));

        const privacy = document.createElement('div');
        privacy.className = 'footer-privacy';
        privacy.textContent = 'Toate datele sunt stocate exclusiv local, în browserul utilizatorului (localStorage) și nu sunt transmise către servere externe.';

        footer.append(firstLine, privacy);
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch(versionUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!data || typeof data.version !== 'string' || !data.version.trim()) throw new Error('Versiune invalidă');
            renderFooter(`Versiune ${data.version.trim()}`);
        } catch (error) {
            console.error('Nu s-a putut încărca version.json:', error);
            renderFooter('Versiune indisponibilă');
        }
    });
})();

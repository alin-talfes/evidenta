// Shared dark/light theme controller for the entire Evidenta PPL application.
(function () {
    'use strict';

    const THEME_STORAGE_KEY = 'evidenta-theme';
    const LEGACY_KEYS = ['anpTheme', 'descriere-semnalmente-theme'];
    const THEME_CONTROL_SELECTOR = '#themeToggle, #btn-theme, #theme-btn, #evidenta-theme-toggle';

    function ensureDesignSystem() {
        if (document.querySelector('link[data-evidenta-design-system]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = new URL('../css/design-system.css?v=3', document.currentScript?.src || location.href).href;
        link.dataset.evidentaDesignSystem = 'true';
        document.head.appendChild(link);
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
        // Păstrează temporar cheile vechi sincronizate pentru modulele/cache-urile mai vechi.
        for (const key of LEGACY_KEYS) localStorage.setItem(key, theme);
    }

    function updateThemeMeta(theme) {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = theme === 'light' ? '#ffffff' : '#0b1220';
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

    function ensureFallbackControl() {
        if (document.querySelector(THEME_CONTROL_SELECTOR)) return;
        const host = document.querySelector('.top-actions, .header-actions, .app-nav, .site-header');
        if (!host) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'evidenta-theme-toggle';
        button.className = 'icon-btn evidenta-theme-toggle';
        host.appendChild(button);
        updateThemeButtons(validTheme(document.documentElement.dataset.theme) || readTheme());
    }

    ensureDesignSystem();
    const initialTheme = readTheme();
    // Aplică pe <html> imediat, înainte de primul paint, pe cât permite ordinea scripturilor.
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.style.colorScheme = initialTheme;
    persistTheme(initialTheme);
    updateThemeMeta(initialTheme);

    // Capture phase: controlul comun are prioritate față de handler-ele istorice ale modulelor.
    document.addEventListener('click', event => {
        const button = event.target.closest?.(THEME_CONTROL_SELECTOR);
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        toggleTheme();
    }, true);

    function initTheme() {
        applyTheme(readTheme());
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme, { once: true });
    } else {
        initTheme();
    }
})();

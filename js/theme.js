// Shared dark/light theme controller for the entire Evidenta PPL application.
(function () {
    'use strict';

    const THEME_STORAGE_KEY = 'anpTheme';

    function updateThemeButton() {
        const button = document.getElementById('themeToggle');
        if (!button) return;
        const isLight = document.body.classList.contains('light');
        button.textContent = isLight ? '☀️' : '🌙';
        button.setAttribute('aria-label', isLight ? 'Activează tema întunecată' : 'Activează tema luminoasă');
        button.setAttribute('title', isLight ? 'Temă întunecată' : 'Temă luminoasă');
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
        meta.content = isLight ? '#ffffff' : '#061426';
    }

    function applyTheme() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        document.body.classList.toggle('light', savedTheme === 'light');
        updateThemeButton();
    }

    function toggleTheme() {
        const isLight = !document.body.classList.contains('light');
        document.body.classList.toggle('light', isLight);
        localStorage.setItem(THEME_STORAGE_KEY, isLight ? 'light' : 'dark');
        updateThemeButton();
    }

    function initTheme() {
        applyTheme();
        const button = document.getElementById('themeToggle');
        if (button && !button.hasAttribute('onclick')) {
  button.addEventListener('click', toggleTheme);
        }
    }

    window.applyTheme = applyTheme;
    window.toggleTheme = toggleTheme;
    window.EVIDENTA_THEME_STORAGE_KEY = THEME_STORAGE_KEY;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme, { once: true });
    } else {
        initTheme();
    }
})();

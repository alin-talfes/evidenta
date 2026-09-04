(() => {
    'use strict';

    function ensureDesignSystem() {
        if (document.querySelector('link[data-evidenta-design-system]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../css/design-system.css?v=3';
        link.dataset.evidentaDesignSystem = 'true';
        document.head.appendChild(link);
    }

    function ensureUniversalTheme() {
        if (document.querySelector('script[data-evidenta-theme-controller]')) return;
        const script = document.createElement('script');
        script.src = '../js/theme.js?v=3';
        script.async = false;
        script.dataset.evidentaThemeController = 'true';
        document.head.appendChild(script);
    }

    ensureDesignSystem();
    ensureUniversalTheme();

    const MAX_FILE_BYTES = 15 * 1024 * 1024;
    const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
    const THEME_KEY = 'evidenta-theme';
    let toastTimer = null;

    function $(id) { return document.getElementById(id); }

    function showToast(message, type = 'info') {
        const toast = $('toast');
        if (!toast) return;
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.className = `toast visible${type === 'error' ? ' error' : ''}`;
        toastTimer = window.setTimeout(() => { toast.className = 'toast'; }, 3200);
    }

    function setStatus(message, type = 'info') {
        const status = $('status');
        if (!status) return;
        status.className = `status ${type}`;
        status.textContent = message;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes < 0) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    }

    function validateFile(file) {
        if (!file) return 'Nu a fost selectat niciun fișier.';
        const extensionOk = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '');
        if (file.type && !ALLOWED_MIME.has(file.type)) return 'Format neacceptat. Folosește JPG, PNG, WEBP, HEIC sau HEIF.';
        if (!file.type && !extensionOk) return 'Format neacceptat. Folosește JPG, PNG, WEBP, HEIC sau HEIF.';
        if (file.size > MAX_FILE_BYTES) return 'Imaginea depășește limita de 15 MB.';
        if (file.size === 0) return 'Fișierul selectat este gol.';
        return null;
    }

    function inspectImage(file, prefix) {
        const meta = $(`meta-${prefix}`);
        if (!meta || !file) return;

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const minSide = Math.min(img.naturalWidth, img.naturalHeight);
            const warning = minSide < 720 ? ' · rezoluție redusă — rezultatele pot fi mai puțin stabile' : '';
            meta.innerHTML = `<strong>${escapeHtml(file.name)}</strong> · ${img.naturalWidth}×${img.naturalHeight} px · ${formatBytes(file.size)}${warning ? `<span class="quality-warning">${warning}</span>` : ''}`;
            meta.classList.add('visible');
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            meta.textContent = `${file.name} · ${formatBytes(file.size)}`;
            meta.classList.add('visible');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }

    function clearMeta(prefix) {
        const meta = $(`meta-${prefix}`);
        if (meta) { meta.textContent = ''; meta.classList.remove('visible'); }
    }

    function prefixFromInput(input) {
        return input?.id === 'file-frontal' ? 'frontal' : input?.id === 'file-profil' ? 'profil' : null;
    }

    document.addEventListener('change', event => {
        const input = event.target;
        const prefix = prefixFromInput(input);
        if (!prefix) return;
        const file = input.files?.[0];
        if (!file) { clearMeta(prefix); return; }
        const error = validateFile(file);
        if (error) {
            event.preventDefault();
            event.stopImmediatePropagation();
            input.value = '';
            clearMeta(prefix);
            setStatus(error, 'error');
            showToast(error, 'error');
            return;
        }
        inspectImage(file, prefix);
    }, true);

    document.addEventListener('drop', event => {
        const zone = event.target.closest?.('.upload-zone');
        if (!zone) return;
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;
        const error = validateFile(file);
        if (error) {
            event.preventDefault();
            event.stopImmediatePropagation();
            zone.classList.remove('dragover');
            setStatus(error, 'error');
            showToast(error, 'error');
            return;
        }
        inspectImage(file, zone.id === 'drop-frontal' ? 'frontal' : 'profil');
    }, true);

    function buildTextReport() {
        const cards = [...document.querySelectorAll('#results-grid .result-card')];
        if (!cards.length) return '';
        const lines = ['FIȘĂ DE SEMNALMENTE', `Generată: ${new Date().toLocaleString('ro-RO')}`, ''];
        for (const card of cards) {
            const title = card.querySelector('.card-title')?.textContent?.trim();
            if (!title || title.toLowerCase() === 'fiabilitate') continue;
            const entries = [];
            card.querySelectorAll('.field').forEach(field => {
                const label = field.querySelector('.field-label')?.textContent?.trim();
                const value = field.querySelector('.field-value')?.textContent?.trim() || field.querySelector('input, textarea, select')?.value?.trim();
                if (label && value) entries.push(`${label}: ${value}`);
            });
            if (entries.length) {
                lines.push(title.toUpperCase());
                lines.push(...entries);
                lines.push('');
            }
        }
        lines.push('Notă: rezultate generate automat și supuse verificării umane.');
        return lines.join('\n');
    }

    async function copyReport() {
        const text = buildTextReport();
        if (!text) { showToast('Nu există o fișă de copiat.', 'error'); return; }
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }
        showToast('Fișa a fost copiată în clipboard.');
    }

    function getSavedEntries() {
        const entries = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key?.startsWith('semnalmente:')) continue;
            try {
                entries.push({ key, data: JSON.parse(localStorage.getItem(key)) });
            } catch {
                entries.push({ key, data: null });
            }
        }
        return entries.sort((a, b) => b.key.localeCompare(a.key));
    }

    function updateSavedCount() {
        const counter = $('saved-count');
        if (counter) counter.textContent = String(getSavedEntries().length);
    }

    function downloadJson(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    function exportAll() {
        const entries = getSavedEntries();
        if (!entries.length) { showToast('Nu există fișe salvate de exportat.', 'error'); return; }
        downloadJson({
            format: 'descriere-semnalmente-archive',
            exportedAt: new Date().toISOString(),
            count: entries.length,
            entries
        }, `semnalmente_arhiva_${new Date().toISOString().slice(0, 10)}.json`);
        showToast(`${entries.length} fișe au fost exportate.`);
    }

    function looksLikeAnalysis(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
        const known = ['frunte', 'nas', 'ochi', 'gura', 'barbie', 'tipFata', 'par', 'sprancene', 'barba', 'mustata', 'urechi', 'semneParticulare'];
        return known.some(key => Object.prototype.hasOwnProperty.call(data, key));
    }

    function importJsonFile(file) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Fișierul JSON este prea mare.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                const items = parsed?.format === 'descriere-semnalmente-archive' && Array.isArray(parsed.entries)
                    ? parsed.entries.map(entry => entry?.data).filter(looksLikeAnalysis)
                    : looksLikeAnalysis(parsed) ? [parsed] : [];
                if (!items.length) throw new Error('Fișierul nu conține o fișă compatibilă.');
                const now = Date.now();
                items.forEach((item, index) => {
                    localStorage.setItem(`semnalmente:${now + index}`, JSON.stringify(item));
                });
                sessionStorage.setItem('descriere-semnalmente-flash', `${items.length} fișă${items.length === 1 ? '' : 'e'} importată${items.length === 1 ? '' : 'e'} cu succes.`);
                location.reload();
            } catch (error) {
                showToast(error.message || 'Importul JSON a eșuat.', 'error');
            }
        };
        reader.onerror = () => showToast('Fișierul JSON nu a putut fi citit.', 'error');
        reader.readAsText(file, 'utf-8');
    }

    function clearAllSaved() {
        const entries = getSavedEntries();
        if (!entries.length) { showToast('Arhiva locală este deja goală.'); return; }
        if (!confirm(`Ștergi definitiv toate cele ${entries.length} fișe salvate în acest browser?`)) return;
        entries.forEach(entry => localStorage.removeItem(entry.key));
        sessionStorage.setItem('descriere-semnalmente-flash', 'Arhiva locală a fost ștearsă.');
        location.reload();
    }

    function initTheme() {
        if (window.EVIDENTA_THEME) {
            window.applyTheme?.();
            return;
        }
        const saved = localStorage.getItem(THEME_KEY);
        const preferred = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.dataset.theme = preferred;
        document.body.classList.toggle('light', preferred === 'light');
        document.body.classList.toggle('dark', preferred === 'dark');
        const button = $('btn-theme');
        if (!button) return;
        button.setAttribute('aria-pressed', preferred === 'light' ? 'true' : 'false');
        button.addEventListener('click', () => {
            const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
            document.documentElement.dataset.theme = next;
            document.body.classList.toggle('light', next === 'light');
            document.body.classList.toggle('dark', next === 'dark');
            localStorage.setItem(THEME_KEY, next);
            button.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
        });
    }

    function initKeyboardUpload() {
        document.querySelectorAll('.upload-zone').forEach(zone => {
            zone.addEventListener('keydown', event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                if (event.target.closest('button')) return;
                event.preventDefault();
                zone.querySelector('input[type="file"]')?.click();
            });
        });
        ['frontal', 'profil'].forEach(prefix => {
            $(`remove-${prefix}`)?.addEventListener('click', () => clearMeta(prefix));
        });
    }

    function normalizeReliabilityNotice() {
        document.querySelectorAll('#results-grid .result-card').forEach(card => {
            const title = card.querySelector('.card-title')?.textContent?.trim().toLowerCase();
            if (title !== 'fiabilitate') return;
            const paragraph = card.querySelector('p');
            if (!paragraph) return;
            paragraph.textContent = 'Rezultatele sunt clasificări euristice bazate pe geometria landmark-urilor și sampling de culoare. Aplicația nu calculează un scor de încredere validat pentru aceste categorii. Fotografia de profil poate îmbunătăți analiza nasului și a urechii. Verificarea umană este obligatorie înainte de utilizarea rezultatului.';
        });
    }

    function initResultsObserver() {
        const grid = $('results-grid');
        if (!grid) return;
        normalizeReliabilityNotice();
        new MutationObserver(normalizeReliabilityNotice).observe(grid, { childList: true, subtree: true });
    }

    function initSavedObserver() {
        const target = $('saved-items');
        if (!target) return;
        updateSavedCount();
        new MutationObserver(updateSavedCount).observe(target, { childList: true, subtree: true });
    }

    function initActions() {
        $('btn-copy-report')?.addEventListener('click', copyReport);
        $('btn-print')?.addEventListener('click', () => window.print());
        $('btn-export-all')?.addEventListener('click', exportAll);
        $('btn-clear-saved')?.addEventListener('click', clearAllSaved);
        $('btn-import')?.addEventListener('click', () => $('import-json')?.click());
        $('import-json')?.addEventListener('change', event => {
            importJsonFile(event.target.files?.[0]);
            event.target.value = '';
        });
    }

    function initFlash() {
        const flash = sessionStorage.getItem('descriere-semnalmente-flash');
        if (!flash) return;
        sessionStorage.removeItem('descriere-semnalmente-flash');
        window.setTimeout(() => showToast(flash), 200);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initKeyboardUpload();
        initActions();
        initResultsObserver();
        initSavedObserver();
        initFlash();
    });
})();

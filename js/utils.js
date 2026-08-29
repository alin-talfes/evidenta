// ========== FUNCȚII UTILITARE ==========

/**
 * Parsează o dată în format zz.ll.aaaa.
 * @param {string} str - data de intrare
 * @returns {Date|null} - obiect Date sau null dacă e invalidă
 */
function parseDate(str) {
    if (!str) return null;
    str = str.trim();
    const parts = str.split('.');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const d = new Date(year, month - 1, day);
            if (d.getDate() === day && d.getMonth() === month - 1 && d.getFullYear() === year) {
                return d;
            }
        }
    }
    return null;
}

/**
 * Formatează o dată ca zz.ll.aaaa.
 * @param {Date} d - data
 * @returns {string} - data formatată sau '—' dacă e invalidă
 */
function fmtDate(d) {
    if (d && !isNaN(d)) {
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    }
    return '—';
}

/**
 * Returnează data de azi la miezul nopții.
 * @returns {Date}
 */
function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Calculează diferența în zile între două date.
 * @param {Date} a - data mai mică
 * @param {Date} b - data mai mare
 * @returns {number} - număr de zile
 */
function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Adaugă calendaristic ani, luni și zile la o dată.
 * @param {Date} date - data de bază
 * @param {number} years - ani de adăugat
 * @param {number} months - luni de adăugat
 * @param {number} days - zile de adăugat
 * @returns {Date}
 */
function addCalendarSafe(date, years, months, days) {
    const d = new Date(date);
    if (isNaN(d)) return new Date(NaN);
    const originalDay = d.getDate();
    d.setDate(1);
    d.setFullYear(d.getFullYear() + Number(years || 0));
    d.setMonth(d.getMonth() + Number(months || 0));
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, maxDay));
    d.setDate(d.getDate() + Number(days || 0));
    return d;
}

/**
 * Calculează vârsta exactă în ani, luni și zile.
 * @param {Date} birth - data nașterii
 * @param {Date} now - data de referință
 * @returns {{y: number, m: number, d: number}}
 */
function ageExact(birth, now) {
    let y = now.getFullYear() - birth.getFullYear();
    let m = now.getMonth() - birth.getMonth();
    let d = now.getDate() - birth.getDate();

    if (d < 0) {
        m--;
        d += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (m < 0) {
        y--;
        m += 12;
    }

    return { y, m, d };
}

/**
 * Returnează reprezentarea text a unei fracții uzuale.
 * @param {number} r - valoarea fracției
 * @returns {string}
 */
function fracStr(r) {
    if (r === 1/3) return '⅓';
    if (r === 1/2) return '½';
    if (r === 2/3) return '⅔';
    if (r === 3/4) return '¾';
    if (r === 1/4) return '¼';
    if (r === 1/100) return '1/100';
    return r.toString();
}


/** Escapează text pentru inserare sigură în HTML. */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

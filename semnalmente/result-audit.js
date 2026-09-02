export function getPath(object, path) {
    return path.split('.').reduce((value, key) => value?.[key], object);
}

export function setPath(object, path, value) {
    const keys = path.split('.');
    let cursor = object;
    for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        const next = keys[index + 1];
        if (cursor[key] == null) cursor[key] = /^\d+$/.test(next) ? [] : {};
        cursor = cursor[key];
    }
    cursor[keys.at(-1)] = value;
    return object;
}

export function valuesEqual(a, b) {
    return String(a ?? '') === String(b ?? '');
}

export function recordCorrection(corrections, path, automatic, value, changedAt = new Date().toISOString()) {
    const next = { ...(corrections || {}) };
    if (valuesEqual(automatic, value)) {
        delete next[path];
        return next;
    }
    next[path] = { automatic, value, changedAt };
    return next;
}

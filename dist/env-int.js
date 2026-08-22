/**
 * Shared strict-integer parsing and positive-integer normalization for
 * environment-configured numeric settings.
 */
export function parseStrictInteger(value) {
    const trimmed = value.trim();
    if (!/^[+-]?\d+$/.test(trimmed)) {
        return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
}
export function parsePositiveInteger(value, fallback) {
    if (value === undefined || value.trim() === "") {
        return fallback;
    }
    const parsed = parseStrictInteger(value);
    return parsed === undefined || parsed <= 0 ? fallback : parsed;
}
export function normalizePositiveInteger(value, fallback) {
    return !Number.isFinite(value) || !Number.isInteger(value) || value <= 0 ? fallback : value;
}

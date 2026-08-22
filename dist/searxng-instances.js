const FAILURE_COOLDOWN_THRESHOLD = 3;
const FAILURE_COOLDOWN_MS = 60_000;
const healthByInstance = new Map();
function getActiveHealth(instanceUrl, now) {
    const state = healthByInstance.get(instanceUrl);
    if (!state) {
        return undefined;
    }
    if (state.cooledUntil > 0 && state.cooledUntil <= now) {
        healthByInstance.delete(instanceUrl);
        return undefined;
    }
    return state;
}
export function parseSearxngUrls(raw = process.env.SEARXNG_URL) {
    if (raw === undefined) {
        return [];
    }
    return raw
        .split(";")
        .map((entry) => entry.trim())
        .filter((entry) => entry !== "");
}
export function getSearxngInstances() {
    return parseSearxngUrls();
}
export function getPrimarySearxngInstance() {
    return getSearxngInstances()[0];
}
export function validateSearxngInstanceUrl(value, entryIndex) {
    const entry = entryIndex === undefined ? "" : ` entry ${entryIndex}`;
    try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) {
            return `SEARXNG_URL${entry} uses unsupported protocol ${url.protocol} for ${url.hostname}`;
        }
    }
    catch {
        return `SEARXNG_URL${entry} has invalid format`;
    }
    return null;
}
export function redactSearxngInstanceUrl(raw) {
    try {
        const url = new URL(raw);
        if (!url.username && !url.password) {
            return raw;
        }
        url.username = "";
        url.password = "";
        return url.toString();
    }
    catch {
        return "[invalid SearXNG URL]";
    }
}
export function stripSearxngInstanceUrlUserinfo(url) {
    const stripped = new URL(url.toString());
    stripped.username = "";
    stripped.password = "";
    return stripped;
}
// `URL` stores userinfo percent-encoded, so decode before base64. A literal `%`
// the operator forgot to encode (e.g. `100%` instead of `100%25`) parses fine as
// a URL but makes decodeURIComponent throw URIError — fall back to the raw value
// instead of crashing request setup rather than guess at re-encoding.
function decodeUserinfoComponent(value) {
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
}
export function getSearxngBasicAuthHeader(url) {
    // URL auth requires a username (username-only token or username+password).
    // Password-only userinfo (`https://:pass@host`) is treated as absent so a
    // mistyped URL falls back to global AUTH_* / no header instead of sending a
    // stray secret; the password is still stripped from the outgoing URL.
    if (url.username !== "") {
        const username = decodeUserinfoComponent(url.username);
        const password = decodeUserinfoComponent(url.password);
        return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
    }
    const username = process.env.AUTH_USERNAME;
    const password = process.env.AUTH_PASSWORD;
    if (username && password) {
        const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
        return `Basic ${base64Auth}`;
    }
    return undefined;
}
export function isSearxngFanoutEnabled() {
    return process.env.SEARXNG_FANOUT === "true";
}
export function recordSearxngInstanceFailure(instanceUrl, now = Date.now()) {
    const current = getActiveHealth(instanceUrl, now) ?? { consecutiveFailures: 0, cooledUntil: 0 };
    const consecutiveFailures = current.consecutiveFailures + 1;
    healthByInstance.set(instanceUrl, {
        consecutiveFailures,
        cooledUntil: consecutiveFailures >= FAILURE_COOLDOWN_THRESHOLD ? now + FAILURE_COOLDOWN_MS : current.cooledUntil,
    });
}
export function recordSearxngInstanceSuccess(instanceUrl) {
    healthByInstance.delete(instanceUrl);
}
export function isSearxngInstanceCooledDown(instanceUrl, now = Date.now()) {
    const state = getActiveHealth(instanceUrl, now);
    if (!state) {
        return false;
    }
    return state.cooledUntil > now;
}
export function getHealthySearxngInstances(instances, now = Date.now()) {
    return instances.filter((instanceUrl) => !isSearxngInstanceCooledDown(instanceUrl, now));
}
export function clearSearxngInstanceStateForTests() {
    healthByInstance.clear();
}

import { logMessage } from "./logging.js";
import { applySearchRequestConfig, fetchSearxng } from "./proxy.js";
import { getSearxngInstances, redactSearxngInstanceUrl, stripSearxngInstanceUrlUserinfo } from "./searxng-instances.js";
const CONFIG_FAILURE_CACHE_TTL_MS = 60_000;
const cachedConfigs = new Map();
const cachedConfigFailures = new Map();
function redactFailures(failures) {
    return failures.map(({ sourceUrl, message, status }) => ({
        sourceUrl: redactSearxngInstanceUrl(sourceUrl),
        message,
        ...(status !== undefined ? { status } : {}),
    }));
}
function unavailable(message, failures = []) {
    return JSON.stringify({
        available: false,
        message,
        ...(failures.length > 0 ? { instancesUnreachable: redactFailures(failures) } : {}),
    }, null, 2);
}
function categoryNamesFromEngines(config) {
    const names = new Set();
    if (Array.isArray(config.engines)) {
        for (const engine of config.engines) {
            for (const category of engineCategories(engine)) {
                if (typeof category === "string" && category.trim() !== "") {
                    names.add(category);
                }
            }
        }
    }
    return [...names];
}
function categoryNamesFromList(values) {
    const names = new Set();
    for (const category of values) {
        if (typeof category === "string" && category.trim() !== "") {
            names.add(category);
        }
    }
    return [...names];
}
function configuredCategoryNames(config) {
    if (Array.isArray(config.categories)) {
        return categoryNamesFromList(config.categories);
    }
    if (config.categories && typeof config.categories === "object") {
        return categoryNamesFromList(Object.keys(config.categories));
    }
    return [];
}
function namesFromCategories(config) {
    const names = new Set(configuredCategoryNames(config));
    for (const category of categoryNamesFromEngines(config)) {
        names.add(category);
    }
    return [...names].sort();
}
function engineCategories(engine) {
    if (Array.isArray(engine.categories)) {
        return engine.categories;
    }
    if (typeof engine.category === "string") {
        return [engine.category];
    }
    return [];
}
function engineSets(config, category) {
    const enabled = new Set();
    const disabled = new Set();
    if (Array.isArray(config.engines)) {
        for (const engine of config.engines) {
            if (!engine || typeof engine.name !== "string") {
                continue;
            }
            const categories = engineCategories(engine);
            if (category && !categories.includes(category)) {
                continue;
            }
            if (engine.disabled) {
                disabled.add(engine.name);
            }
            else {
                enabled.add(engine.name);
            }
        }
    }
    return { enabled, disabled };
}
function allEngineNames(config) {
    const names = new Set();
    if (Array.isArray(config.engines)) {
        for (const engine of config.engines) {
            if (engine && typeof engine.name === "string") {
                names.add(engine.name);
            }
        }
    }
    return names;
}
function sorted(values) {
    return [...values].sort();
}
function union(sets) {
    const result = new Set();
    for (const set of sets) {
        for (const value of set) {
            result.add(value);
        }
    }
    return result;
}
function intersection(sets) {
    if (sets.length === 0) {
        return new Set();
    }
    const result = new Set(sets[0]);
    for (const set of sets.slice(1)) {
        for (const value of [...result]) {
            if (!set.has(value)) {
                result.delete(value);
            }
        }
    }
    return result;
}
function categoriesForConfig(config, category) {
    const names = category
        ? namesFromCategories(config).filter((name) => name === category)
        : namesFromCategories(config);
    return new Set(names);
}
function aggregateCategories(configs, category) {
    const sets = configs.map(({ config }) => categoriesForConfig(config, category));
    return {
        common: sorted(intersection(sets)),
        available: sorted(union(sets)),
    };
}
function aggregateEngines(configs, includeDisabled, category) {
    const perInstance = configs.map(({ config }) => engineSets(config, category));
    const payload = {
        common: {
            enabled: sorted(intersection(perInstance.map(({ enabled }) => enabled))),
        },
        available: {
            enabled: sorted(union(perInstance.map(({ enabled }) => enabled))),
        },
    };
    if (includeDisabled) {
        payload.common.disabled = sorted(intersection(perInstance.map(({ disabled }) => disabled)));
        payload.available.disabled = sorted(union(perInstance.map(({ disabled }) => disabled)));
    }
    return payload;
}
function formatInstanceInfo(configs, failures, includeEngines, includeDisabled, category) {
    const primary = configs[0].config;
    const payload = {
        available: true,
        instancesReachable: configs.map(({ sourceUrl }) => redactSearxngInstanceUrl(sourceUrl)),
        ...(failures.length > 0 ? { instancesUnreachable: redactFailures(failures) } : {}),
        categories: aggregateCategories(configs, category),
        defaults: {
            safesearch: primary.search?.safe_search ?? primary.default_safe_search,
            locale: primary.default_locale,
            language: primary.default_language,
            theme: primary.default_theme,
        },
        defaultsNote: "Defaults, locales, and plugins are reported from the primary reachable instance and may vary across configured instances.",
        locales: primary.locales,
        plugins: primary.plugins ?? [],
    };
    if (includeEngines) {
        payload.engines = aggregateEngines(configs, includeDisabled, category);
    }
    return JSON.stringify(payload, null, 2);
}
export function clearInstanceInfoCacheForTests() {
    cachedConfigs.clear();
    cachedConfigFailures.clear();
}
function getCachedFailure(base, now = Date.now()) {
    const cached = cachedConfigFailures.get(base);
    if (!cached) {
        return null;
    }
    if (cached.until <= now) {
        cachedConfigFailures.delete(base);
        return null;
    }
    return {
        available: false,
        sourceUrl: base,
        message: cached.message,
        ...(cached.status !== undefined ? { status: cached.status } : {}),
    };
}
function cacheFailure(base, message, status) {
    cachedConfigFailures.set(base, {
        until: Date.now() + CONFIG_FAILURE_CACHE_TTL_MS,
        message,
        ...(status !== undefined ? { status } : {}),
    });
}
async function requestInstanceConfig(mcpServer, base) {
    try {
        const parsedBase = new URL(base.endsWith("/") ? base : `${base}/`);
        const url = new URL("config", parsedBase);
        const requestUrl = stripSearxngInstanceUrlUserinfo(url);
        const requestOptions = {
            signal: AbortSignal.timeout(5000),
        };
        applySearchRequestConfig(requestOptions, url.toString());
        const response = await fetchSearxng(requestUrl.toString(), requestOptions);
        if (!response.ok) {
            const message = `SearXNG /config is unavailable: HTTP ${response.status} ${response.statusText}`;
            return {
                available: false,
                message,
                status: response.status,
                sourceUrl: base,
            };
        }
        const config = await response.json();
        return { available: true, config, sourceUrl: base };
    }
    catch (error) {
        const rawMessage = error instanceof Error ? error.message : String(error);
        const safeMessage = rawMessage.replaceAll(base, redactSearxngInstanceUrl(base));
        logMessage(mcpServer, "warning", `SearXNG /config fetch failed for ${redactSearxngInstanceUrl(base)}: ${safeMessage}`);
        const message = "SearXNG /config is unavailable; instance capability discovery could not complete.";
        return {
            available: false,
            message,
            sourceUrl: base,
        };
    }
}
async function fetchConfigFromInstance(mcpServer, base) {
    const cached = cachedConfigs.get(base);
    if (cached) {
        return { available: true, config: cached, sourceUrl: base };
    }
    const cachedFailure = getCachedFailure(base);
    if (cachedFailure) {
        return cachedFailure;
    }
    const result = await requestInstanceConfig(mcpServer, base);
    if (result.available) {
        cachedConfigs.set(base, result.config);
        cachedConfigFailures.delete(base);
    }
    else {
        cacheFailure(base, result.message, result.status);
    }
    return result;
}
async function fetchConfigs(mcpServer, refresh = false) {
    const instances = getSearxngInstances();
    if (instances.length === 0) {
        return {
            available: false,
            message: "SEARXNG_URL is not configured; cannot fetch SearXNG /config.",
            failures: [],
        };
    }
    if (refresh) {
        cachedConfigs.clear();
        cachedConfigFailures.clear();
    }
    const results = await Promise.all(instances.map((instance) => fetchConfigFromInstance(mcpServer, instance)));
    const configs = results
        .filter((result) => result.available)
        .map(({ config, sourceUrl }) => ({ config, sourceUrl }));
    const failures = results
        .filter((result) => !result.available)
        .map(({ sourceUrl, message, status }) => ({
        sourceUrl,
        message,
        ...(status !== undefined ? { status } : {}),
    }));
    if (configs.length === 0) {
        return {
            available: false,
            message: "SearXNG /config is unavailable; no configured instances answered capability discovery.",
            failures,
        };
    }
    return { available: true, configs, failures };
}
async function getAggregatedCapability(mcpServer, refresh, extractor) {
    const result = await fetchConfigs(mcpServer, refresh);
    if (!result.available) {
        return null;
    }
    return union(result.configs.map(({ config }) => extractor(config)));
}
export async function getKnownEngines(mcpServer, refresh = false) {
    return getAggregatedCapability(mcpServer, refresh, allEngineNames);
}
export async function getKnownCategories(mcpServer, refresh = false) {
    return getAggregatedCapability(mcpServer, refresh, (config) => new Set(namesFromCategories(config)));
}
export async function fetchInstanceInfo(mcpServer, includeEngines = false, includeDisabled = false, category, refresh = false) {
    const result = await fetchConfigs(mcpServer, refresh);
    if (!result.available) {
        return unavailable(result.message, result.failures);
    }
    return formatInstanceInfo(result.configs, result.failures, includeEngines, includeDisabled, category);
}

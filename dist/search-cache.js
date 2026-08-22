import { createHash } from "crypto";
import { parsePositiveInteger, normalizePositiveInteger } from "./env-int.js";
const DEFAULT_SEARCH_CACHE_TTL_MS = 86400000;
const DEFAULT_SEARCH_CACHE_MAX_ENTRIES = 200;
function stableCanonicalize(value) {
    if (Array.isArray(value)) {
        return value.map(stableCanonicalize);
    }
    if (value !== null && typeof value === "object") {
        const canonical = {};
        for (const key of Object.keys(value).sort()) {
            canonical[key] = stableCanonicalize(value[key]);
        }
        return canonical;
    }
    return value;
}
export class SearchCache {
    cache = new Map();
    ttlMs;
    maxEntries;
    constructor(ttlMs = parsePositiveInteger(process.env.SEARCH_CACHE_TTL_MS, DEFAULT_SEARCH_CACHE_TTL_MS), maxEntries = parsePositiveInteger(process.env.SEARCH_CACHE_MAX_ENTRIES, DEFAULT_SEARCH_CACHE_MAX_ENTRIES)) {
        this.ttlMs = normalizePositiveInteger(ttlMs, DEFAULT_SEARCH_CACHE_TTL_MS);
        this.maxEntries = normalizePositiveInteger(maxEntries, DEFAULT_SEARCH_CACHE_MAX_ENTRIES);
    }
    key(toolName, args) {
        const canonical = JSON.stringify([toolName, stableCanonicalize(args)]);
        return createHash("sha256").update(canonical).digest("hex");
    }
    get(toolName, args) {
        const key = this.key(toolName, args);
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        entry.hitCount++;
        return entry.result;
    }
    set(toolName, args, result) {
        this.cache.set(this.key(toolName, args), {
            result,
            timestamp: Date.now(),
            hitCount: 0,
        });
        this.evictIfNeeded();
    }
    cleanupExpired() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttlMs) {
                this.cache.delete(key);
            }
        }
    }
    evictIfNeeded() {
        this.cleanupExpired();
        while (this.cache.size > this.maxEntries) {
            let evictionKey = null;
            let evictionEntry = null;
            for (const [key, entry] of this.cache.entries()) {
                if (evictionEntry === null ||
                    entry.hitCount < evictionEntry.hitCount ||
                    (entry.hitCount === evictionEntry.hitCount && entry.timestamp < evictionEntry.timestamp)) {
                    evictionKey = key;
                    evictionEntry = entry;
                }
            }
            if (evictionKey === null) {
                return;
            }
            this.cache.delete(evictionKey);
        }
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - entry.timestamp,
            hitCount: entry.hitCount,
        }));
        return {
            size: this.cache.size,
            entries,
        };
    }
}
export const searchCache = new SearchCache();

import { parsePositiveInteger, normalizePositiveInteger } from "./env-int.js";
const DEFAULT_CACHE_TTL_MS = 86400000;
const DEFAULT_CACHE_MAX_ENTRIES = 500;
const DEFAULT_CLEANUP_INTERVAL_MS = 60000;
class SimpleCache {
    cache = new Map();
    ttlMs;
    maxEntries;
    cleanupInterval = null;
    constructor(ttlMs = parsePositiveInteger(process.env.CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS), maxEntries = parsePositiveInteger(process.env.CACHE_MAX_ENTRIES, DEFAULT_CACHE_MAX_ENTRIES), cleanupIntervalMs = DEFAULT_CLEANUP_INTERVAL_MS) {
        this.ttlMs = normalizePositiveInteger(ttlMs, DEFAULT_CACHE_TTL_MS);
        this.maxEntries = normalizePositiveInteger(maxEntries, DEFAULT_CACHE_MAX_ENTRIES);
        this.startCleanup(normalizePositiveInteger(cleanupIntervalMs, DEFAULT_CLEANUP_INTERVAL_MS));
    }
    startCleanup(cleanupIntervalMs) {
        // Clean up expired entries every cleanupIntervalMs milliseconds (default 60s)
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, cleanupIntervalMs);
        this.cleanupInterval.unref();
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
    get(url) {
        const entry = this.cache.get(url);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(url);
            return null;
        }
        entry.hitCount++;
        return entry;
    }
    set(url, markdownContent) {
        this.cache.set(url, {
            markdownContent,
            timestamp: Date.now(),
            hitCount: 0
        });
        this.evictIfNeeded();
    }
    clear() {
        this.cache.clear();
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }
    // Get cache statistics for debugging
    getStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([url, entry]) => ({
            url,
            age: now - entry.timestamp,
            hitCount: entry.hitCount
        }));
        return {
            size: this.cache.size,
            entries
        };
    }
}
// Global cache instance
export const urlCache = new SimpleCache();
// Export for testing and cleanup
export { SimpleCache };

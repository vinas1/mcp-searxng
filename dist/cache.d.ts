interface CacheEntry {
    markdownContent: string;
    timestamp: number;
    hitCount: number;
}
declare class SimpleCache {
    private cache;
    private readonly ttlMs;
    private readonly maxEntries;
    private cleanupInterval;
    constructor(ttlMs?: number, maxEntries?: number, cleanupIntervalMs?: number);
    private startCleanup;
    private cleanupExpired;
    private evictIfNeeded;
    get(url: string): CacheEntry | null;
    set(url: string, markdownContent: string): void;
    clear(): void;
    destroy(): void;
    getStats(): {
        size: number;
        entries: Array<{
            url: string;
            age: number;
            hitCount: number;
        }>;
    };
}
export declare const urlCache: SimpleCache;
export { SimpleCache };

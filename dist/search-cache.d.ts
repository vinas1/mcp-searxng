export declare class SearchCache {
    private cache;
    private readonly ttlMs;
    private readonly maxEntries;
    constructor(ttlMs?: number, maxEntries?: number);
    private key;
    get(toolName: string, args: Record<string, unknown>): string | null;
    set(toolName: string, args: Record<string, unknown>, result: string): void;
    private cleanupExpired;
    private evictIfNeeded;
    clear(): void;
    getStats(): {
        size: number;
        entries: Array<{
            key: string;
            age: number;
            hitCount: number;
        }>;
    };
}
export declare const searchCache: SearchCache;

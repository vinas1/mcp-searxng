/**
 * Shared strict-integer parsing and positive-integer normalization for
 * environment-configured numeric settings.
 */
export declare function parseStrictInteger(value: string): number | undefined;
export declare function parsePositiveInteger(value: string | undefined, fallback: number): number;
export declare function normalizePositiveInteger(value: number, fallback: number): number;

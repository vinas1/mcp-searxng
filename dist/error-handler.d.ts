/**
 * Concise error handling for MCP SearXNG server
 * Provides clear, focused error messages that identify the root cause
 */
export interface ErrorContext {
    url?: string;
    searxngUrl?: string;
    proxyAgent?: boolean;
    timeout?: number;
    query?: string;
}
export declare class MCPSearXNGError extends Error {
    constructor(message: string);
}
export declare function createConfigurationError(message: string): MCPSearXNGError;
export declare function createNetworkError(error: any, context: ErrorContext): MCPSearXNGError;
export declare function createServerError(status: number, statusText: string, responseBody: string, context: ErrorContext): MCPSearXNGError;
export declare function createJSONError(responseText: string): MCPSearXNGError;
export declare function createDataError(): MCPSearXNGError;
export declare function createNoResultsMessage(query: string): string;
export declare function createURLFormatError(url: string): MCPSearXNGError;
export declare function createURLSecurityPolicyError(url: string): MCPSearXNGError;
export declare function createContentError(message: string, url: string): MCPSearXNGError;
export declare function createConversionError(url: string): MCPSearXNGError;
export declare function createTimeoutError(timeout: number, url: string): MCPSearXNGError;
export declare function createEmptyContentWarning(url: string): string;
export declare function createUnexpectedError(error: any, context: ErrorContext): MCPSearXNGError;
/**
 * Process-level crash handlers, registered by the CLI entrypoint (cli.ts).
 *
 * Extracted here so the logic is unit-testable: cli.ts calls main() at import
 * time (it must always start the server — see issue #91), so it cannot be
 * imported to test these in place.
 */
export declare function handleUncaughtException(error: unknown): void;
export declare function handleUnhandledRejection(reason: unknown, promise: Promise<unknown>): void;
export declare function validateEnvironment(): string | null;

export declare const BROWSER_SOLVER_DUPLICATE_ENDPOINT_ERROR = "FLARESOLVERR_URL and BYPARR_URL must identify different services.";
export declare class BrowserSolverConfigurationIssue extends Error {
    constructor(message: string);
}
export type BrowserSolverProvider = "flaresolverr" | "byparr";
export interface BrowserSolverEndpointSelection {
    provider: BrowserSolverProvider;
    endpoint: URL;
}
export declare function resolveBrowserSolverEndpoints(): BrowserSolverEndpointSelection[];
export declare function validateBrowserSolverEnvironment(): string | null;

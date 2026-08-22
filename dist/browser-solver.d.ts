import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type BrowserSolverProvider } from "./browser-solver-config.js";
export declare const DEFAULT_FLARESOLVERR_TIMEOUT_MS = 60000;
export declare const MAX_FLARESOLVERR_TIMEOUT_MS = 300000;
export declare const DEFAULT_FLARESOLVERR_CONCURRENCY = 2;
export declare const MAX_FLARESOLVERR_CONCURRENCY = 16;
export declare const DEFAULT_BYPARR_TIMEOUT_SECONDS = 60;
export declare const MAX_BYPARR_TIMEOUT_SECONDS = 300;
export declare const DEFAULT_BYPARR_CONCURRENCY = 2;
export declare const MAX_BYPARR_CONCURRENCY = 16;
export declare const MAX_FLARESOLVERR_RESPONSE_BYTES: number;
export declare const MAX_BYPARR_RESPONSE_BYTES: number;
export interface BrowserSolverConfig {
    provider: BrowserSolverProvider;
    endpoint: URL;
    timeoutMs: number;
    wireTimeout: number;
    maxConcurrentRequests: number;
    maxResponseBytes: number;
}
export interface BrowserSolverCookie {
    name?: unknown;
    value?: unknown;
    domain?: unknown;
    path?: unknown;
    secure?: unknown;
    expires?: unknown;
}
export interface BrowserSolverSolution {
    url: string;
    status: number;
    cookies: BrowserSolverCookie[];
    userAgent: string;
}
export type BrowserSolverAcquisition = {
    kind: "solved";
    solution: BrowserSolverSolution;
} | {
    kind: "fallback";
    reason: "busy" | "unavailable";
};
export type BrowserSolverChainAcquisition = {
    kind: "solved";
    provider: BrowserSolverProvider;
    solution: BrowserSolverSolution;
} | {
    kind: "fallback";
    reason: "busy" | "unavailable";
};
export declare function resolveBrowserSolverConfigs(mcpServer: McpServer): BrowserSolverConfig[];
export declare function acquireBrowserSolverSolution(mcpServer: McpServer, config: BrowserSolverConfig, requestedUrl: URL, signal?: AbortSignal, logFallback?: boolean): Promise<BrowserSolverAcquisition>;
export declare function acquireBrowserSolverSolutionChain(mcpServer: McpServer, configs: readonly BrowserSolverConfig[], requestedUrl: URL, signal?: AbortSignal): Promise<BrowserSolverChainAcquisition>;
export declare function buildBrowserSolverHeaders(solution: BrowserSolverSolution, targetUrl: URL, nowSeconds?: number): Record<string, string>;
export declare function createBrowserSolverCacheKey(provider: BrowserSolverProvider, requestedUrl: string): string;

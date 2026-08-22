import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare const DEFAULT_STATELESS_MAX_IN_FLIGHT = 16;
export declare const DEFAULT_STATELESS_MAX_IN_FLIGHT_PER_IP = 8;
export declare const DEFAULT_STATELESS_REQUEST_TIMEOUT_MS = 900000;
export declare const MAX_STATELESS_MAX_IN_FLIGHT = 256;
export interface StatelessHttpConfig {
    enabled: boolean;
    maxInFlight: number;
    maxInFlightPerIp: number;
    requestTimeoutMs: number;
}
/**
 * Resolves the bind host from the MCP_HTTP_HOST environment variable.
 * Falls back to "127.0.0.1" (localhost only) when the variable is absent or whitespace-only.
 * Set MCP_HTTP_HOST=0.0.0.0 to expose on all interfaces (e.g. Docker, remote access).
 */
export declare function resolveBindHost(envValue: string | undefined): string;
/**
 * Parses a positive-integer rate-limit setting from the environment.
 * Absent/blank → fallback silently. Present-but-invalid or non-positive →
 * fallback plus a one-line console.warn so an operator typo cannot silently
 * disable rate limiting (a fail-open control). Uses console.warn, not the MCP
 * logMessage path, because makeRateLimiters runs without an McpServer in scope.
 */
export declare function parseRateLimitEnv(name: string, fallback: number): number;
export declare function resolveStatelessHttpConfig(): StatelessHttpConfig;
export declare function createHttpServer(createMcpServer: () => McpServer, port?: number): Promise<express.Application>;

#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function isWebUrlReadArgs(args: unknown): args is {
    url: string;
    startChar?: number;
    maxLength?: number;
    section?: string;
    paragraphRange?: string;
    readHeadings?: boolean;
};
/**
 * Creates and configures a new McpServer with all handlers registered.
 * Called once per HTTP session, or once for STDIO mode.
 */
export declare function createMcpServer(): McpServer;
export declare function main(): Promise<void>;

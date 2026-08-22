import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare const REQUIRED_CONFIGURATION_GUIDANCE = "SEARXNG_URL is the only required environment variable.";
export declare const OPTIONAL_CONFIGURATION_GUIDANCE = "All other environment variables are optional; see CONFIGURATION.md for the complete reference.";
export declare function createCliHelpText(): string;
export declare function createConfigResource(mcpServer?: McpServer): string;
export declare function createHelpResource(): string;

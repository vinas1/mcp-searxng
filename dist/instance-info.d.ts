import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function clearInstanceInfoCacheForTests(): void;
export declare function getKnownEngines(mcpServer: McpServer, refresh?: boolean): Promise<Set<string> | null>;
export declare function getKnownCategories(mcpServer: McpServer, refresh?: boolean): Promise<Set<string> | null>;
export declare function fetchInstanceInfo(mcpServer: McpServer, includeEngines?: boolean, includeDisabled?: boolean, category?: string, refresh?: boolean): Promise<string>;

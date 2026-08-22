import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function performSearchSuggestions(mcpServer: McpServer, query: string, language?: string): Promise<string[]>;

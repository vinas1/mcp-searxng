import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ResultDetail } from "./types.js";
export declare function getSearchTimeoutMs(mcpServer: McpServer): number;
type ResponseFormat = "text" | "json";
export declare function formatCachedSearchResult(result: string, responseFormat: "text" | "json", resultDetail?: ResultDetail): string;
export declare function performWebSearch(mcpServer: McpServer, query: string, pageno?: number, time_range?: string, language?: string, safesearch?: number, min_score?: number, num_results?: number, categories?: string, engines?: string, response_format?: ResponseFormat, result_detail?: ResultDetail): Promise<string>;
export {};

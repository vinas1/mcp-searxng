import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Dispatcher } from "undici";
interface PaginationOptions {
    startChar?: number;
    maxLength?: number;
    section?: string;
    paragraphRange?: string;
    readHeadings?: boolean;
}
export declare const DEFAULT_MAX_CONTENT_LENGTH_BYTES: number;
export declare function checkContentLength(mcpServer: McpServer, url: string, timeoutMs: number, dispatcher?: Dispatcher, baseRequestOptions?: RequestInit): Promise<number | null>;
export declare function fetchAndConvertToMarkdown(mcpServer: McpServer, url: string, timeoutMs?: number, paginationOptions?: PaginationOptions, signal?: AbortSignal): Promise<string>;
export {};

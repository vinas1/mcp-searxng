import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LoggingLevel } from "@modelcontextprotocol/sdk/types.js";
export declare const DEFAULT_LOG_LEVEL: LoggingLevel;
export declare function logMessage(mcpServer: McpServer, level: LoggingLevel, message: string, data?: unknown): void;
export declare function shouldLog(mcpServer: McpServer, level: LoggingLevel): boolean;
export declare function setLogLevel(mcpServer: McpServer, level: LoggingLevel): void;
export declare function getCurrentLogLevel(mcpServer?: McpServer): LoggingLevel;

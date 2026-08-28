import { sanitizeDiagnosticText, sanitizeDiagnosticValue, sanitizeErrorForTransport, } from "./diagnostic-sanitizer.js";
import { writeDiagnostic } from "./diagnostic-output.js";
export const DEFAULT_LOG_LEVEL = "error";
const logLevelsByServer = new WeakMap();
const LOG_LEVELS = [
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency",
];
// Shared handler for sendLoggingMessage errors
function handleSendError(error) {
    if (error instanceof Error && error.message !== "Not connected") {
        writeDiagnostic("error", "Logging error:", sanitizeErrorForTransport(error));
    }
}
// Logging helper function
export function logMessage(mcpServer, level, message, data) {
    if (shouldLog(mcpServer, level)) {
        try {
            const notificationData = data !== undefined
                ? (typeof data === 'object' && data !== null ? { message, ...data } : { message, data })
                : { message };
            mcpServer.sendLoggingMessage({
                level,
                data: sanitizeDiagnosticValue({
                    ...notificationData,
                    message: sanitizeDiagnosticText(message),
                }),
            }).catch(handleSendError);
        }
        catch (error) {
            handleSendError(error);
        }
    }
}
export function shouldLog(mcpServer, level) {
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(getCurrentLogLevel(mcpServer));
}
export function setLogLevel(mcpServer, level) {
    logLevelsByServer.set(mcpServer, level);
}
export function getCurrentLogLevel(mcpServer) {
    return mcpServer === undefined
        ? DEFAULT_LOG_LEVEL
        : (logLevelsByServer.get(mcpServer) ?? DEFAULT_LOG_LEVEL);
}

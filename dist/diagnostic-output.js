import { sanitizeDiagnosticValue, sanitizeErrorForTransport, } from "./diagnostic-sanitizer.js";
export function writeDiagnostic(level, ...values) {
    const sanitized = values.map((value) => (value instanceof Error
        ? sanitizeErrorForTransport(value)
        : sanitizeDiagnosticValue(value)));
    console[level](...sanitized);
}

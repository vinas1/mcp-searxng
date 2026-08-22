export declare function initializeDiagnosticSanitizer(env?: NodeJS.ProcessEnv): void;
export declare function resetDiagnosticSanitizerForTests(): void;
export declare function sanitizeDiagnosticText(value: string): string;
export declare function sanitizeDiagnosticValue(value: unknown): unknown;
export declare function sanitizeErrorForTransport(value: unknown): Error;

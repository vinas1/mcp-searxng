export type DiagnosticLevel = "log" | "warn" | "error";
export declare function writeDiagnostic(level: DiagnosticLevel, ...values: unknown[]): void;

export declare const MAX_PDF_BYTES: number;
export declare const MAX_PDF_PAGES = 500;
export declare const PDF_PARSE_TIMEOUT_MS = 30000;
export declare const PDF_WORKER_RESOURCE_LIMITS: Readonly<{
    maxOldGenerationSizeMb: 192;
    stackSizeMb: 4;
}>;
export declare const MAX_CONCURRENT_PDF_WORKERS = 2;
export type PdfWorkerResult = {
    version: 1;
    kind: "text";
    text: string;
    totalPages: number;
    textBytes: number;
} | {
    version: 1;
    kind: "no_text";
    totalPages: number;
} | {
    version: 1;
    kind: "text_too_large";
    bytes: number;
} | {
    version: 1;
    kind: "too_many_pages";
    totalPages: number;
} | {
    version: 1;
    kind: "password_protected";
} | {
    version: 1;
    kind: "parse_error";
} | {
    version: 1;
    kind: "external_fetch_attempt";
};
export type PdfExtractionResult = PdfWorkerResult | {
    version: 1;
    kind: "timeout";
} | {
    version: 1;
    kind: "worker_failure";
} | {
    version: 1;
    kind: "busy";
};
interface PdfExtractionOptions {
    timeoutMs?: number;
    workerUrl?: URL;
    signal?: AbortSignal;
}
export declare function extractPdfText(bytes: Uint8Array, maxTextBytes: number, options?: PdfExtractionOptions): Promise<PdfExtractionResult>;
export {};

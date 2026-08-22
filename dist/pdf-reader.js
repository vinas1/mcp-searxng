import { Worker } from "node:worker_threads";
export const MAX_PDF_BYTES = 16 * 1024 * 1024;
export const MAX_PDF_PAGES = 500;
export const PDF_PARSE_TIMEOUT_MS = 30_000;
export const PDF_WORKER_RESOURCE_LIMITS = Object.freeze({
    maxOldGenerationSizeMb: 192,
    stackSizeMb: 4,
});
export const MAX_CONCURRENT_PDF_WORKERS = 2;
let activePdfWorkers = 0;
function isNonNegativeInteger(value) {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
const PDF_WORKER_RESULT_VALIDATORS = new Map([
    ["text", (result) => (typeof result.text === "string"
            && isNonNegativeInteger(result.totalPages)
            && isNonNegativeInteger(result.textBytes))],
    ["no_text", (result) => isNonNegativeInteger(result.totalPages)],
    ["too_many_pages", (result) => isNonNegativeInteger(result.totalPages)],
    ["text_too_large", (result) => isNonNegativeInteger(result.bytes)],
    ["password_protected", () => true],
    ["parse_error", () => true],
    ["external_fetch_attempt", () => true],
]);
function isPdfWorkerResult(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const result = value;
    if (result.version !== 1 || typeof result.kind !== "string") {
        return false;
    }
    const validator = PDF_WORKER_RESULT_VALIDATORS.get(result.kind);
    return validator?.(result) ?? false;
}
function defaultPdfWorkerUrl() {
    if (import.meta.url.endsWith(".ts")) {
        return new URL("./pdf-worker-bootstrap.mjs", import.meta.url);
    }
    return new URL("./pdf-worker.js", import.meta.url);
}
export async function extractPdfText(bytes, maxTextBytes, options = {}) {
    if (options.signal?.aborted) {
        throw options.signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
    }
    if (activePdfWorkers >= MAX_CONCURRENT_PDF_WORKERS) {
        return { version: 1, kind: "busy" };
    }
    const transferableBytes = bytes.slice();
    activePdfWorkers++;
    return await new Promise((resolve, reject) => {
        let worker;
        try {
            worker = new Worker(options.workerUrl ?? defaultPdfWorkerUrl(), {
                // `--input-type` is valid only for eval/stdin entrypoints and makes a
                // file-backed Worker fail during startup when inherited from a caller.
                execArgv: process.execArgv.filter((argument) => argument !== "--input-type=module"),
                workerData: {
                    version: 1,
                    pdfBytes: transferableBytes.buffer,
                    maxTextBytes,
                },
                transferList: [transferableBytes.buffer],
                resourceLimits: PDF_WORKER_RESOURCE_LIMITS,
            });
        }
        catch {
            activePdfWorkers--;
            resolve({ version: 1, kind: "worker_failure" });
            return;
        }
        let settled = false;
        const timeoutId = setTimeout(() => {
            finish({ version: 1, kind: "timeout" });
        }, options.timeoutMs ?? PDF_PARSE_TIMEOUT_MS);
        const abortListener = () => {
            finishWithError(options.signal?.reason ?? new DOMException("The operation was aborted.", "AbortError"));
        };
        options.signal?.addEventListener("abort", abortListener, { once: true });
        function finish(result) {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutId);
            options.signal?.removeEventListener("abort", abortListener);
            worker.removeAllListeners();
            const releaseSlot = () => {
                activePdfWorkers--;
                resolve(result);
            };
            try {
                void worker.terminate().then(releaseSlot, releaseSlot);
            }
            catch {
                // `terminate()` normally returns a promise, but a synchronous failure
                // must not retain the process-wide concurrency slot.
                releaseSlot();
            }
        }
        function finishWithError(error) {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutId);
            options.signal?.removeEventListener("abort", abortListener);
            worker.removeAllListeners();
            const rejectAfterTerminate = () => {
                activePdfWorkers--;
                reject(error);
            };
            try {
                void worker.terminate().then(rejectAfterTerminate, rejectAfterTerminate);
            }
            catch {
                rejectAfterTerminate();
            }
        }
        worker.once("message", (message) => {
            finish(isPdfWorkerResult(message)
                ? message
                : { version: 1, kind: "worker_failure" });
        });
        worker.once("error", () => {
            finish({ version: 1, kind: "worker_failure" });
        });
        worker.once("exit", () => {
            finish({ version: 1, kind: "worker_failure" });
        });
    });
}

import { fetch as undiciFetch } from "undici";
import { createConfigurationError, createContentError } from "./error-handler.js";
import { BrowserSolverConfigurationIssue, resolveBrowserSolverEndpoints, } from "./browser-solver-config.js";
import { parseStrictInteger } from "./env-int.js";
import { logMessage } from "./logging.js";
import { applyTrustedServiceRequestConfig } from "./proxy.js";
export const DEFAULT_FLARESOLVERR_TIMEOUT_MS = 60_000;
export const MAX_FLARESOLVERR_TIMEOUT_MS = 300_000;
export const DEFAULT_FLARESOLVERR_CONCURRENCY = 2;
export const MAX_FLARESOLVERR_CONCURRENCY = 16;
export const DEFAULT_BYPARR_TIMEOUT_SECONDS = 60;
export const MAX_BYPARR_TIMEOUT_SECONDS = 300;
export const DEFAULT_BYPARR_CONCURRENCY = 2;
export const MAX_BYPARR_CONCURRENCY = 16;
export const MAX_FLARESOLVERR_RESPONSE_BYTES = 256 * 1024;
export const MAX_BYPARR_RESPONSE_BYTES = 5 * 1024 * 1024;
const BROWSER_SOLVER_RESPONSE_GRACE_MS = 5_000;
const MAX_COOKIE_PAIR_BYTES = 4_096;
const activeSolverRequests = {
    flaresolverr: 0,
    byparr: 0,
};
function resolveBoundedInteger(mcpServer, name, fallback, maximum) {
    const rawValue = process.env[name];
    if (rawValue === undefined || rawValue.trim() === "") {
        return fallback;
    }
    const parsed = parseStrictInteger(rawValue);
    if (parsed === undefined || parsed <= 0 || parsed > maximum) {
        logMessage(mcpServer, "warning", `Ignoring invalid ${name}. Expected an integer from 1 through ${maximum}; using default ${fallback}.`);
        return fallback;
    }
    return parsed;
}
function readEndpointSelections() {
    try {
        return resolveBrowserSolverEndpoints();
    }
    catch (error) {
        if (error instanceof BrowserSolverConfigurationIssue) {
            throw createConfigurationError(error.message);
        }
        throw error;
    }
}
function resolveByparrConfig(mcpServer, endpoint) {
    const timeoutSeconds = resolveBoundedInteger(mcpServer, "BYPARR_TIMEOUT_SECONDS", DEFAULT_BYPARR_TIMEOUT_SECONDS, MAX_BYPARR_TIMEOUT_SECONDS);
    return {
        provider: "byparr",
        endpoint,
        timeoutMs: timeoutSeconds * 1000,
        wireTimeout: timeoutSeconds,
        maxConcurrentRequests: resolveBoundedInteger(mcpServer, "BYPARR_MAX_CONCURRENT_REQUESTS", DEFAULT_BYPARR_CONCURRENCY, MAX_BYPARR_CONCURRENCY),
        maxResponseBytes: MAX_BYPARR_RESPONSE_BYTES,
    };
}
function resolveFlareSolverrConfig(mcpServer, endpoint) {
    const timeoutMs = resolveBoundedInteger(mcpServer, "FLARESOLVERR_TIMEOUT_MS", DEFAULT_FLARESOLVERR_TIMEOUT_MS, MAX_FLARESOLVERR_TIMEOUT_MS);
    return {
        provider: "flaresolverr",
        endpoint,
        timeoutMs,
        wireTimeout: timeoutMs,
        maxConcurrentRequests: resolveBoundedInteger(mcpServer, "FLARESOLVERR_MAX_CONCURRENT_REQUESTS", DEFAULT_FLARESOLVERR_CONCURRENCY, MAX_FLARESOLVERR_CONCURRENCY),
        maxResponseBytes: MAX_FLARESOLVERR_RESPONSE_BYTES,
    };
}
export function resolveBrowserSolverConfigs(mcpServer) {
    return readEndpointSelections().map((selection) => (selection.provider === "byparr"
        ? resolveByparrConfig(mcpServer, selection.endpoint)
        : resolveFlareSolverrConfig(mcpServer, selection.endpoint)));
}
async function readBoundedResponse(response, maximumBytes) {
    if (response.body === null) {
        return "";
    }
    const reader = response.body.getReader();
    const chunks = [];
    let bytesRead = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            if (!value) {
                continue;
            }
            bytesRead += value.byteLength;
            if (bytesRead > maximumBytes) {
                await reader.cancel();
                return null;
            }
            chunks.push(value);
        }
    }
    finally {
        reader.releaseLock();
    }
    const bytes = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8").decode(bytes);
}
function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value;
}
function isInteger(value) {
    return typeof value === "number" && Number.isInteger(value);
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
}
function parseSolution(value) {
    const envelope = asRecord(value);
    if (!envelope) {
        return null;
    }
    if (envelope.status !== "ok") {
        return null;
    }
    const solution = asRecord(envelope.solution);
    if (!solution) {
        return null;
    }
    if (typeof solution.url !== "string") {
        return null;
    }
    if (!isInteger(solution.status)) {
        return null;
    }
    if (!Array.isArray(solution.cookies)) {
        return null;
    }
    if (!isNonEmptyString(solution.userAgent)) {
        return null;
    }
    return {
        url: solution.url,
        status: solution.status,
        cookies: solution.cookies,
        userAgent: solution.userAgent,
    };
}
function validateSolutionUrl(solution, requestedUrl) {
    let solvedUrl;
    try {
        solvedUrl = new URL(solution.url);
    }
    catch {
        throw createContentError("Browser solver returned an invalid solution URL.", requestedUrl.href);
    }
    if (!["http:", "https:"].includes(solvedUrl.protocol)
        || solvedUrl.hostname.toLowerCase() !== requestedUrl.hostname.toLowerCase()) {
        throw createContentError("Browser solver returned a solution URL on a different or unsupported hostname.", requestedUrl.href);
    }
}
function logDirectFallback(mcpServer) {
    logMessage(mcpServer, "warning", "Browser solver session acquisition failed; using the direct URL fetch path.");
}
function createSolverRequestOptions(config, requestedUrl, signal) {
    const requestOptions = {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cmd: "request.get",
            url: requestedUrl.href,
            maxTimeout: config.wireTimeout,
            returnOnlyCookies: true,
        }),
    };
    applyTrustedServiceRequestConfig(requestOptions, config.endpoint.href);
    return requestOptions;
}
function isPersistentClientError(status) {
    return status >= 400
        && status < 500
        && status !== 408
        && status !== 429;
}
async function readSolverResponse(response, maximumBytes) {
    if (isPersistentClientError(response.status)) {
        await response.body?.cancel();
        throw createConfigurationError("Browser solver endpoint rejected the request. Check the configured endpoint and service API compatibility.");
    }
    if (!response.ok) {
        await response.body?.cancel();
        return null;
    }
    return await readBoundedResponse(response, maximumBytes);
}
async function requestBrowserSolverSession(config, requestedUrl, signal) {
    const timeoutSignal = AbortSignal.timeout(config.timeoutMs + BROWSER_SOLVER_RESPONSE_GRACE_MS);
    const requestSignal = signal
        ? AbortSignal.any([signal, timeoutSignal])
        : timeoutSignal;
    try {
        const response = await undiciFetch(config.endpoint, createSolverRequestOptions(config, requestedUrl, requestSignal));
        return await readSolverResponse(response, config.maxResponseBytes);
    }
    catch (error) {
        if (signal?.aborted) {
            throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
        }
        if (error?.name === "MCPSearXNGError") {
            throw error;
        }
        return null;
    }
}
function decodeSolution(responseText) {
    if (responseText === null) {
        return null;
    }
    try {
        return parseSolution(JSON.parse(responseText));
    }
    catch {
        return null;
    }
}
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
    }
}
function tryReserveProviderSlot(config) {
    if (activeSolverRequests[config.provider] < config.maxConcurrentRequests) {
        activeSolverRequests[config.provider]++;
        return true;
    }
    return false;
}
function classifyAcquisition(responseText, requestedUrl) {
    const solution = decodeSolution(responseText);
    if (!solution) {
        return { kind: "fallback", reason: "unavailable" };
    }
    validateSolutionUrl(solution, requestedUrl);
    return { kind: "solved", solution };
}
export async function acquireBrowserSolverSolution(mcpServer, config, requestedUrl, signal, logFallback = true) {
    throwIfAborted(signal);
    if (!tryReserveProviderSlot(config)) {
        if (logFallback) {
            logDirectFallback(mcpServer);
        }
        return { kind: "fallback", reason: "busy" };
    }
    try {
        const responseText = await requestBrowserSolverSession(config, requestedUrl, signal);
        throwIfAborted(signal);
        const acquisition = classifyAcquisition(responseText, requestedUrl);
        if (logFallback && acquisition.kind === "fallback") {
            logDirectFallback(mcpServer);
        }
        return acquisition;
    }
    finally {
        activeSolverRequests[config.provider]--;
    }
}
function logProviderOutcome(mcpServer, provider, reason) {
    logMessage(mcpServer, "warning", "Browser solver provider did not produce a session.", { provider, classification: reason });
}
export async function acquireBrowserSolverSolutionChain(mcpServer, configs, requestedUrl, signal) {
    let finalReason = "unavailable";
    for (const config of configs) {
        throwIfAborted(signal);
        const acquisition = await acquireBrowserSolverSolution(mcpServer, config, requestedUrl, signal, false);
        if (acquisition.kind === "solved") {
            return {
                kind: "solved",
                provider: config.provider,
                solution: acquisition.solution,
            };
        }
        finalReason = acquisition.reason;
        logProviderOutcome(mcpServer, config.provider, acquisition.reason);
    }
    logDirectFallback(mcpServer);
    return { kind: "fallback", reason: finalReason };
}
function cookiePath(cookie) {
    return typeof cookie.path === "string" && cookie.path.startsWith("/")
        ? cookie.path
        : "/";
}
function pathMatches(requestPath, candidate) {
    if (requestPath === candidate) {
        return true;
    }
    if (!requestPath.startsWith(candidate)) {
        return false;
    }
    return candidate.endsWith("/") || requestPath[candidate.length] === "/";
}
function domainMatches(cookie, requestHostname, solutionHostname) {
    if (typeof cookie.domain !== "string" || cookie.domain.trim() === "") {
        return requestHostname === solutionHostname;
    }
    const domain = cookie.domain.trim().toLowerCase().replace(/^\./u, "");
    return requestHostname === domain || requestHostname.endsWith(`.${domain}`);
}
function isValidCookieName(name) {
    if (name === "") {
        return false;
    }
    const punctuation = "!#$%&'*+-.^_`|~";
    for (const character of name) {
        const code = character.charCodeAt(0);
        const isAlphaNumeric = ((code >= 0x30 && code <= 0x39)
            || (code >= 0x41 && code <= 0x5a)
            || (code >= 0x61 && code <= 0x7a));
        if (!isAlphaNumeric && !punctuation.includes(character)) {
            return false;
        }
    }
    return true;
}
function isValidCookieValue(value) {
    return /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/u.test(value);
}
function isValidCookiePair(name, value) {
    return isValidCookieName(name)
        && isValidCookieValue(value)
        && new TextEncoder().encode(`${name}=${value}`).byteLength <= MAX_COOKIE_PAIR_BYTES;
}
function isUnexpired(cookie, nowSeconds) {
    return typeof cookie.expires !== "number"
        || !Number.isFinite(cookie.expires)
        || cookie.expires <= 0
        || cookie.expires > nowSeconds;
}
function hasCookieIdentity(cookie) {
    return typeof cookie.name === "string" && typeof cookie.value === "string";
}
function cookieTransportMatches(cookie, path, targetUrl, requestHostname, solutionHostname, nowSeconds) {
    const secureTransportAllowed = cookie.secure !== true || targetUrl.protocol === "https:";
    return domainMatches(cookie, requestHostname, solutionHostname)
        && pathMatches(targetUrl.pathname, path)
        && secureTransportAllowed
        && isUnexpired(cookie, nowSeconds);
}
function cookieMatchesTarget(entry, targetUrl, requestHostname, solutionHostname, nowSeconds) {
    const { cookie, path } = entry;
    if (requestHostname !== solutionHostname) {
        return false;
    }
    if (!hasCookieIdentity(cookie)) {
        return false;
    }
    return isValidCookiePair(cookie.name, cookie.value)
        && cookieTransportMatches(cookie, path, targetUrl, requestHostname, solutionHostname, nowSeconds);
}
export function buildBrowserSolverHeaders(solution, targetUrl, nowSeconds = Date.now() / 1000) {
    const requestHostname = targetUrl.hostname.toLowerCase();
    const solutionHostname = new URL(solution.url).hostname.toLowerCase();
    const matches = solution.cookies
        .map((cookie, index) => ({ cookie, index, path: cookiePath(cookie) }))
        .filter((entry) => cookieMatchesTarget(entry, targetUrl, requestHostname, solutionHostname, nowSeconds))
        .sort((left, right) => right.path.length - left.path.length || left.index - right.index);
    const selected = new Set();
    const pairs = [];
    for (const { cookie } of matches) {
        const name = cookie.name;
        if (selected.has(name)) {
            continue;
        }
        selected.add(name);
        pairs.push(`${name}=${cookie.value}`);
    }
    const headers = { "User-Agent": solution.userAgent };
    if (pairs.length > 0) {
        headers.Cookie = pairs.join("; ");
    }
    return headers;
}
export function createBrowserSolverCacheKey(provider, requestedUrl) {
    return `solver:${provider}:${requestedUrl}`;
}

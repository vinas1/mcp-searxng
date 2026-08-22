import * as dns from "node:dns";
import { Agent, ProxyAgent } from "undici";
type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void;
type SearxngFetch = typeof globalThis.fetch;
export declare function fetchSearxng(input: string | URL | Request, options?: RequestInit): Promise<Response>;
export declare function setSearxngFetchForTesting(implementation?: SearxngFetch): void;
export declare function createUrlReaderLookup(): (hostname: string, options: dns.LookupOptions, callback: LookupCallback) => void;
/**
 * Proxy configuration type for separating search and URL reader proxies.
 */
export declare const ProxyType: {
    readonly SEARCH: "search";
    readonly URL_READER: "url_reader";
};
export type ProxyType = typeof ProxyType[keyof typeof ProxyType];
/**
 * Creates a proxy agent dispatcher for Node.js fetch API.
 *
 * Node.js fetch uses Undici under the hood, which requires a 'dispatcher' option
 * instead of 'agent'. This function creates a ProxyAgent compatible with fetch.
 *
 * Environment variables checked (in order, depending on URL protocol):
 * - For type 'search' and HTTPS URLs:
 *   SEARCH_HTTPS_PROXY, SEARCH_HTTP_PROXY, search_https_proxy, search_http_proxy,
 *   then HTTPS_PROXY, HTTP_PROXY, https_proxy, http_proxy
 * - For type 'search' and HTTP/unknown URLs:
 *   SEARCH_HTTP_PROXY, SEARCH_HTTPS_PROXY, search_http_proxy, search_https_proxy,
 *   then HTTP_PROXY, HTTPS_PROXY, http_proxy, https_proxy
 * - For type 'url_reader' and HTTPS URLs:
 *   URL_READER_HTTPS_PROXY, URL_READER_HTTP_PROXY, url_reader_https_proxy, url_reader_http_proxy,
 *   then HTTPS_PROXY, HTTP_PROXY, https_proxy, http_proxy
 * - For type 'url_reader' and HTTP/unknown URLs:
 *   URL_READER_HTTP_PROXY, URL_READER_HTTPS_PROXY, url_reader_http_proxy, url_reader_https_proxy,
 *   then HTTP_PROXY, HTTPS_PROXY, http_proxy, https_proxy
 * - For no specific type and HTTPS URLs:
 *   HTTPS_PROXY, HTTP_PROXY, https_proxy, http_proxy
 * - For no specific type and HTTP/unknown URLs:
 *   HTTP_PROXY, HTTPS_PROXY, http_proxy, https_proxy
 * - NO_PROXY / no_proxy: Comma-separated list of hosts to bypass proxy
 *
 * @param targetUrl - Optional target URL to check against NO_PROXY rules
 * @param type - Optional proxy type ('search' or 'url_reader') for separate proxy configs
 * @returns ProxyAgent dispatcher for fetch, or undefined if no proxy configured or bypassed
 */
export declare function createProxyAgent(targetUrl?: string, type?: ProxyType): ProxyAgent | undefined;
export declare function createDefaultAgent(): Agent | undefined;
/**
 * Resolve the User-Agent for SearXNG-instance requests.
 */
export declare function getSearchUserAgent(): string | undefined;
/**
 * Apply the shared SearXNG-instance request configuration — SEARCH-group
 * proxy dispatcher, Basic Auth credentials, and resolved SEARCH-group
 * User-Agent header — to an outgoing request.
 *
 * Used by every SearXNG-instance fetch: `/search` (`search.ts`), `/config`
 * (`instance-info.ts`), and `/autocompleter` (`suggestions.ts`). Auth-gated
 * SearXNG instances return 401 on `/config` and `/autocompleter` unless the
 * `Authorization` header is present, so the Basic Auth block must live here
 * alongside the proxy/User-Agent wiring rather than only in `search.ts`.
 * Credentials come from the instance URL userinfo first (per-instance), then
 * fall back to the global `AUTH_*` env vars — see `getSearxngBasicAuthHeader`.
 * `web_url_read` deliberately does NOT use this — it fetches arbitrary URLs.
 *
 * The User-Agent and Authorization are merged through a `Headers` instance,
 * so any already-set `headers` — whether a plain object, a `Headers` instance,
 * or a tuple array — is preserved; the result is written back as a plain
 * object.
 */
export declare function applySearchRequestConfig(requestOptions: RequestInit, targetUrl: string): void;
/**
 * Apply global proxy and trust-store configuration to an operator-trusted side
 * service. Type-specific search and URL-reader proxy variables deliberately do
 * not apply.
 */
export declare function applyTrustedServiceRequestConfig(requestOptions: RequestInit, targetUrl: string): void;
/**
 * Returns a singleton undici Agent for direct `web_url_read` requests.
 *
 * Unlike the shared default agent, this is always created so the URL reader's
 * DNS validation hook is present even when no system CA bundle is detected.
 */
export declare function createUrlReaderAgent(): Agent;
export {};

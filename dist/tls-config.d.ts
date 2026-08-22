/**
 * Injectable dependencies for {@link getSystemCACerts}.
 *
 * These exist purely as a test seam: production callers pass nothing and the
 * real platform / filesystem are used. Tests override them to exercise branches
 * (e.g. Windows, unreadable bundles) deterministically on any host.
 */
export interface CACertDeps {
    platformName?: NodeJS.Platform;
    fileExists?: (path: string) => boolean;
    readFile?: (path: string) => string;
    caPaths?: readonly string[];
    /**
     * Path to an extra PEM bundle to merge into the CA list. Defaults to
     * `process.env.NODE_EXTRA_CA_CERTS`. Pass `null` in tests to opt out.
     */
    extraCaPath?: string | null;
}
/**
 * Reads system CA certificates from well-known bundle paths, plus an optional
 * user-provided extra bundle pointed to by `NODE_EXTRA_CA_CERTS`.
 *
 * On Windows (and on any platform where no system bundle is found) this
 * returns `null`, so callers pass no explicit `ca` to undici and Node's
 * default trust store — Mozilla roots plus `NODE_EXTRA_CA_CERTS` — is used.
 * This is intentional: passing an explicit `connect.ca` *replaces* the
 * default trust store entirely, which would drop both the Mozilla roots and
 * the extra CA unless we re-merged them ourselves.
 *
 * On Linux/macOS when a system bundle *is* found, the system bundle is
 * returned with the extra bundle appended. Here an explicit `ca` is already
 * being set (overriding the default path), so folding in the extra bundle is
 * required to keep `NODE_EXTRA_CA_CERTS` honored in that case.
 */
export declare function getSystemCACerts(deps?: CACertDeps): string | null;
/**
 * Returns undici `connect` options with system CA certs, or an empty object
 * if no system CA bundle is found (undici uses Node's compiled-in Mozilla
 * bundle in that case).
 *
 * Usage:
 *   new Agent({ connect: getConnectOptions() })
 *   new ProxyAgent({ uri: proxyUrl, connect: getConnectOptions() })
 */
export declare function getConnectOptions(deps?: CACertDeps): {
    ca: string;
} | Record<string, never>;

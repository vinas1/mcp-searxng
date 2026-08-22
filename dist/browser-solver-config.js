export const BROWSER_SOLVER_DUPLICATE_ENDPOINT_ERROR = "FLARESOLVERR_URL and BYPARR_URL must identify different services.";
export class BrowserSolverConfigurationIssue extends Error {
    constructor(message) {
        super(message);
        this.name = "BrowserSolverConfigurationIssue";
    }
}
function configuredValue(name) {
    const value = process.env[name];
    return value === undefined || value.trim() === "" ? null : value.trim();
}
function hasForbiddenEndpointComponents(endpoint) {
    return [
        endpoint.username,
        endpoint.password,
        endpoint.search,
        endpoint.hash,
    ].some((component) => component !== "");
}
function normalizeEndpoint(name, value) {
    let endpoint;
    try {
        endpoint = new URL(value);
    }
    catch {
        throw new BrowserSolverConfigurationIssue(`${name} must be an absolute HTTP or HTTPS service base URL.`);
    }
    if (!["http:", "https:"].includes(endpoint.protocol)
        || endpoint.hostname === ""
        || hasForbiddenEndpointComponents(endpoint)) {
        throw new BrowserSolverConfigurationIssue(`${name} must be an absolute HTTP or HTTPS service base URL without userinfo, a query, or a fragment.`);
    }
    const pathWithoutTrailingSlash = endpoint.pathname.replace(/\/+$/u, "");
    endpoint.pathname = pathWithoutTrailingSlash.endsWith("/v1")
        ? pathWithoutTrailingSlash
        : `${pathWithoutTrailingSlash}/v1`;
    return endpoint;
}
export function resolveBrowserSolverEndpoints() {
    const flareSolverrUrl = configuredValue("FLARESOLVERR_URL");
    const byparrUrl = configuredValue("BYPARR_URL");
    const selections = [];
    if (flareSolverrUrl) {
        selections.push({
            provider: "flaresolverr",
            endpoint: normalizeEndpoint("FLARESOLVERR_URL", flareSolverrUrl),
        });
    }
    if (byparrUrl) {
        selections.push({
            provider: "byparr",
            endpoint: normalizeEndpoint("BYPARR_URL", byparrUrl),
        });
    }
    if (selections.length === 2
        && selections[0].endpoint.href === selections[1].endpoint.href) {
        throw new BrowserSolverConfigurationIssue(BROWSER_SOLVER_DUPLICATE_ENDPOINT_ERROR);
    }
    return selections;
}
export function validateBrowserSolverEnvironment() {
    try {
        resolveBrowserSolverEndpoints();
        return null;
    }
    catch (error) {
        return error instanceof Error ? error.message : "Invalid browser solver configuration.";
    }
}

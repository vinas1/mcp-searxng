export interface HttpSecurityConfig {
    harden: boolean;
    requireAuth: boolean;
    authToken?: string;
    restrictOrigins: boolean;
    allowedOrigins: string[];
    enableDnsRebindingProtection: boolean;
    allowedHosts: string[];
    trustProxy: boolean | number | string;
    exposeFullConfig: boolean;
    allowPrivateUrls: boolean;
}
export declare function getHttpSecurityConfig(port?: number): HttpSecurityConfig;
export declare function validateHttpSecurityConfig(config: HttpSecurityConfig): void;
export declare function isRequestAuthorized(headerValue: string | undefined, config: HttpSecurityConfig): boolean;
export declare function isOriginAllowed(origin: string | undefined, config: HttpSecurityConfig): boolean;

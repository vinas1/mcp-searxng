export declare const URL_SECURITY_POLICY_DNS_ERROR = "URLSecurityPolicyDnsError";
export declare function isPrivateHostname(hostname: string): boolean;
export declare function isPrivateIpv4(hostname: string): boolean;
export declare function isPrivateIPv6(hostname: string): boolean;
export declare function isPrivateAddress(address: string): boolean;
export declare function assertUrlAllowed(url: URL): void;
export declare function createUrlSecurityPolicyDnsError(hostname: string): NodeJS.ErrnoException;
export declare function isUrlSecurityPolicyDnsError(error: unknown): boolean;

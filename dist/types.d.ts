import { Tool } from "@modelcontextprotocol/sdk/types.js";
export interface SearXNGWebResult {
    title: string;
    content: string;
    url: string;
    score?: number;
    engine?: string;
    engines?: string[];
    category?: string;
    publishedDate?: string;
    thumbnail?: string;
    img_src?: string;
}
export interface SearXNGWebInfobox {
    infobox: string;
    content?: string;
    urls?: Array<{
        title: string;
        url: string;
    }>;
}
export interface SearXNGWeb {
    query: string;
    number_of_results: number;
    results: SearXNGWebResult[];
    sourceFormat?: "json" | "html";
    suggestions?: string[];
    corrections?: string[];
    answers?: string[];
    infoboxes?: SearXNGWebInfobox[];
    unresponsive_engines?: Array<[string, string]>;
}
export type ResultDetail = "compact" | "full";
export declare function isSearXNGWebSearchArgs(args: unknown): args is {
    query: string;
    pageno?: number;
    time_range?: string;
    language?: string;
    safesearch?: number | string;
    min_score?: number;
    num_results?: number;
    categories?: string;
    engines?: string;
    response_format?: "text" | "json";
    result_detail?: ResultDetail;
};
export declare function isSearXNGSearchSuggestionsArgs(args: unknown): args is {
    query: string;
    language?: string;
};
export declare function isSearXNGInstanceInfoArgs(args: unknown): args is {
    includeEngines?: boolean;
    includeDisabled?: boolean;
    category?: string;
    refresh?: boolean;
};
export declare const WEB_SEARCH_TOOL: Tool;
export declare const SUGGESTIONS_TOOL: Tool;
export declare const INSTANCE_INFO_TOOL: Tool;
export declare const LITE_WEB_SEARCH_TOOL: Tool;
export declare const LITE_SUGGESTIONS_TOOL: Tool;
export declare const LITE_INSTANCE_INFO_TOOL: Tool;
export declare const LITE_READ_URL_TOOL: Tool;
export declare const READ_URL_TOOL: Tool;

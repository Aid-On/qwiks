/**
 * SSE Parsing Helpers
 *
 * Pure functions for parsing Server-Sent Events data.
 * Extracted from useSSEStream for reduced complexity.
 */
export interface ParsedEvent<T> {
    event: T;
    done: boolean;
}
/** Try to parse a single SSE data string. Returns null on parse failure. */
export declare function tryParseSSEData<T>(dataStr: string, parser: (data: string) => T): ParsedEvent<T> | null;
/** Extract the data portion from an SSE line (e.g. "data: {...}") */
export declare function extractSSEData(line: string): string | null;
/** Split buffer into complete lines and remaining incomplete buffer */
export declare function splitBuffer(buffer: string): {
    lines: string[];
    remaining: string;
};
/** Process remaining buffer data when stream ends */
export declare function parseRemainingBuffer<T>(buffer: string, parser: (data: string) => T): T | null;

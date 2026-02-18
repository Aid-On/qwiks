/**
 * SSE Parsing Helpers
 *
 * Pure functions for parsing Server-Sent Events data.
 * Extracted from useSSEStream for reduced complexity.
 */
/** Try to parse a single SSE data string. Returns null on parse failure. */
export function tryParseSSEData(dataStr, parser) {
    if (!dataStr || dataStr === "[DONE]") {
        return dataStr === "[DONE]" ? { event: null, done: true } : null;
    }
    try {
        return { event: parser(dataStr), done: false };
    }
    catch {
        return null;
    }
}
/** Extract the data portion from an SSE line (e.g. "data: {...}") */
export function extractSSEData(line) {
    if (!line.startsWith("data: "))
        return null;
    return line.slice(6).trim();
}
/** Split buffer into complete lines and remaining incomplete buffer */
export function splitBuffer(buffer) {
    const parts = buffer.split("\n");
    const lastPart = parts[parts.length - 1];
    if (lastPart && !lastPart.endsWith("\n")) {
        return { lines: parts.slice(0, -1), remaining: lastPart };
    }
    return { lines: parts, remaining: "" };
}
/** Process remaining buffer data when stream ends */
export function parseRemainingBuffer(buffer, parser) {
    const dataStr = extractSSEData(buffer.trim());
    if (!dataStr)
        return null;
    const result = tryParseSSEData(dataStr, parser);
    if (result && !result.done)
        return result.event;
    return null;
}

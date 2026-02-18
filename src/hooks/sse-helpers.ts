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
export function tryParseSSEData<T>(
  dataStr: string,
  parser: (data: string) => T
): ParsedEvent<T> | null {
  if (!dataStr || dataStr === "[DONE]") {
    return dataStr === "[DONE]" ? { event: null as T, done: true } : null;
  }
  try {
    return { event: parser(dataStr), done: false };
  } catch {
    return null;
  }
}

/** Extract the data portion from an SSE line (e.g. "data: {...}") */
export function extractSSEData(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  return line.slice(6).trim();
}

/** Split buffer into complete lines and remaining incomplete buffer */
export function splitBuffer(buffer: string): { lines: string[]; remaining: string } {
  const parts = buffer.split("\n");
  const lastPart = parts[parts.length - 1];
  if (lastPart && !lastPart.endsWith("\n")) {
    return { lines: parts.slice(0, -1), remaining: lastPart };
  }
  return { lines: parts, remaining: "" };
}

/** Process remaining buffer data when stream ends */
export function parseRemainingBuffer<T>(
  buffer: string,
  parser: (data: string) => T
): T | null {
  const dataStr = extractSSEData(buffer.trim());
  if (!dataStr) return null;
  const result = tryParseSSEData(dataStr, parser);
  if (result && !result.done) return result.event;
  return null;
}

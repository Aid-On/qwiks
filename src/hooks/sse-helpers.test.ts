import { describe, it, expect } from "vitest";
import {
  tryParseSSEData,
  extractSSEData,
  splitBuffer,
  parseRemainingBuffer,
} from "./sse-helpers";

describe("extractSSEData", () => {
  it("should extract data from SSE line", () => {
    expect(extractSSEData('data: {"key":"value"}')).toBe('{"key":"value"}');
  });

  it("should trim whitespace from extracted data", () => {
    expect(extractSSEData("data:  hello world  ")).toBe("hello world");
  });

  it("should return null for non-data lines", () => {
    expect(extractSSEData("event: message")).toBeNull();
    expect(extractSSEData("id: 123")).toBeNull();
    expect(extractSSEData(": comment")).toBeNull();
    expect(extractSSEData("")).toBeNull();
  });

  it("should return null for lines that start with 'data' but not 'data: '", () => {
    expect(extractSSEData("dataValue")).toBeNull();
    expect(extractSSEData("data:nospace")).toBeNull();
  });

  it("should handle [DONE] marker", () => {
    expect(extractSSEData("data: [DONE]")).toBe("[DONE]");
  });
});

describe("tryParseSSEData", () => {
  it("should parse valid JSON data", () => {
    const parser = (data: string) => JSON.parse(data);
    const result = tryParseSSEData('{"type":"chunk","text":"hello"}', parser);

    expect(result).not.toBeNull();
    expect(result!.done).toBe(false);
    expect(result!.event).toEqual({ type: "chunk", text: "hello" });
  });

  it("should return done=true for [DONE] marker", () => {
    const parser = (data: string) => JSON.parse(data);
    const result = tryParseSSEData("[DONE]", parser);

    expect(result).not.toBeNull();
    expect(result!.done).toBe(true);
  });

  it("should return null for empty string", () => {
    const parser = (data: string) => JSON.parse(data);
    expect(tryParseSSEData("", parser)).toBeNull();
  });

  it("should return null on parse failure", () => {
    const parser = (data: string) => JSON.parse(data);
    expect(tryParseSSEData("not-valid-json{", parser)).toBeNull();
  });

  it("should work with custom parsers", () => {
    const parser = (data: string) => data.toUpperCase();
    const result = tryParseSSEData("hello", parser);

    expect(result).not.toBeNull();
    expect(result!.event).toBe("HELLO");
    expect(result!.done).toBe(false);
  });
});

describe("splitBuffer", () => {
  it("should split complete lines from buffer", () => {
    const result = splitBuffer("line1\nline2\nline3");
    expect(result.lines).toEqual(["line1", "line2"]);
    expect(result.remaining).toBe("line3");
  });

  it("should handle empty buffer", () => {
    const result = splitBuffer("");
    // "".split("\n") produces [""], and "" is falsy so lastPart check falls through
    expect(result.lines).toEqual([""]);
    expect(result.remaining).toBe("");
  });

  it("should handle buffer with single incomplete line", () => {
    const result = splitBuffer("partial data");
    expect(result.lines).toEqual([]);
    expect(result.remaining).toBe("partial data");
  });

  it("should handle buffer with trailing newline", () => {
    const result = splitBuffer("line1\nline2\n");
    // When last part is empty string after split, it's considered "complete"
    expect(result.lines).toEqual(["line1", "line2", ""]);
    expect(result.remaining).toBe("");
  });

  it("should handle multiple newlines (empty lines)", () => {
    const result = splitBuffer("data: hello\n\ndata: world\n");
    expect(result.lines).toEqual(["data: hello", "", "data: world", ""]);
    expect(result.remaining).toBe("");
  });
});

describe("parseRemainingBuffer", () => {
  it("should parse valid SSE data from buffer", () => {
    const parser = (data: string) => JSON.parse(data);
    const result = parseRemainingBuffer('data: {"text":"final"}', parser);

    expect(result).toEqual({ text: "final" });
  });

  it("should return null for non-SSE data", () => {
    const parser = (data: string) => JSON.parse(data);
    expect(parseRemainingBuffer("just text", parser)).toBeNull();
  });

  it("should return null for empty buffer", () => {
    const parser = (data: string) => JSON.parse(data);
    expect(parseRemainingBuffer("", parser)).toBeNull();
  });

  it("should return null for [DONE] marker", () => {
    const parser = (data: string) => JSON.parse(data);
    expect(parseRemainingBuffer("data: [DONE]", parser)).toBeNull();
  });

  it("should trim whitespace before parsing", () => {
    const parser = (data: string) => JSON.parse(data);
    const result = parseRemainingBuffer('  data: {"ok":true}  ', parser);
    expect(result).toEqual({ ok: true });
  });

  it("should return null for invalid JSON in buffer", () => {
    const parser = (data: string) => JSON.parse(data);
    expect(parseRemainingBuffer("data: {broken", parser)).toBeNull();
  });
});

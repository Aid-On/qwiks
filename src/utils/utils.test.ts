import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isCloudflareWorkers, delay } from "./index";

describe("isCloudflareWorkers", () => {
  it("should return false in Node.js environment", () => {
    expect(isCloudflareWorkers()).toBe(false);
  });
});

describe("delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should resolve after specified milliseconds", async () => {
    const callback = vi.fn();
    const promise = delay(100).then(callback);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    await promise;

    expect(callback).toHaveBeenCalledOnce();
  });

  it("should resolve with undefined", async () => {
    const promise = delay(50);
    vi.advanceTimersByTime(50);
    const result = await promise;
    expect(result).toBeUndefined();
  });

  it("should not resolve before the specified time", async () => {
    const callback = vi.fn();
    delay(200).then(callback);

    vi.advanceTimersByTime(100);
    // Flush microtasks
    await new Promise((resolve) => resolve(undefined));

    expect(callback).not.toHaveBeenCalled();
  });
});

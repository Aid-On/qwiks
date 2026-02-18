/**
 * useSSEStream - Server-Sent Events専用フック
 *
 * Fast LLM Chat Appの実装パターンから抽出
 * SSEのバッファリング、不完全チャンク処理、型安全な解析を提供
 *
 * @example
 * ```typescript
 * const chat = useSSEStream<ChatEvent>({
 *   endpoint: `/api/chat/${threadId}/messages`,
 *   method: 'POST',
 *   body: { content: input.value },
 *   parser: (data) => JSON.parse(data) as ChatEvent,
 *   onMessage: (event) => {
 *     if (event.type === 'chunk') {
 *       // Handle chunk
 *     }
 *   }
 * });
 * ```
 */

import {
  useSignal,
  useStore,
  useVisibleTask$,
  $,
  type QRL,
  type Signal
} from "@builder.io/qwik";
import {
  tryParseSSEData,
  extractSSEData,
  splitBuffer,
  parseRemainingBuffer
} from "./sse-helpers.js";

export interface SSEStreamOptions<T> {
  /** API endpoint */
  endpoint: string;
  /** HTTP method */
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Request body */
  body?: unknown;
  /** Request headers */
  headers?: Record<string, string>;
  /** Parse SSE data */
  parser?: (data: string) => T;
  /** Handle each message */
  onMessage?: QRL<(event: T) => void>;
  /** Handle start */
  onStart?: QRL<() => void>;
  /** Handle complete */
  onComplete?: QRL<() => void>;
  /** Handle error */
  onError?: QRL<(error: Error) => void>;
  /** Auto start */
  autoStart?: boolean;
  /** Debug logging */
  debug?: boolean;
}

export interface SSEStreamState<T> {
  /** Current status */
  status: "idle" | "connecting" | "streaming" | "completed" | "error" | "aborted";
  /** Error if any */
  error: Signal<Error | null>;
  /** Accumulated events */
  events: T[];
  /** Latest event */
  latest: Signal<T | null>;
  /** Start streaming */
  start: QRL<() => Promise<void>>;
  /** Abort streaming */
  abort: QRL<() => void>;
  /** Restart streaming */
  restart: QRL<() => Promise<void>>;
  /** Clear events */
  clear: QRL<() => void>;
}

/**
 * Server-Sent Events streaming hook
 * Extracted from Fast LLM Chat App's proven implementation
 */
export function useSSEStream<T = unknown>(
  options: SSEStreamOptions<T>
): SSEStreamState<T> {
  const {
    endpoint,
    method = "GET",
    body,
    headers = {},
    parser = (data) => JSON.parse(data) as T,
    onMessage,
    onStart,
    onComplete,
    onError,
    autoStart = false,
    debug = false
  } = options;

  // State
  const status = useSignal<SSEStreamState<T>["status"]>("idle");
  const error = useSignal<Error | null>(null);
  const latest = useSignal<T | null>(null);
  const events = useStore<{ items: T[] }>({ items: [] });
  const abortController = useSignal<AbortController | null>(null);

  // Emit a parsed event to state and callbacks
  const emitEvent = async (event: T) => {
    events.items = [...events.items, event];
    latest.value = event;
    if (onMessage) await onMessage(event);
  };

  // Process a single SSE line, returns true if [DONE] was received
  const processLine = async (line: string): Promise<boolean> => {
    if (line.trim() === "") return false;
    const dataStr = extractSSEData(line);
    if (!dataStr) return false;

    if (dataStr === "[DONE]") {
      status.value = "completed";
      if (onComplete) await onComplete();
      return true;
    }

    const result = tryParseSSEData(dataStr, parser);
    if (result && !result.done) {
      await emitEvent(result.event);
    }
    return false;
  };

  // Create and validate SSE fetch response
  const createSSEReader = async (signal: AbortSignal) => {
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.includes("text/event-stream")) {
      throw new Error(`Not an SSE response: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }
    return reader;
  };

  // Read and process the SSE stream
  const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      if (abortController.value?.signal.aborted) {
        status.value = "aborted";
        break;
      }

      const { done, value } = await reader.read();

      if (done) {
        const remainingEvent = parseRemainingBuffer(buffer, parser);
        if (remainingEvent) await emitEvent(remainingEvent);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const { lines, remaining } = splitBuffer(buffer);
      buffer = remaining;

      for (const line of lines) {
        const isDone = await processLine(line);
        if (isDone) return;
      }
    }

    status.value = "completed";
    if (onComplete) await onComplete();
  };

  // Start streaming
  const start = $(async () => {
    if (status.value === "streaming" || status.value === "connecting") {
      return;
    }

    try {
      status.value = "connecting";
      error.value = null;
      abortController.value = new AbortController();

      const reader = await createSSEReader(abortController.value.signal);

      status.value = "streaming";
      if (onStart) await onStart();

      await readStream(reader);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      status.value = "error";
      if (onError) await onError(error.value);
    } finally {
      abortController.value = null;
    }
  });

  // Abort streaming
  const abort = $(() => {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
      status.value = "aborted";
    }
  });

  // Restart streaming
  const restart = $(async () => {
    abort();
    events.items = [];
    latest.value = null;
    error.value = null;
    await start();
  });

  // Clear events
  const clear = $(() => {
    events.items = [];
    latest.value = null;
  });

  // Auto start
  useVisibleTask$(async () => {
    if (autoStart) {
      await start();
    }
  }, { strategy: "document-ready" });

  // Cleanup on unmount
  useVisibleTask$(({ cleanup }) => {
    cleanup(() => {
      if (abortController.value) {
        abortController.value.abort();
      }
    });
  });

  return {
    status: status.value,
    error,
    events: events.items,
    latest,
    start,
    abort,
    restart,
    clear
  };
}

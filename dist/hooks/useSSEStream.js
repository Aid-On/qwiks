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
import { useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { tryParseSSEData, extractSSEData, splitBuffer, parseRemainingBuffer } from "./sse-helpers.js";
/**
 * Server-Sent Events streaming hook
 * Extracted from Fast LLM Chat App's proven implementation
 */
export function useSSEStream(options) {
    const { endpoint, method = "GET", body, headers = {}, parser = (data) => JSON.parse(data), onMessage, onStart, onComplete, onError, autoStart = false, debug = false } = options;
    // State
    const status = useSignal("idle");
    const error = useSignal(null);
    const latest = useSignal(null);
    const events = useStore({ items: [] });
    const abortController = useSignal(null);
    // Emit a parsed event to state and callbacks
    const emitEvent = async (event) => {
        events.items = [...events.items, event];
        latest.value = event;
        if (onMessage)
            await onMessage(event);
    };
    // Process a single SSE line, returns true if [DONE] was received
    const processLine = async (line) => {
        if (line.trim() === "")
            return false;
        const dataStr = extractSSEData(line);
        if (!dataStr)
            return false;
        if (dataStr === "[DONE]") {
            status.value = "completed";
            if (onComplete)
                await onComplete();
            return true;
        }
        const result = tryParseSSEData(dataStr, parser);
        if (result && !result.done) {
            await emitEvent(result.event);
        }
        return false;
    };
    // Create and validate SSE fetch response
    const createSSEReader = async (signal) => {
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
    const readStream = async (reader) => {
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
                if (remainingEvent)
                    await emitEvent(remainingEvent);
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            const { lines, remaining } = splitBuffer(buffer);
            buffer = remaining;
            for (const line of lines) {
                const isDone = await processLine(line);
                if (isDone)
                    return;
            }
        }
        status.value = "completed";
        if (onComplete)
            await onComplete();
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
            if (onStart)
                await onStart();
            await readStream(reader);
        }
        catch (err) {
            error.value = err instanceof Error ? err : new Error(String(err));
            status.value = "error";
            if (onError)
                await onError(error.value);
        }
        finally {
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

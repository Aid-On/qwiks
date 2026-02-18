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
import { type QRL, type Signal } from "@builder.io/qwik";
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
export declare function useSSEStream<T = unknown>(options: SSEStreamOptions<T>): SSEStreamState<T>;

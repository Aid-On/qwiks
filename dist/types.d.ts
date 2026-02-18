/**
 * @aid-on/qwiks2 Types
 *
 * Pure Qwik + Nagare Stream<T> 汎用型定義
 * unilmp等全nagareベースライブラリと結合可能
 */
import type { QRL } from "@builder.io/qwik";
export type StreamStatus = "idle" | "connecting" | "streaming" | "completed" | "error" | "stopped";
export interface StreamState<T> {
    /** Current stream value */
    value: T;
    /** Accumulated values array */
    values: T[];
    /** Current status */
    status: StreamStatus;
    /** Error if any */
    error: Error | null;
    /** Control functions */
    stop: QRL<() => void>;
    restart: QRL<() => void>;
    /** Progress info */
    progress: {
        startTime: number | null;
        duration: number;
        bytesReceived: number;
    };
}
export interface StreamTextState {
    /** Accumulated text */
    text: string;
    /** Text chunks */
    chunks: string[];
    /** Current status */
    status: StreamStatus;
    /** Error if any */
    error: Error | null;
    /** Control functions */
    stop: QRL<() => void>;
    restart: QRL<() => void>;
    /** Text metrics */
    metrics: {
        charCount: number;
        wordCount: number;
        lineCount: number;
    };
}
export interface StreamArrayState<T> {
    /** Current array */
    items: T[];
    /** Total item count */
    count: number;
    /** Current status */
    status: StreamStatus;
    /** Error if any */
    error: Error | null;
    /** Control functions */
    stop: QRL<() => void>;
    restart: QRL<() => void>;
    /** Array metrics */
    metrics: {
        addedCount: number;
        removedCount: number;
        modifiedCount: number;
    };
}
export interface EdgeStreamConfig {
    /** Enable Cloudflare Workers optimizations */
    edgeOptimized?: boolean;
    /** Buffer size for edge processing */
    bufferSize?: number;
    /** Chunk processing strategy */
    chunkStrategy?: "immediate" | "batched" | "adaptive";
    /** Backpressure handling */
    backpressure?: {
        enabled?: boolean;
        threshold?: number;
        strategy?: "drop" | "buffer" | "slow";
    };
}

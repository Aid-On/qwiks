/**
 * useStream - 汎用 Nagare Stream<T> × Qwik 統合フック
 * 
 * あらゆるnagareベースライブラリと結合可能な汎用インターフェース
 * unilmp, embersm, whenm等すべてと自動結合
 *
 * @example
 * ```typescript
 * import { useStream } from "@aid-on/qwiks2";
 * import { unilmp } from "@aid-on/unilmp";
 *
 * export default component$(() => {
 *   const response = useStream(() => 
 *     unilmp.createStream({
 *       provider: "groq",
 *       // any unilmp configuration
 *     })
 *   );
 *
 *   return (
 *     <div>
 *       <div>Value: {response.value}</div>
 *       <div>Status: {response.status}</div>
 *       <button onClick$={response.stop}>Stop</button>
 *     </div>
 *   );
 * });
 * ```
 */

import { 
  useSignal, 
  useStore, 
  useVisibleTask$,
  $,
  type QRL
} from "@builder.io/qwik";
import type { Stream } from "@aid-on/nagare";
import type { StreamState, StreamStatus } from "../types.js";

interface UseStreamOptions<T> {
  /** Initial value */
  initialValue?: T;
  /** Auto-start the stream */
  autoStart?: boolean;
  /** Debug logging */
  debug?: boolean;
}

/**
 * Pure Nagare Stream<T> × Qwik Signal integration
 * 
 * 任意のnagareベースライブラリと組み合わせ可能な汎用フック
 */
export function useStream<T>(
  streamFactory: QRL<() => Stream<T>>,
  options: UseStreamOptions<T> = {}
): StreamState<T> {
  const { 
    initialValue = null as T,
    autoStart = true, 
    debug = false 
  } = options;

  // Qwik Reactive State
  const value = useSignal<T>(initialValue);
  const values = useSignal<T[]>([]);
  const status = useSignal<StreamStatus>("idle");
  const error = useSignal<Error | null>(null);
  
  // Progress tracking
  const progress = useStore({
    startTime: null as number | null,
    duration: 0,
    bytesReceived: 0,
  });

  // Stream management
  const unsubscribe = useSignal<(() => void) | null>(null);

  // =============================================================================
  // Control Functions (Qwik $-optimized)
  // =============================================================================

  const stop = $(() => {
    status.value = "stopped";
    
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
  });

  const restart = $(async () => {
    // Reset state
    value.value = initialValue;
    values.value = [];
    status.value = "idle";
    error.value = null;
    progress.startTime = null;
    progress.duration = 0;
    progress.bytesReceived = 0;
    
    // Start new stream
    await startStream();
  });

  // =============================================================================
  // Stream Management
  // =============================================================================

  const startStream = $(async () => {
    if (status.value === "streaming") return;

    try {
      status.value = "connecting";
      error.value = null;
      progress.startTime = Date.now();
      
      // Create stream from any nagare-based library
      const stream = await streamFactory();
      
      status.value = "streaming";
      
      // Subscribe to nagare stream
      const subscription = stream.subscribe({
        next: (newValue: T) => {
          // Update Qwik signals (reactive)
          value.value = newValue;
          values.value = [...values.value, newValue];
          
          // Update progress
          progress.duration = Date.now() - (progress.startTime || Date.now());
          progress.bytesReceived += JSON.stringify(newValue).length;
        },
        
        error: (streamError: unknown) => {
          status.value = "error";
          error.value = streamError instanceof Error ? streamError : new Error(String(streamError));
          progress.duration = Date.now() - (progress.startTime || Date.now());
        },
        
        complete: () => {
          status.value = "completed";
          progress.duration = Date.now() - (progress.startTime || Date.now());
        },
      });
      
      unsubscribe.value = subscription.unsubscribe;
      
    } catch (e) {
      status.value = "error";
      error.value = e instanceof Error ? e : new Error(String(e));
    }
  });

  // Auto-start
  useVisibleTask$(async () => {
    if (autoStart) {
      await startStream();
    }
  }, { strategy: "document-ready" });

  // Cleanup
  useVisibleTask$(({ cleanup }) => {
    cleanup(() => {
      if (unsubscribe.value) {
        unsubscribe.value();
      }
    });
  });

  // =============================================================================
  // Return Reactive State
  // =============================================================================

  return {
    value: value.value,
    values: values.value,
    status: status.value,
    error: error.value,
    stop,
    restart,
    progress: {
      startTime: progress.startTime,
      duration: progress.duration,
      bytesReceived: progress.bytesReceived,
    },
  };
}
/**
 * useStreamArray - 配列ストリーミング特化フック
 * 
 * リアルタイムリスト、ライブデータ更新等に最適
 * あらゆるnagareベース配列ストリームと結合可能
 *
 * @example
 * ```typescript
 * import { useStreamArray } from "@aid-on/qwiks2";
 * import { someNagareLibrary } from "@aid-on/some-nagare-lib";
 *
 * export default component$(() => {
 *   const liveList = useStreamArray(() => 
 *     someNagareLibrary.createArrayStream()
 *   );
 *
 *   return (
 *     <div>
 *       <div>Items: {liveList.count}</div>
 *       <ul>
 *         {liveList.items.map(item => <li key={item.id}>{item.name}</li>)}
 *       </ul>
 *       <div>Added: {liveList.metrics.addedCount}</div>
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
import type { StreamArrayState, StreamStatus } from "../types.js";

interface UseStreamArrayOptions<T> {
  /** Initial array */
  initialValue?: T[];
  /** Auto-start the stream */
  autoStart?: boolean;
  /** Debug logging */
  debug?: boolean;
  /** Array processing options */
  processing?: {
    /** Track item additions */
    trackAdditions?: boolean;
    /** Track item removals */
    trackRemovals?: boolean;
    /** Track item modifications */
    trackModifications?: boolean;
  };
}

/**
 * 配列ストリーミング専用フック
 * あらゆるnagareベース配列ライブラリと統合可能
 */
export function useStreamArray<T>(
  streamFactory: QRL<() => Stream<T[]>>,
  options: UseStreamArrayOptions<T> = {}
): StreamArrayState<T> {
  const { 
    initialValue = [],
    autoStart = true, 
    debug = false,
    processing = {}
  } = options;

  const {
    trackAdditions = true,
    trackRemovals = true,
    trackModifications = true
  } = processing;

  // Qwik Reactive State
  const items = useSignal<T[]>(initialValue);
  const count = useSignal<number>(0);
  const status = useSignal<StreamStatus>("idle");
  const error = useSignal<Error | null>(null);
  
  // Array metrics
  const metrics = useStore({
    addedCount: 0,
    removedCount: 0,
    modifiedCount: 0,
  });

  // Stream management
  const unsubscribe = useSignal<(() => void) | null>(null);
  const previousItems = useSignal<T[]>([]);

  // =============================================================================
  // Array Processing Utils
  // =============================================================================

  const updateMetrics = (newItems: T[], oldItems: T[]) => {
    if (!trackAdditions && !trackRemovals && !trackModifications) return;

    const newSet = new Set(newItems.map(item => JSON.stringify(item)));
    const oldSet = new Set(oldItems.map(item => JSON.stringify(item)));

    if (trackAdditions) {
      const added = newItems.filter(item => !oldSet.has(JSON.stringify(item)));
      metrics.addedCount += added.length;
    }

    if (trackRemovals) {
      const removed = oldItems.filter(item => !newSet.has(JSON.stringify(item)));
      metrics.removedCount += removed.length;
    }

    // Simple modification detection (size difference)
    if (trackModifications && newItems.length === oldItems.length) {
      const hasChanges = JSON.stringify(newItems) !== JSON.stringify(oldItems);
      if (hasChanges) {
        metrics.modifiedCount++;
      }
    }
  };

  // =============================================================================
  // Control Functions
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
    items.value = initialValue;
    count.value = 0;
    status.value = "idle";
    error.value = null;
    metrics.addedCount = 0;
    metrics.removedCount = 0;
    metrics.modifiedCount = 0;
    previousItems.value = [];
    
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
      
      // Create stream from any nagare-based array library
      const stream = await streamFactory();
      
      status.value = "streaming";
      
      // Subscribe to nagare array stream
      const subscription = stream.subscribe({
        next: (newArray: T[]) => {
          // Update metrics
          updateMetrics(newArray, previousItems.value);
          
          // Update state
          previousItems.value = [...items.value];
          items.value = newArray;
          count.value = newArray.length;
        },
        
        error: (streamError: unknown) => {
          status.value = "error";
          error.value = streamError instanceof Error ? streamError : new Error(String(streamError));
        },
        
        complete: () => {
          status.value = "completed";
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
  // Return Array Stream State
  // =============================================================================

  return {
    items: items.value,
    count: count.value,
    status: status.value,
    error: error.value,
    stop,
    restart,
    metrics: {
      addedCount: metrics.addedCount,
      removedCount: metrics.removedCount,
      modifiedCount: metrics.modifiedCount,
    },
  };
}
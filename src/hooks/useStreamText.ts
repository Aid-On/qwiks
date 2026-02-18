/**
 * useStreamText - テキストストリーミング特化フック
 * 
 * unilmpのテキスト生成ストリームと完璧に統合
 * チャット、翻訳、要約等あらゆるテキスト生成に対応
 *
 * @example
 * ```typescript
 * import { useStreamText } from "@aid-on/qwiks2";
 * import { unilmp } from "@aid-on/unilmp";
 *
 * export default component$(() => {
 *   const chat = useStreamText(() => 
 *     unilmp.chat({
 *       provider: "groq",
 *       model: "llama-3.3-70b",
 *       messages: [{ role: "user", content: "Hello!" }]
 *     })
 *   );
 *
 *   return (
 *     <div>
 *       <div class="streaming-text">{chat.text}</div>
 *       <div>Words: {chat.metrics.wordCount}</div>
 *       <div>Status: {chat.status}</div>
 *       {chat.status === "streaming" && <span class="cursor">|</span>}
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
import type { StreamTextState, StreamStatus } from "../types.js";

interface UseStreamTextOptions {
  /** Auto-start the stream */
  autoStart?: boolean;
  /** Debug logging */
  debug?: boolean;
  /** Text processing options */
  processing?: {
    /** Real-time word counting */
    countWords?: boolean;
    /** Real-time line counting */
    countLines?: boolean;
    /** Trim whitespace */
    trim?: boolean;
  };
}

/**
 * テキストストリーミング専用フック
 * unilmpや他のテキスト生成nagareライブラリと最適統合
 */
export function useStreamText(
  streamFactory: QRL<() => Stream<string>>,
  options: UseStreamTextOptions = {}
): StreamTextState {
  const { 
    autoStart = true, 
    debug = false,
    processing = {}
  } = options;

  const {
    countWords = true,
    countLines = true,
    trim = false
  } = processing;

  // Qwik Reactive State
  const text = useSignal<string>("");
  const chunks = useSignal<string[]>([]);
  const status = useSignal<StreamStatus>("idle");
  const error = useSignal<Error | null>(null);
  
  // Text metrics
  const metrics = useStore({
    charCount: 0,
    wordCount: 0,
    lineCount: 0,
  });

  // Stream management
  const unsubscribe = useSignal<(() => void) | null>(null);

  // =============================================================================
  // Text Processing Utils
  // =============================================================================

  const updateMetrics = (fullText: string) => {
    const processed = trim ? fullText.trim() : fullText;
    
    metrics.charCount = processed.length;
    
    if (countWords) {
      metrics.wordCount = processed.split(/\s+/).filter(w => w.length > 0).length;
    }
    
    if (countLines) {
      metrics.lineCount = processed.split('\n').length;
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
    text.value = "";
    chunks.value = [];
    status.value = "idle";
    error.value = null;
    metrics.charCount = 0;
    metrics.wordCount = 0;
    metrics.lineCount = 0;
    
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
      
      // Create stream from any nagare-based text library
      const stream = await streamFactory();
      
      status.value = "streaming";
      
      // Subscribe to nagare text stream
      const subscription = stream.subscribe({
        next: (chunk: string) => {
          // Accumulate text
          text.value += chunk;
          chunks.value = [...chunks.value, chunk];
          
          // Update metrics in real-time
          updateMetrics(text.value);
        },
        
        error: (streamError: unknown) => {
          status.value = "error";
          error.value = streamError instanceof Error ? streamError : new Error(String(streamError));
        },
        
        complete: () => {
          status.value = "completed";
          updateMetrics(text.value); // Final metrics update
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
  // Return Text Stream State
  // =============================================================================

  return {
    text: text.value,
    chunks: chunks.value,
    status: status.value,
    error: error.value,
    stop,
    restart,
    metrics: {
      charCount: metrics.charCount,
      wordCount: metrics.wordCount,
      lineCount: metrics.lineCount,
    },
  };
}
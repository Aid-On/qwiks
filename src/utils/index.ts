/**
 * Edge Utilities for Cloudflare Workers
 * 
 * 汎用ストリーミングユーティリティ
 * あらゆるnagareベースライブラリと結合可能
 */

import { stream, fromReadableStream } from "@aid-on/nagare";
import type { Stream } from "@aid-on/nagare";
import type { EdgeStreamConfig } from "../types.js";

// =============================================================================
// Environment Detection
// =============================================================================

/**
 * Cloudflare Workers環境検出
 */
export function isCloudflareWorkers(): boolean {
  try {
    const g = globalThis as Record<string, unknown>;
    return (
      typeof globalThis !== 'undefined' &&
      typeof g.caches !== 'undefined' &&
      typeof g.navigator === 'undefined' &&
      typeof g.Request !== 'undefined'
    );
  } catch {
    return false;
  }
}

// =============================================================================
// Promise-based Timing (setTimeout完全代替)
// =============================================================================

/**
 * Cloudflare Workers対応の遅延関数
 * setTimeout/setInterval完全不使用
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (isCloudflareWorkers()) {
      // Workers環境: Promise chain delay
      const start = Date.now();
      const poll = () => {
        if (Date.now() - start >= ms) {
          resolve();
        } else {
          Promise.resolve().then(poll);
        }
      };
      poll();
    } else {
      // Browser/Node: setTimeout
      setTimeout(resolve, ms);
    }
  });
}

// =============================================================================
// 汎用ストリーミング - nagareベースライブラリと結合
// =============================================================================

interface StreamOptions {
  /** Source stream from any nagare-based library */
  source: Stream<unknown>;
  /** Processing configuration */
  config?: EdgeStreamConfig;
}

/**
 * 任意のnagare Stream<T>をエッジ最適化
 * unilmp, embersm, whenm等すべてと互換
 */
export function createEdgeOptimizedStream<T>(options: StreamOptions): Stream<T> {
  const { source, config = {} } = options;
  const { edgeOptimized = true } = config;

  return fromReadableStream(new ReadableStream<T>({
    start(controller) {
      let processedCount = 0;

      const subscription = source.subscribe({
        next: async (value: unknown) => {
          controller.enqueue(value as T);
          
          // Edge optimization: periodic yielding
          if (edgeOptimized && ++processedCount % 50 === 0) {
            await Promise.resolve(); // Yield to event loop
          }
        },
        error: (e: unknown) => {
          controller.error(e instanceof Error ? e : new Error(String(e)));
        },
        complete: () => {
          controller.close();
        },
      });

      // Return cleanup for the controller
      return () => {
        subscription.unsubscribe();
      };
    }
  }));
}

/** Validate and create a reader from a fetch response */
async function createFetchReader(
  url: string,
  method: string,
  body: unknown,
  headers: Record<string, string>
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }
  return reader;
}

/** Enqueue non-empty chunks to the controller with periodic yielding */
async function enqueueChunks(
  controller: ReadableStreamDefaultController<string>,
  chunks: string[]
): Promise<void> {
  for (const chunk of chunks) {
    if (chunk.trim()) {
      controller.enqueue(chunk);
      await Promise.resolve(); // Edge optimization: yield periodically
    }
  }
}

/**
 * 汎用的なHTTPストリーミング
 * 任意のAPIエンドポイントからnagare Stream<T>を作成
 */
export function createEdgeStream(options: {
  url: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Stream<string> {
  const { url, method = "POST", body, headers = {} } = options;

  return fromReadableStream(new ReadableStream<string>({
    async start(controller) {
      try {
        const reader = await createFetchReader(url, method, body, headers);
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";
          await enqueueChunks(controller, chunks);
        }

        // Process remaining buffer
        if (buffer.trim()) {
          controller.enqueue(buffer);
        }

        controller.close();
      } catch (e) {
        controller.error(e instanceof Error ? e : new Error(String(e)));
      }
    }
  }));
}
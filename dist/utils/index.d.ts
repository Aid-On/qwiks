/**
 * Edge Utilities for Cloudflare Workers
 *
 * 汎用ストリーミングユーティリティ
 * あらゆるnagareベースライブラリと結合可能
 */
import type { Stream } from "@aid-on/nagare";
import type { EdgeStreamConfig } from "../types.js";
/**
 * Cloudflare Workers環境検出
 */
export declare function isCloudflareWorkers(): boolean;
/**
 * Cloudflare Workers対応の遅延関数
 * setTimeout/setInterval完全不使用
 */
export declare function delay(ms: number): Promise<void>;
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
export declare function createEdgeOptimizedStream<T>(options: StreamOptions): Stream<T>;
/**
 * 汎用的なHTTPストリーミング
 * 任意のAPIエンドポイントからnagare Stream<T>を作成
 */
export declare function createEdgeStream(options: {
    url: string;
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}): Stream<string>;
export {};

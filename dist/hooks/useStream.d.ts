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
import { type QRL } from "@builder.io/qwik";
import type { Stream } from "@aid-on/nagare";
import type { StreamState } from "../types.js";
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
export declare function useStream<T>(streamFactory: QRL<() => Stream<T>>, options?: UseStreamOptions<T>): StreamState<T>;
export {};

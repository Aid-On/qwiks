/**
 * @aid-on/qwiks2
 *
 * Pure Qwik + Nagare Stream<T> Integration Library
 * 汎用的なストリーム処理 - unilmp等全nagareベースライブラリと結合可能
 *
 * @example
 * ```typescript
 * import { useStream, useStreamText } from "@aid-on/qwiks2";
 * import { someNagareBasedLibrary } from "@aid-on/unilmp"; // or any nagare-based lib
 *
 * export default component$(() => {
 *   const stream = useStream(() => someNagareBasedLibrary.createStream());
 *   const textStream = useStreamText(() => someNagareBasedLibrary.createTextStream());
 *
 *   return (
 *     <div>
 *       <div>Value: {stream.value}</div>
 *       <div>Text: {textStream.text}</div>
 *       <div>Status: {stream.status}</div>
 *       <button onClick$={stream.stop}>Stop</button>
 *     </div>
 *   );
 * });
 * ```
 */
export type { Stream } from "@aid-on/nagare";
export { stream, operators } from "@aid-on/nagare";
export type { StreamState, StreamTextState, StreamArrayState, StreamStatus, EdgeStreamConfig, } from "./types.js";
export type { SSEStreamOptions, SSEStreamState } from "./hooks/useSSEStream.js";
export { useStream } from "./hooks/useStream.js";
export { useStreamText } from "./hooks/useStreamText.js";
export { useStreamArray } from "./hooks/useStreamArray.js";
export { useSSEStream } from "./hooks/useSSEStream.js";
export { createEdgeStream, isCloudflareWorkers, delay, } from "./utils/index.js";

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
import { type QRL } from "@builder.io/qwik";
import type { Stream } from "@aid-on/nagare";
import type { StreamArrayState } from "../types.js";
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
export declare function useStreamArray<T>(streamFactory: QRL<() => Stream<T[]>>, options?: UseStreamArrayOptions<T>): StreamArrayState<T>;
export {};

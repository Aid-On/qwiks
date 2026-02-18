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
import { type QRL } from "@builder.io/qwik";
import type { Stream } from "@aid-on/nagare";
import type { StreamTextState } from "../types.js";
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
export declare function useStreamText(streamFactory: QRL<() => Stream<string>>, options?: UseStreamTextOptions): StreamTextState;
export {};

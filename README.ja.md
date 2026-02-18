# @aid-on/qwiks

<div align="center">

[![npm version](https://img.shields.io/npm/v/@aid-on/qwiks.svg?style=flat-square&color=00DC82)](https://www.npmjs.com/package/@aid-on/qwiks)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Qwik × nagare Stream&lt;T&gt; 完全統合**

Qwik SignalとNagare Streamをシームレスに接続する専用フックライブラリ

[English](README.md) | **日本語**

</div>

## なぜ qwiks？

### nagare Stream&lt;T&gt; → Qwik Signal 自動変換

```typescript
// nagare Stream を Qwik コンポーネントで直接使える
const aiResponse = useStreamText(() =>
  unilmp.stream("Hello AI")  // Returns nagare Stream<string>
);

// 自動的に Qwik Signal に変換される
return <div>{aiResponse.text}</div>  // リアクティブに更新
```

### エッジ最適化

- Cloudflare Workers 完全対応
- WebStreams ネイティブ
- メモリ効率的なストリーミング
- バックプレッシャー対応

### Aid-On エコシステム統合

```typescript
// すべての Aid-On ライブラリと統合可能
useStream(() => unilmp.stream(...))     // LLM streaming
useStream(() => embersm.watch(...))     // Memory updates
useStream(() => synapser.reports(...))  // Agent reports
```

## インストール

```bash
npm install @aid-on/qwiks
```

## 基本的な使い方

### useStreamText - テキストストリーミング

```typescript
import { component$ } from "@builder.io/qwik";
import { useStreamText } from "@aid-on/qwiks";
import { unilmp } from "@aid-on/unilmp";

export default component$(() => {
  const chat = useStreamText(() =>
    unilmp()
      .model("groq:llama-3.3-70b-versatile")
      .credentials({ groqApiKey: "..." })
      .stream("Tell me a story")
  );

  return (
    <div>
      <div class="message">{chat.text}</div>

      <div class="status">
        {chat.status === "streaming" && "生成中..."}
        {chat.status === "completed" && "完了"}
        {chat.status === "error" && `エラー: ${chat.error}`}
      </div>

      <div class="metrics">
        文字数: {chat.metrics.charCount}
        単語数: {chat.metrics.wordCount}
      </div>

      <button onClick$={chat.stop}>停止</button>
      <button onClick$={chat.restart}>再開</button>
    </div>
  );
});
```

### useStream - 汎用ストリーミング

```typescript
import { useStream } from "@aid-on/qwiks";
import type { Stream } from "@aid-on/nagare";

interface DataEvent {
  timestamp: number;
  value: number;
}

export default component$(() => {
  const dataStream = useStream<DataEvent>(() =>
    createDataStream()  // Returns Stream<DataEvent>
  );

  return (
    <div>
      <div>値: {dataStream.value?.value}</div>
      <ul>
        {dataStream.history.map((event, i) => (
          <li key={i}>
            {event.timestamp}: {event.value}
          </li>
        ))}
      </ul>
    </div>
  );
});
```

### useStreamArray - 配列ストリーミング

```typescript
import { useStreamArray } from "@aid-on/qwiks";

export default component$(() => {
  const items = useStreamArray<string>(() =>
    stream.array(["item1", "item2", "item3"])
      .throttle(1000)
  );

  return (
    <ul>
      {items.array.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
});
```

### useSSEStream - Server-Sent Events

```typescript
import { useSSEStream } from "@aid-on/qwiks";

export default component$(() => {
  const events = useSSEStream("/api/events");

  return (
    <div>
      <div class={`status ${events.status}`}>
        {events.status === "connecting" && "接続中..."}
        {events.status === "streaming" && "接続済み"}
        {events.status === "error" && "エラー"}
      </div>

      <div class="events">
        {events.history.slice(-10).map((event, i) => (
          <div key={i}>{event.type}: {event.data}</div>
        ))}
      </div>
    </div>
  );
});
```

## API リファレンス

### useStreamText

テキストストリーミング専用フック。

```typescript
function useStreamText(
  streamFactory: QRL<() => Stream<string>>,
  options?: UseStreamTextOptions
): StreamTextState

interface StreamTextState {
  text: string;                 // 累積テキスト
  chunks: string[];             // チャンク配列
  status: StreamStatus;         // ストリーム状態
  error: Error | null;          // エラー情報
  stop: () => void;             // 停止
  restart: () => Promise<void>; // 再開
  metrics: {
    charCount: number;          // 文字数
    wordCount: number;          // 単語数
    lineCount: number;          // 行数
  };
}
```

### useStream

汎用ストリーミングフック。

```typescript
function useStream<T>(
  streamFactory: QRL<() => Stream<T>>,
  options?: UseStreamOptions
): StreamState<T>

interface StreamState<T> {
  value: T | null;              // 最新の値
  history: T[];                 // 全履歴
  status: StreamStatus;         // 状態
  error: Error | null;          // エラー
  stop: () => void;             // 停止
  restart: () => Promise<void>; // 再開
}
```

### useStreamArray

配列ストリーミングフック。

```typescript
function useStreamArray<T>(
  streamFactory: QRL<() => Stream<T>>,
  options?: UseStreamArrayOptions
): StreamArrayState<T>

interface StreamArrayState<T> {
  array: T[];                   // 累積配列
  latest: T | null;             // 最新要素
  status: StreamStatus;         // 状態
  error: Error | null;          // エラー
  stop: () => void;             // 停止
  restart: () => Promise<void>; // 再開
  clear: () => void;            // クリア
}
```

## エコシステム統合

qwiks は Aid-On Platform の全ライブラリと統合可能：

- **[@aid-on/nagare](https://github.com/Aid-On/nagare)** - ストリーム基盤
- **[@aid-on/unillm](https://github.com/Aid-On/unillm)** - LLM ストリーミング
- **[@aid-on/embersm](https://github.com/Aid-On/embersm)** - メモリシステム
- **[@aid-on/synapser](https://github.com/Aid-On/synapser)** - エージェント

## ライセンス

MIT

# @aid-on/qwiks

**Qwik × nagare Stream<T> 完全統合** - Qwik Signalとnagare Streamをシームレスに接続する専用フックライブラリ

## 🎯 なぜ qwiks？

### 🌊 **nagare Stream<T> → Qwik Signal 自動変換**
```typescript
// nagare Stream を Qwik コンポーネントで直接使える
const aiResponse = useStreamText(() => 
  unilmp.stream("Hello AI")  // Returns nagare Stream<string>
);

// 自動的に Qwik Signal に変換される
return <div>{aiResponse.text}</div>  // リアクティブに更新
```

### ⚡ **エッジ最適化**
- Cloudflare Workers 完全対応
- WebStreams ネイティブ
- メモリ効率的なストリーミング
- バックプレッシャー対応

### 🔄 **Aid-On エコシステム統合**
```typescript
// すべての Aid-On ライブラリと統合可能
useStream(() => unilmp.stream(...))     // LLM streaming
useStream(() => embersm.watch(...))     // Memory updates  
useStream(() => synapser.reports(...))  // Agent reports
```

## 📦 インストール

```bash
npm install @aid-on/qwiks
```

## 🚀 基本的な使い方

### useStreamText - テキストストリーミング

```typescript
import { component$ } from "@builder.io/qwik";
import { useStreamText } from "@aid-on/qwiks";
import { unilmp } from "@aid-on/unilmp";

export default component$(() => {
  // unilmpのストリームをQwik Signalに変換
  const chat = useStreamText(() => 
    unilmp()
      .model("groq:llama-3.3-70b-versatile")  
      .credentials({ groqApiKey: "..." })
      .stream("Tell me a story")
  );

  return (
    <div>
      {/* リアクティブなテキスト表示 */}
      <div class="message">{chat.text}</div>
      
      {/* ストリーミング状態 */}
      <div class="status">
        {chat.status === "streaming" && "生成中..."}
        {chat.status === "completed" && "完了"}
        {chat.status === "error" && `エラー: ${chat.error}`}
      </div>
      
      {/* メトリクス */}
      <div class="metrics">
        文字数: {chat.metrics.charCount}
        単語数: {chat.metrics.wordCount}
      </div>
      
      {/* コントロール */}
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
  // 任意の型のストリームを処理
  const dataStream = useStream<DataEvent>(() => 
    createDataStream()  // Returns Stream<DataEvent>
  );

  return (
    <div>
      {/* 最新の値 */}
      <div>値: {dataStream.value?.value}</div>
      
      {/* 全履歴 */}
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
  // 配列要素をストリーミング
  const items = useStreamArray<string>(() => 
    stream.array(["item1", "item2", "item3"])
      .throttle(1000)  // 1秒ごとに要素を出力
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

## 🎨 高度な使用例

### リアルタイムチャット UI

```typescript
export default component$(() => {
  const messages = useStore<Message[]>([]);
  const input = useSignal("");
  
  // AIレスポンスストリーミング
  const aiResponse = useStreamText(() => {
    if (!input.value) return stream.empty();
    
    return unilmp()
      .model("groq:llama-3.3-70b-versatile")
      .credentials({ groqApiKey })
      .messages([
        ...messages,
        { role: "user", content: input.value }
      ])
      .stream();
  }, {
    autoStart: false,  // 手動開始
    processing: {
      trim: true,      // 空白文字をトリム
      countWords: true // 単語数カウント
    }
  });

  const sendMessage = $(async () => {
    messages.push({ 
      role: "user", 
      content: input.value 
    });
    
    // ストリーミング開始
    await aiResponse.restart();
    input.value = "";
  });

  // ストリーミング完了時にメッセージ追加
  useVisibleTask$(({ track }) => {
    track(() => aiResponse.status);
    
    if (aiResponse.status === "completed") {
      messages.push({ 
        role: "assistant", 
        content: aiResponse.text 
      });
    }
  });

  return (
    <div class="chat">
      {/* メッセージ履歴 */}
      <div class="messages">
        {messages.map((msg, i) => (
          <div key={i} class={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        
        {/* ストリーミング中のAI応答 */}
        {aiResponse.status === "streaming" && (
          <div class="message assistant streaming">
            {aiResponse.text}
            <span class="cursor">|</span>
          </div>
        )}
      </div>
      
      {/* 入力フォーム */}
      <form onSubmit$={sendMessage}>
        <input 
          bind:value={input}
          disabled={aiResponse.status === "streaming"}
        />
        <button type="submit">送信</button>
      </form>
    </div>
  );
});
```

### Server-Sent Events (SSE) 統合

```typescript
export default component$(() => {
  // SSEストリームを処理
  const events = useStream<MessageEvent>(() => 
    stream.fromSSE("/api/events")
  );

  return (
    <div>
      <h2>リアルタイムイベント</h2>
      
      {/* 接続状態 */}
      <div class={`status ${events.status}`}>
        {events.status === "connecting" && "接続中..."}
        {events.status === "streaming" && "🟢 接続済み"}
        {events.status === "error" && "🔴 エラー"}
      </div>
      
      {/* イベントログ */}
      <div class="events">
        {events.history.slice(-10).map((event, i) => (
          <div key={i} class="event">
            {event.type}: {event.data}
          </div>
        ))}
      </div>
    </div>
  );
});
```

## 🔧 API リファレンス

### useStreamText

テキストストリーミング専用フック。

```typescript
function useStreamText(
  streamFactory: QRL<() => Stream<string>>,
  options?: UseStreamTextOptions
): StreamTextState

interface StreamTextState {
  text: string;               // 累積テキスト
  chunks: string[];           // チャンク配列
  status: StreamStatus;       // ストリーム状態
  error: Error | null;        // エラー情報
  stop: () => void;           // 停止
  restart: () => Promise<void>; // 再開
  metrics: {
    charCount: number;        // 文字数
    wordCount: number;        // 単語数
    lineCount: number;        // 行数
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
  value: T | null;            // 最新の値
  history: T[];               // 全履歴
  status: StreamStatus;       // 状態
  error: Error | null;        // エラー
  stop: () => void;           // 停止
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
  array: T[];                 // 累積配列
  latest: T | null;           // 最新要素
  status: StreamStatus;       // 状態
  error: Error | null;        // エラー
  stop: () => void;           // 停止
  restart: () => Promise<void>; // 再開
  clear: () => void;          // クリア
}
```

## 🎯 改善ポイント

### 1. **自動リトライ機能**
```typescript
// 今後追加予定
const stream = useStreamText(() => source(), {
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2
  }
});
```

### 2. **デバウンス/スロットル**
```typescript
// 今後追加予定
const stream = useStream(() => source(), {
  debounce: 500,   // 500ms デバウンス
  throttle: 100    // 100ms スロットル
});
```

### 3. **永続化サポート**
```typescript
// 今後追加予定
const stream = useStreamText(() => source(), {
  persist: {
    key: "chat-history",
    storage: "localStorage"
  }
});
```

### 4. **並列ストリーム処理**
```typescript
// 今後追加予定
const [stream1, stream2] = useParallelStreams([
  () => source1(),
  () => source2()
]);
```

## 🏗️ エコシステム統合

qwiks は Aid-On Platform の全ライブラリと統合可能：

- **[@aid-on/unilmp](../unilmp)** - LLM ストリーミング
- **[@aid-on/nagare](../nagare)** - ストリーム基盤
- **[@aid-on/embersm](../embersm)** - メモリシステム
- **[@aid-on/synapser](../synapser)** - エージェント

## 📄 License

MIT

---

**@aid-on/qwiks** で Qwik × nagare の完全統合を実現！ 🚀
# @aid-on/qwiks

## 概要

`@aid-on/qwiks`は、QwikとNagare Streamを統合する汎用ストリーミングライブラリです。unilmp、embersm、whenm等すべてのnagareベースライブラリと自動結合し、リアルタイムなストリーミングUIを簡潔に実装できます。Cloudflare Workersを含むエッジ環境での完全対応を実現しています。

## 主な特徴

- **Nagare統合**: すべてのnagareベースライブラリとの汎用結合
- **Qwik Reactive**: Qwik SignalAPIによる自動リアクティブ更新
- **型安全性**: TypeScriptによる完全な型サポート
- **エッジネイティブ**: Cloudflare Workers完全対応
- **進捗追跡**: リアルタイム進捗・メトリクス監視
- **テキスト特化**: LLMテキスト生成の最適化フック
- **SSE対応**: Server-Sent Events標準サポート
- **配列処理**: 動的配列ストリーミング機能

## アーキテクチャ

### Nagare × Qwik統合アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Any Nagare    │    │     Qwiks       │    │      Qwik       │
│   Based Library │    │   Integration   │    │   Components    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ unilmp          │◄──►│ useStream       │◄──►│ Reactive UI     │
│ embersm         │    │ useStreamText   │    │ Auto Updates    │
│ whenm           │    │ useStreamArray  │    │ Progress Bars   │
│ fractop         │    │ useSSEStream    │    │ Real-time Data  │
│ iteratop        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### ストリーミングフロー

```
Data Source → Nagare Stream → Qwiks Hook → Qwik Signal → UI Update
     ↓              ↓              ↓           ↓            ↓
  Backend     Stream<T>      useStream()   Signal<T>   Component
```

### フック種類と用途

- **useStream**: 汎用Stream<T>統合
- **useStreamText**: LLMテキスト生成専用
- **useStreamArray**: 動的配列ストリーミング
- **useSSEStream**: Server-Sent Events専用

## APIリファレンス

### 汎用ストリーム統合

```typescript
import { useStream } from '@aid-on/qwiks';
import { unilmp } from '@aid-on/unilmp';

export default component$(() => {
  const stream = useStream(() => 
    unilmp.createStream({
      provider: "groq",
      model: "llama-3.3-70b"
    })
  );

  return (
    <div>
      <div>Value: {stream.value}</div>
      <div>Status: {stream.status}</div>
      <div>Progress: {stream.progress.duration}ms</div>
      
      {stream.status === "streaming" && (
        <div>Receiving data...</div>
      )}
      
      <button onClick$={stream.stop}>Stop</button>
      <button onClick$={stream.restart}>Restart</button>
    </div>
  );
});
```

### テキストストリーミング

```typescript
import { useStreamText } from '@aid-on/qwiks';
import { unilmp } from '@aid-on/unilmp';

export default component$(() => {
  const chat = useStreamText(() => 
    unilmp.chat({
      provider: "groq",
      model: "llama-3.3-70b",
      messages: [
        { role: "user", content: "Write a poem about streaming" }
      ]
    })
  );

  return (
    <div class="chat-container">
      <div class="message-area">
        {chat.text}
        {chat.status === "streaming" && (
          <span class="cursor animate-pulse">|</span>
        )}
      </div>
      
      <div class="metrics">
        <span>Words: {chat.metrics.wordCount}</span>
        <span>Characters: {chat.metrics.charCount}</span>
        <span>Speed: {chat.metrics.wordsPerSecond} WPS</span>
      </div>
      
      <div class="controls">
        <button 
          onClick$={chat.stop}
          disabled={chat.status !== "streaming"}
        >
          Stop Generation
        </button>
        
        <button onClick$={chat.restart}>
          Regenerate
        </button>
      </div>
    </div>
  );
});
```

### 配列ストリーミング

```typescript
import { useStreamArray } from '@aid-on/qwiks';
import { someDataStream } from './data-source';

export default component$(() => {
  const dataList = useStreamArray(() => 
    someDataStream.createItemStream()
  );

  return (
    <div class="data-list">
      <h3>Streaming Data ({dataList.items.length} items)</h3>
      
      {dataList.items.map((item, index) => (
        <div key={index} class="data-item">
          {JSON.stringify(item)}
        </div>
      ))}
      
      {dataList.status === "streaming" && (
        <div class="loading">Loading more items...</div>
      )}
      
      <div class="stats">
        Items/sec: {dataList.metrics.itemsPerSecond}
      </div>
    </div>
  );
});
```

### Server-Sent Events

```typescript
import { useSSEStream } from '@aid-on/qwiks';

export default component$(() => {
  const events = useSSEStream('/api/events', {
    withCredentials: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  });

  return (
    <div class="event-monitor">
      <div class="connection-status">
        Status: {events.connectionState}
      </div>
      
      {events.lastEvent && (
        <div class="latest-event">
          <h4>{events.lastEvent.type}</h4>
          <pre>{events.lastEvent.data}</pre>
        </div>
      )}
      
      <div class="event-history">
        <h4>Recent Events</h4>
        {events.events.slice(-10).map((event, index) => (
          <div key={index} class="event">
            [{event.timestamp.toLocaleTimeString()}] 
            {event.type}: {event.data}
          </div>
        ))}
      </div>
    </div>
  );
});
```

### 複数ライブラリ連携

```typescript
import { useStream, useStreamText } from '@aid-on/qwiks';
import { unilmp } from '@aid-on/unilmp';
import { embersm } from '@aid-on/embersm';
import { whenm } from '@aid-on/whenm';

export default component$(() => {
  // Memory context streaming
  const memory = useStream(() => 
    embersm.query(userId, query)
  );
  
  // Temporal reasoning streaming
  const reasoning = useStream(() =>
    whenm.reason(query, memory.value)
  );
  
  // LLM response streaming
  const response = useStreamText(() => 
    unilmp.chat({
      provider: "groq",
      messages: [
        { role: "system", content: `Memory: ${memory.value}` },
        { role: "system", content: `Reasoning: ${reasoning.value}` },
        { role: "user", content: query }
      ]
    })
  );

  return (
    <div class="ai-assistant">
      <div class="memory-panel">
        <h3>Memory Context</h3>
        {memory.status === "streaming" && <div>Loading memories...</div>}
        <pre>{JSON.stringify(memory.value, null, 2)}</pre>
      </div>
      
      <div class="reasoning-panel">
        <h3>Temporal Reasoning</h3>
        {reasoning.status === "streaming" && <div>Processing reasoning...</div>}
        <div>{reasoning.value?.conclusion}</div>
      </div>
      
      <div class="response-panel">
        <h3>AI Response</h3>
        <div class="streaming-text">
          {response.text}
          {response.status === "streaming" && <span class="cursor">|</span>}
        </div>
        
        <div class="metrics">
          Generation Speed: {response.metrics.wordsPerSecond} WPS
        </div>
      </div>
    </div>
  );
});
```

## 使用例

### リアルタイムチャットアプリ

```typescript
// src/components/chat/chat-interface.tsx
import { useStreamText } from '@aid-on/qwiks';
import { unilmp } from '@aid-on/unilmp';

export const ChatInterface = component$(() => {
  const messages = useSignal<Array<{role: string, content: string}>>([]);
  const input = useSignal('');
  
  const response = useStreamText(() => 
    unilmp.chat({
      provider: "groq",
      model: "llama-3.3-70b",
      messages: messages.value
    }), 
    { autoStart: false }
  );
  
  const sendMessage = $(async () => {
    const userMessage = input.value.trim();
    if (!userMessage) return;
    
    // Add user message
    messages.value = [...messages.value, {
      role: "user", 
      content: userMessage
    }];
    
    input.value = '';
    
    // Start AI response
    await response.restart();
  });
  
  // Add completed AI response to messages
  useVisibleTask$(({ track }) => {
    track(() => response.status);
    
    if (response.status === "completed" && response.text) {
      messages.value = [...messages.value, {
        role: "assistant",
        content: response.text
      }];
    }
  });

  return (
    <div class="chat-interface">
      <div class="messages">
        {messages.value.map((msg, index) => (
          <div key={index} class={`message ${msg.role}`}>
            <div class="content">{msg.content}</div>
          </div>
        ))}
        
        {/* Streaming response */}
        {response.status === "streaming" && (
          <div class="message assistant streaming">
            <div class="content">
              {response.text}
              <span class="cursor animate-pulse">|</span>
            </div>
            <div class="progress">
              {response.metrics.wordCount} words, 
              {response.metrics.wordsPerSecond} WPS
            </div>
          </div>
        )}
      </div>
      
      <div class="input-area">
        <input
          bind:value={input}
          onKeyPress$={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={response.status === "streaming"}
        />
        <button 
          onClick$={sendMessage}
          disabled={!input.value.trim() || response.status === "streaming"}
        >
          Send
        </button>
        
        {response.status === "streaming" && (
          <button onClick$={response.stop}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
});
```

### ドキュメント生成ダッシュボード

```typescript
// src/components/document-generator.tsx
import { useStreamText, useStream } from '@aid-on/qwiks';
import { unilmp } from '@aid-on/unilmp';
import { embersm } from '@aid-on/embersm';

export const DocumentGenerator = component$(() => {
  const topic = useSignal('');
  const selectedTemplate = useSignal('');
  
  // Knowledge retrieval
  const knowledge = useStream(() =>
    embersm.query('user', `Generate document about: ${topic.value}`)
  );
  
  // Document generation
  const document = useStreamText(() =>
    unilmp.chat({
      provider: "groq", 
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `You are a professional document writer. 
                   Use this knowledge: ${knowledge.value}
                   Template: ${selectedTemplate.value}`
        },
        {
          role: "user", 
          content: `Write a detailed document about: ${topic.value}`
        }
      ]
    }),
    { autoStart: false }
  );
  
  const generateDocument = $(async () => {
    if (!topic.value) return;
    
    // First get relevant knowledge
    await knowledge.restart();
    
    // Wait for knowledge then generate
    const subscription = knowledge.values$.subscribe(() => {
      if (knowledge.status === "completed") {
        document.restart();
        subscription.unsubscribe();
      }
    });
  });

  return (
    <div class="document-generator">
      <div class="controls">
        <div class="form-group">
          <label>Document Topic</label>
          <input
            bind:value={topic}
            placeholder="Enter topic..."
          />
        </div>
        
        <div class="form-group">
          <label>Template</label>
          <select bind:value={selectedTemplate}>
            <option value="report">Report</option>
            <option value="proposal">Proposal</option>
            <option value="analysis">Analysis</option>
          </select>
        </div>
        
        <button 
          onClick$={generateDocument}
          disabled={!topic.value || document.status === "streaming"}
        >
          Generate Document
        </button>
      </div>
      
      <div class="generation-status">
        {knowledge.status === "streaming" && (
          <div class="status">🔍 Gathering knowledge...</div>
        )}
        
        {document.status === "streaming" && (
          <div class="status">
            ✍️ Generating document... 
            ({document.metrics.wordCount} words, 
             {document.metrics.estimatedTimeRemaining}s remaining)
          </div>
        )}
      </div>
      
      <div class="output">
        <div class="knowledge-panel">
          <h3>Retrieved Knowledge</h3>
          <pre class="knowledge">
            {JSON.stringify(knowledge.value, null, 2)}
          </pre>
        </div>
        
        <div class="document-panel">
          <h3>Generated Document</h3>
          <div class="document-content">
            {document.text.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            
            {document.status === "streaming" && (
              <span class="cursor animate-pulse">|</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
```

### ライブデータ監視システム

```typescript
// src/components/monitoring/live-dashboard.tsx
import { useSSEStream, useStreamArray } from '@aid-on/qwiks';

export const LiveDashboard = component$(() => {
  // System metrics streaming
  const metrics = useSSEStream('/api/metrics/stream', {
    reconnectInterval: 3000
  });
  
  // Alert streaming
  const alerts = useStreamArray(() => 
    createAlertStream('/api/alerts/stream')
  );
  
  // Log streaming
  const logs = useStreamArray(() =>
    createLogStream('/api/logs/stream')
  );

  return (
    <div class="live-dashboard">
      <div class="header">
        <h1>System Dashboard</h1>
        <div class="connection-status">
          Metrics: {metrics.connectionState}
          Alerts: {alerts.status}
          Logs: {logs.status}
        </div>
      </div>
      
      <div class="metrics-grid">
        {metrics.lastEvent?.data && (
          <>
            <div class="metric-card">
              <h3>CPU Usage</h3>
              <div class="value">
                {JSON.parse(metrics.lastEvent.data).cpu}%
              </div>
            </div>
            
            <div class="metric-card">
              <h3>Memory</h3>
              <div class="value">
                {JSON.parse(metrics.lastEvent.data).memory}%
              </div>
            </div>
            
            <div class="metric-card">
              <h3>Disk I/O</h3>
              <div class="value">
                {JSON.parse(metrics.lastEvent.data).diskIO} MB/s
              </div>
            </div>
          </>
        )}
      </div>
      
      <div class="alerts-section">
        <h3>Live Alerts ({alerts.items.length})</h3>
        <div class="alerts-container">
          {alerts.items.slice(-5).map((alert, index) => (
            <div key={index} class={`alert alert-${alert.severity}`}>
              <div class="timestamp">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
              <div class="message">{alert.message}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div class="logs-section">
        <h3>Live Logs</h3>
        <div class="logs-container">
          {logs.items.slice(-20).map((log, index) => (
            <div key={index} class="log-entry">
              <span class="timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span class={`level level-${log.level}`}>
                {log.level}
              </span>
              <span class="message">{log.message}</span>
            </div>
          ))}
          
          {logs.status === "streaming" && (
            <div class="streaming-indicator">
              New logs incoming...
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
```

### マルチモーダル AI インターフェース

```typescript
// src/components/ai/multimodal-interface.tsx
import { useStreamText, useStream } from '@aid-on/qwiks';
import { unilmp } from '@aid-on/unilmp';
import { embersm } from '@aid-on/embersm';

export const MultimodalInterface = component$(() => {
  const currentInput = useSignal('');
  const uploadedImage = useSignal<File | null>(null);
  const context = useSignal('chat');
  
  // Memory context
  const memoryContext = useStream(() =>
    embersm.query('user', currentInput.value),
    { autoStart: false }
  );
  
  // Vision analysis (when image uploaded)
  const visionAnalysis = useStreamText(() =>
    unilmp.vision({
      provider: "groq",
      model: "llama-3.2-90b-vision",
      image: uploadedImage.value,
      prompt: "Analyze this image and describe what you see"
    }),
    { autoStart: false }
  );
  
  // Main AI response
  const response = useStreamText(() => {
    const messages = [
      { role: "system", content: "You are a helpful AI assistant." }
    ];
    
    // Add memory context if available
    if (memoryContext.value) {
      messages.push({
        role: "system",
        content: `Relevant context: ${JSON.stringify(memoryContext.value)}`
      });
    }
    
    // Add vision analysis if available
    if (visionAnalysis.text) {
      messages.push({
        role: "system", 
        content: `Image analysis: ${visionAnalysis.text}`
      });
    }
    
    messages.push({
      role: "user",
      content: currentInput.value
    });
    
    return unilmp.chat({
      provider: "groq",
      model: "llama-3.3-70b",
      messages
    });
  }, { autoStart: false });
  
  const processInput = $(async () => {
    if (!currentInput.value.trim()) return;
    
    // Start context retrieval
    if (context.value !== 'standalone') {
      await memoryContext.restart();
    }
    
    // Start vision analysis if image present
    if (uploadedImage.value) {
      await visionAnalysis.restart();
    }
    
    // Start main response (will wait for context via dependencies)
    await response.restart();
  });

  return (
    <div class="multimodal-interface">
      <div class="context-selector">
        <select bind:value={context}>
          <option value="chat">Conversational</option>
          <option value="analysis">Analysis</option>
          <option value="standalone">No Context</option>
        </select>
      </div>
      
      <div class="input-section">
        <div class="text-input">
          <textarea
            bind:value={currentInput}
            placeholder="Ask anything or describe what you want to analyze..."
            rows={3}
          />
        </div>
        
        <div class="image-input">
          <input
            type="file"
            accept="image/*"
            onChange$={(e) => {
              uploadedImage.value = e.target.files?.[0] || null;
            }}
          />
          {uploadedImage.value && (
            <div class="image-preview">
              <img src={URL.createObjectURL(uploadedImage.value)} alt="Upload preview" />
            </div>
          )}
        </div>
        
        <button 
          onClick$={processInput}
          disabled={!currentInput.value.trim()}
        >
          Process
        </button>
      </div>
      
      <div class="processing-status">
        {memoryContext.status === "streaming" && (
          <div class="status">🧠 Retrieving context...</div>
        )}
        {visionAnalysis.status === "streaming" && (
          <div class="status">👁️ Analyzing image...</div>
        )}
        {response.status === "streaming" && (
          <div class="status">🤖 Generating response...</div>
        )}
      </div>
      
      <div class="output-section">
        {memoryContext.value && (
          <div class="context-panel">
            <h4>Retrieved Context</h4>
            <pre>{JSON.stringify(memoryContext.value, null, 2)}</pre>
          </div>
        )}
        
        {visionAnalysis.text && (
          <div class="vision-panel">
            <h4>Image Analysis</h4>
            <p>{visionAnalysis.text}</p>
          </div>
        )}
        
        <div class="response-panel">
          <h4>AI Response</h4>
          <div class="response-content">
            {response.text}
            {response.status === "streaming" && (
              <span class="cursor animate-pulse">|</span>
            )}
          </div>
          
          <div class="metrics">
            Speed: {response.metrics.wordsPerSecond} WPS | 
            Length: {response.metrics.wordCount} words
          </div>
        </div>
      </div>
    </div>
  );
});
```

## 設定オプション

### ストリーム基本設定

```typescript
interface UseStreamOptions<T> {
  initialValue?: T;           // 初期値
  autoStart?: boolean;        // 自動開始（デフォルト: true）
  debug?: boolean;           // デバッグログ（デフォルト: false）
}

interface UseStreamTextOptions {
  autoStart?: boolean;        // 自動開始（デフォルト: true）
  debug?: boolean;           // デバッグログ
  processing?: {
    wordCounting?: boolean;   // リアルタイム単語数計算
    characterCounting?: boolean; // リアルタイム文字数計算
    speedTracking?: boolean;  // 生成速度追跡
  };
}

interface UseStreamArrayOptions<T> {
  initialItems?: T[];         // 初期アイテム配列
  autoStart?: boolean;        
  maxItems?: number;         // 最大保持アイテム数
  deduplication?: boolean;   // 重複除去
}
```

### SSEStream設定

```typescript
interface SSEStreamOptions {
  withCredentials?: boolean;     // 認証情報含有
  reconnectInterval?: number;    // 再接続間隔（ms）
  maxReconnectAttempts?: number; // 最大再接続試行数
  headers?: Record<string, string>; // カスタムヘッダー
  timeout?: number;             // 接続タイムアウト
  retryDelay?: number;          // 再試行遅延
  
  // イベント処理
  onOpen?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onReconnect?: () => void;
}
```

### エッジ環境設定

```typescript
interface EdgeStreamConfig {
  // Cloudflare Workers最適化
  cloudflareOptimized?: boolean;
  
  // メモリ制限対応
  maxMemoryUsage?: number;      // MB単位
  streamBufferSize?: number;    // ストリームバッファサイズ
  
  // CPU制限対応
  yieldInterval?: number;       // CPU yieldingの間隔
  batchProcessing?: boolean;    // バッチ処理モード
  
  // ネットワーク最適化
  compressionEnabled?: boolean;  // 圧縮有効化
  keepAliveTimeout?: number;    // キープアライブタイムアウト
}
```

### パフォーマンス設定

```typescript
// プロダクション最適化設定
const productionConfig: UseStreamOptions<any> = {
  autoStart: true,
  debug: false,
  processing: {
    wordCounting: false,     // 本番では無効化
    speedTracking: false,    // 本番では無効化
  }
};

// 開発時設定
const developmentConfig: UseStreamOptions<any> = {
  autoStart: true,
  debug: true,
  processing: {
    wordCounting: true,      // 開発時は有効化
    speedTracking: true,     // 開発時は有効化
  }
};

// 高負荷対応設定
const highLoadConfig: UseStreamArrayOptions<any> = {
  maxItems: 1000,          // メモリ制限
  deduplication: true,     // 重複除去でメモリ節約
  autoStart: false,        // 手動制御
};
```

## パフォーマンス考慮事項

### Qwik Signal最適化

```typescript
// 効率的なSignal更新
export function useOptimizedStream<T>(
  streamFactory: QRL<() => Stream<T>>,
  options: UseStreamOptions<T> = {}
) {
  // バッチ更新でリレンダリング最小化
  const batchedValue = useSignal<T>(options.initialValue!);
  const updateQueue = useSignal<T[]>([]);
  
  // バッチタイマー
  const flushTimer = useSignal<NodeJS.Timeout | null>(null);
  
  const flushUpdates = $(() => {
    if (updateQueue.value.length > 0) {
      batchedValue.value = updateQueue.value[updateQueue.value.length - 1];
      updateQueue.value = [];
    }
    flushTimer.value = null;
  });
  
  const queueUpdate = $((newValue: T) => {
    updateQueue.value = [...updateQueue.value, newValue];
    
    if (!flushTimer.value) {
      flushTimer.value = setTimeout(() => flushUpdates(), 16); // 60fps
    }
  });
  
  return { batchedValue, queueUpdate };
}
```

### メモリ使用量最適化

```typescript
// メモリ効率的なストリーミング
class OptimizedStreamHandler<T> {
  private buffer: T[] = [];
  private maxBufferSize = 1000;
  
  addValue(value: T) {
    this.buffer.push(value);
    
    // バッファサイズ制限
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.maxBufferSize / 2);
    }
  }
  
  getRecentValues(count: number = 10): T[] {
    return this.buffer.slice(-count);
  }
  
  clearOldValues() {
    // 古いデータのクリアアップ
    this.buffer = this.buffer.slice(-100);
  }
}

// 大量データ用ストリーミング
export function useLargeDataStream<T>(
  streamFactory: QRL<() => Stream<T>>,
  options: { maxItems?: number; windowSize?: number } = {}
) {
  const { maxItems = 10000, windowSize = 100 } = options;
  
  const items = useSignal<T[]>([]);
  const handler = new OptimizedStreamHandler<T>();
  
  const addItem = $((item: T) => {
    handler.addValue(item);
    items.value = handler.getRecentValues(windowSize);
  });
  
  return { items, addItem };
}
```

### ネットワーク最適化

```typescript
// 効率的なネットワーク使用
export function useNetworkOptimizedSSE(
  url: string,
  options: SSEStreamOptions = {}
) {
  const connectionQuality = useSignal<'high' | 'medium' | 'low'>('high');
  
  // ネットワーク品質に基づく設定調整
  const adaptiveOptions = $(() => {
    switch (connectionQuality.value) {
      case 'high':
        return { ...options, reconnectInterval: 1000 };
      case 'medium':
        return { ...options, reconnectInterval: 5000 };
      case 'low':
        return { ...options, reconnectInterval: 10000 };
      default:
        return options;
    }
  });
  
  // ネットワーク品質監視
  useVisibleTask$(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const updateQuality = () => {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') {
          connectionQuality.value = 'high';
        } else if (effectiveType === '3g') {
          connectionQuality.value = 'medium';
        } else {
          connectionQuality.value = 'low';
        }
      };
      
      connection.addEventListener('change', updateQuality);
      updateQuality();
    }
  });
  
  return useSSEStream(url, adaptiveOptions());
}
```

### エッジ環境最適化

```typescript
// Cloudflare Workers最適化
export function useEdgeOptimizedStream<T>(
  streamFactory: QRL<() => Stream<T>>
) {
  // CPU使用量制御
  const yieldCounter = useSignal(0);
  const cpuYieldThreshold = 100;
  
  const processWithYielding = $(async (handler: (value: T) => void) => {
    return new Promise<void>((resolve) => {
      const stream = streamFactory();
      
      stream.subscribe({
        next: async (value) => {
          handler(value);
          
          // CPU yielding
          yieldCounter.value++;
          if (yieldCounter.value >= cpuYieldThreshold) {
            yieldCounter.value = 0;
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        },
        complete: resolve
      });
    });
  });
  
  // メモリ監視
  const memoryUsage = useSignal(0);
  
  useVisibleTask$(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        memoryUsage.value = (performance as any).memory.usedJSHeapSize;
      }
    };
    
    const interval = setInterval(updateMemoryUsage, 1000);
    return () => clearInterval(interval);
  });
  
  return { processWithYielding, memoryUsage };
}
```
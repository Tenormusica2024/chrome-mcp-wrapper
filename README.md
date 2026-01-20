# Chrome MCP Wrapper

Claude in Chrome MCPツールのラッパーライブラリ。並行実行とOSダイアログ検出をサポートします。

## 🎯 コア機能：ログイン状態を保持したままブラウザ操作

**このプロジェクトの最大の特徴は、ユーザーの既存のログイン状態を維持したままブラウザ操作ができることです。**

### 従来の課題

| 問題 | 従来の方法 | 解決策 |
|------|----------|--------|
| ログインが必要 | Playwrightで新規ブラウザ | 既存Chromeを直接使用 |
| 2FA/CAPTCHA | 毎回突破が必要 | 1度突破すれば再利用可能 |
| セッション維持 | Cookieを複雑に管理 | 自動的に維持 |

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│  Chrome MCP Wrapper (TypeScript)                           │
│  ├── SessionManager (セッション管理)                        │
│  ├── ChromeSession (操作ラッパー)                           │
│  └── DialogDetector (異常検知)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP通信
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Chrome拡張機能 (MCP Server)                                │
│  └── 既存のChromeブラウザに直接アクセス                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  ユーザーの既存Chrome (ログイン済み)                        │
│  └── Cookie/セッションを維持したまま操作可能                   │
└─────────────────────────────────────────────────────────────┘
```

### 実現方法

1. **Chrome拡張機能を経由**: 既存のChromeに拡張機能をインストール
2. **MCPプロトコルで通信**: 拡張機能とMCPサーバーが通信
3. **既存タブを操作**: 新規ブラウザではなく、既存のタブを操作

### 参照実装

本プロジェクトは以下のオープンソース実装を参考にしています：

- [hangwin/mcp-chrome](https://github.com/hangwin/mcp-chrome) - Chrome拡張機能ベースのMCPサーバー
- [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) - Puppeteerベースの実装

## 特徴

- **ログイン状態維持**: 既存のChromeのログイン状態をそのまま使用
- **並行実行サポート**: 複数のブラウザセッションを同時に操作可能
- **OSダイアログ検出**: 定期スクリーンショットで異常を自動検知
- **セッション管理**: セッション単位でタブIDを管理
- **Claude in Chrome準拠**: 基本機能はClaude in Chromeと同等

## インストール

```bash
npm install chrome-mcp-wrapper
```

## 使用方法

### 基本的な使用方法

```typescript
import { SessionManager } from 'chrome-mcp-wrapper';

// セッションマネージャーを作成
const manager = new SessionManager();

// セッションを作成
const session = manager.createSession('my-task');

// ページをナビゲート
await session.navigate('https://example.com');

// 要素をクリック
await session.click('@submit-button');

// フォームに入力
await session.fill('input[name="email"]', 'user@example.com');
```

### 並行実行

```typescript
// 複数セッションを作成
const session1 = manager.createSession('task1');
const session2 = manager.createSession('task2');

// 並行実行
await Promise.all([
  session1.navigate('https://example.com'),
  session2.navigate('https://google.com')
]);

// または runParallel を使用
const results = await manager.runParallel([
  async (session) => {
    await session.navigate('https://example.com');
    return 'Task 1 completed';
  },
  async (session) => {
    await session.navigate('https://google.com');
    return 'Task 2 completed';
  }
]);
```

### OSダイアログ検出

```typescript
import { DialogDetector } from 'chrome-mcp-wrapper';

// ダイアログ検出器を作成
const detector = new DialogDetector({
  screenshotInterval: 5000,  // 5秒間隔
  diffThreshold: 0.1,        // 10%以上の変化を検出
});

// 検出を開始
detector.startMonitoring((result) => {
  if (result.detected) {
    console.log('Dialog detected!', result.screenshotPath);
  }
});

try {
  // ダイアログ検出付きで操作を実行
  await session.withDialogDetection(async () => {
    await session.click('@submit-button');
    // OSダイアログが出たら自動検知
  });
} finally {
  // 検出を停止
  await detector.stopMonitoring();
}
```

### 高度な使用方法

```typescript
// 指定したセッションで並行実行
const results = await manager.runParallelWithSessions(
  ['session1', 'session2'],
  [
    async (session1) => {
      await session1.navigate('https://example.com');
      return { status: 'done' };
    },
    async (session2) => {
      await session2.navigate('https://google.com');
      return { status: 'done' };
    }
  ]
);

// ページ情報を読み取り
const pageData = await session.readPage('interactive');

// JavaScriptを実行
const result = await session.evaluate('document.title');

// コンソールログを取得
const logs = await session.readConsoleMessages('error|warning');

// スクリーンショットを撮影
const screenshot = await session.screenshot({ fullPage: true });
```

## API

### SessionManager

```typescript
class SessionManager {
  // 新規セッションを作成
  createSession(name?: string): ChromeSession;

  // セッションを取得
  getSession(name: string): ChromeSession | null;

  // セッションを削除
  removeSession(name: string): void;

  // 全セッションを取得
  getAllSessions(): Map<string, ChromeSession>;

  // セッション数を取得
  getSessionCount(): number;

  // 並行実行
  async runParallel<T>(
    tasks: Array<(session: ChromeSession) => Promise<T>>
  ): Promise<T[]>;

  // 指定セッションで並行実行
  async runParallelWithSessions<T>(
    sessionNames: string[],
    tasks: Array<(session: ChromeSession) => Promise<T>>
  ): Promise<T[]>;

  // 全セッションをクリア
  clearAll(): void;
}
```

### ChromeSession

```typescript
class ChromeSession {
  // セッションIDを取得
  getSessionId(): string;

  // タブIDを取得
  getTabId(): number | null;

  // タブIDを設定
  setTabId(tabId: number): void;

  // ページをナビゲート
  async navigate(url: string): Promise<void>;

  // 要素をクリック
  async click(selector: string | { x: number; y: number }): Promise<void>;

  // フォームに入力
  async fill(selector: string, value: string): Promise<void>;

  // スクリーンショットを撮影
  async screenshot(options?: ScreenshotOptions): Promise<Buffer>;

  // JavaScriptを実行
  async evaluate(code: string): Promise<any>;

  // ページを読み取り
  async readPage(filter?: 'interactive' | 'all'): Promise<any>;

  // ダイアログ検出付き操作
  async withDialogDetection<T>(fn: () => Promise<T>): Promise<T>;

  // 要素を検索
  async find(query: string): Promise<any[]>;

  // ページのテキストを取得
  async getPageText(): Promise<string>;

  // ウィンドウサイズを変更
  async resizeWindow(width: number, height: number): Promise<void>;

  // コンソールメッセージを読み取り
  async readConsoleMessages(pattern?: string): Promise<any[]>;

  // ネットワークリクエストを読み取り
  async readNetworkRequests(urlPattern?: string): Promise<any[]>;
}
```

### DialogDetector

```typescript
class DialogDetector {
  constructor(options?: DialogDetectionOptions);

  // 監視を開始
  async startMonitoring(
    callback: (result: DialogDetectionResult) => void
  ): Promise<void>;

  // 監視を停止
  async stopMonitoring(): Promise<void>;

  // 監視中か確認
  isMonitoring(): boolean;

  // スクリーンショット間隔を設定
  setScreenshotInterval(interval: number): void;

  // 差分閾値を設定
  setDiffThreshold(threshold: number): void;
}
```

## 開発

```bash
# ビルド
npm run build

# ウォッチモード
npm run watch

# テスト
npm run test
```

## 注意事項

- 現在は基本構造の実装完了です
- Claude in Chrome MCPサーバーとの通信はダミー実装です
- 実際の使用にはMCP SDKの統合が必要です

## ライセンス

MIT

## 貢献

プルリクエストをお待ちしています！

/**
 * Chrome MCP Wrapper - エントリーポイント
 *
 * Claude in Chrome MCPツールのラッパーを提供する
 * 並行実行とOSダイアログ検出をサポート
 */

import { SessionManager } from './session/SessionManager';
import { ChromeSession } from './session/ChromeSession';
import { DialogDetector } from './dialog/DialogDetector';
import { ChromeMCPClient, mcpClient } from './mcp/tools';

// クラスとインターフェースをエクスポート
export {
  SessionManager,
  ChromeSession,
  DialogDetector,
  ChromeMCPClient,
  mcpClient,
};

// 型定義をエクスポート
export type {
  ScreenshotOptions,
  Coordinate,
} from './session/ChromeSession';

export type {
  DialogDetectionOptions,
  DialogDetectionResult,
} from './dialog/DialogDetector';

export type {
  MCPToolResult,
} from './mcp/tools';

/**
 * デフォルトエクスポート
 */
export default {
  SessionManager,
  ChromeSession,
  DialogDetector,
  ChromeMCPClient,
  mcpClient,
};

/**
 * 使用例
 *
 * ```typescript
 * import { SessionManager } from 'chrome-mcp-wrapper';
 *
 * // セッションマネージャーを作成
 * const manager = new SessionManager();
 *
 * // 複数セッションを作成
 * const session1 = manager.createSession('main-task');
 * const session2 = manager.createSession('side-task');
 *
 * // 並行実行
 * await Promise.all([
 *   session1.navigate('https://example.com'),
 *   session2.navigate('https://google.com')
 * ]);
 *
 * // ダイアログ検出付き操作
 * await session1.withDialogDetection(async () => {
 *   await session1.click('@submit-button');
 * });
 * ```
 */

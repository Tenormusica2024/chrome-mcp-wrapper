/**
 * MCPツール定義
 *
 * Claude in Chrome MCPツールの定義とラッパー関数
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Claude in Chrome MCPツール名
 *
 * mcp__claude-in-chrome__ プレフィックス付きのツール名
 */
export enum ChromeMCPTool {
  // タブ管理
  TABS_CONTEXT = 'mcp__claude-in-chrome__tabs_context_mcp',
  TABS_CREATE = 'mcp__claude-in-chrome__tabs_create_mcp',

  // ナビゲーション
  NAVIGATE = 'mcp__claude-in-chrome__navigate',

  // 操作
  COMPUTER = 'mcp__claude-in-chrome__computer',
  CLICK = 'mcp__claude-in-chrome__computer',  // clickはcomputer toolのactionとして使用
  FORM_INPUT = 'mcp__claude-in-chrome__form_input',

  // 情報取得
  READ_PAGE = 'mcp__claude-in-chrome__read_page',
  GET_PAGE_TEXT = 'mcp__claude-in-chrome__get_page_text',
  FIND = 'mcp__claude-in-chrome__find',

  // スクリーンショット
  SCREENSHOT = 'mcp__claude-in-chrome__computer',  // screenshotはcomputer toolのactionとして使用

  // JavaScript実行
  JAVASCRIPT_TOOL = 'mcp__claude-in-chrome__javascript_tool',

  // ウィンドウ操作
  RESIZE_WINDOW = 'mcp__claude-in-chrome__resize_window',

  // ログ取得
  READ_CONSOLE_MESSAGES = 'mcp__claude-in-chrome__read_console_messages',
  READ_NETWORK_REQUESTS = 'mcp__claude-in-chrome__read_network_requests',

  // ショートカット
  SHORTCUTS_LIST = 'mcp__claude-in-chrome__shortcuts_list',
  SHORTCUTS_EXECUTE = 'mcp__claude-in-chrome__shortcuts_execute',

  // GIF録画
  GIF_CREATOR = 'mcp__claude-in-chrome__gif_creator',
  UPLOAD_IMAGE = 'mcp__claude-in-chrome__upload_image',
}

/**
 * MCPツール呼び出しの結果
 */
export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * MCPクライアントクラス
 *
 * Claude in Chrome MCPサーバーと通信してツールを実行する
 *
 * mcp-chromeの実装を参考に、StreamableHTTPClientTransportを使用
 */
export class ChromeMCPClient {
  private serverUrl: string;
  private client: Client | null = null;
  private isConnected: boolean = false;

  constructor(serverUrl: string = 'http://127.0.0.1:12306/mcp') {
    this.serverUrl = serverUrl;
  }

  /**
   * MCPサーバーに接続
   */
  private async ensureConnection(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      // MCPクライアントを作成
      this.client = new Client(
        { name: 'chrome-mcp-wrapper', version: '1.0.0' },
        { capabilities: {} }
      );

      // StreamableHTTPトランスポートで接続
      const transport = new StreamableHTTPClientTransport(
        new URL(this.serverUrl),
        {}
      );

      await this.client.connect(transport);
      this.isConnected = true;
      console.log(`Connected to MCP server at ${this.serverUrl}`);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * MCPツールを呼び出す
   * @param toolName - ツール名
   * @param params - パラメータ
   * @returns 結果
   */
  async callTool(toolName: ChromeMCPTool, params: any = {}): Promise<MCPToolResult> {
    try {
      await this.ensureConnection();

      if (!this.client) {
        throw new Error('MCP client is not initialized');
      }

      console.log(`Calling MCP tool: ${toolName} with params:`, params);

      // MCP SDKのcallToolを使用
      // タイムアウトは2分に設定
      const result = await this.client.callTool(
        { name: toolName, arguments: params },
        undefined,
        { timeout: 2 * 60 * 1000 }
      );

      // CallToolResultからデータを抽出
      const callResult = result as CallToolResult;

      if (callResult.isError) {
        return {
          success: false,
          error: `Tool execution failed: ${JSON.stringify(callResult.content)}`,
        };
      }

      // contentからテキストデータを抽出
      const textContent = callResult.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('\n');

      return {
        success: true,
        data: textContent || callResult.content,
      };
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 接続を閉じる
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      console.log('Disconnected from MCP server');
    }
  }

  /**
   * ページをナビゲート
   * @param url - URL
   * @param tabId - タブID
   */
  async navigate(url: string, tabId?: number): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.NAVIGATE, { url, tabId });
  }

  /**
   * 要素をクリック
   * @param tabId - タブID
   * @param coordinate - 座標または要素参照
   */
  async click(tabId: number, coordinate: { x: number; y: number } | string): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.CLICK, { tabId, coordinate });
  }

  /**
   * フォームに入力
   * @param tabId - タブID
   * @param ref - 要素参照
   * @param value - 値
   */
  async fill(tabId: number, ref: string, value: string): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.FORM_INPUT, { tabId, ref, value });
  }

  /**
   * スクリーンショットを撮影
   * @param tabId - タブID
   * @param options - オプション
   */
  async screenshot(tabId: number, options?: { fullPage?: boolean }): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.SCREENSHOT, { tabId, ...options });
  }

  /**
   * JavaScriptを実行
   * @param tabId - タブID
   * @param code - JavaScriptコード
   */
  async evaluate(tabId: number, code: string): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.JAVASCRIPT_TOOL, { tabId, text: code });
  }

  /**
   * ページを読み取り
   * @param tabId - タブID
   * @param filter - フィルタ
   */
  async readPage(tabId: number, filter?: 'interactive' | 'all'): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.READ_PAGE, { tabId, filter });
  }

  /**
   * タブコンテキストを取得
   */
  async getTabsContext(): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.TABS_CONTEXT);
  }

  /**
   * 新規タブを作成
   */
  async createTab(): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.TABS_CREATE);
  }

  /**
   * 要素を検索
   * @param tabId - タブID
   * @param query - 検索クエリ
   */
  async find(tabId: number, query: string): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.FIND, { tabId, query });
  }

  /**
   * ウィンドウサイズを変更
   * @param tabId - タブID
   * @param width - 幅
   * @param height - 高さ
   */
  async resizeWindow(tabId: number, width: number, height: number): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.RESIZE_WINDOW, { tabId, width, height });
  }

  /**
   * コンソールメッセージを読み取り
   * @param tabId - タブID
   * @param pattern - パターン
   */
  async readConsoleMessages(tabId: number, pattern?: string): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.READ_CONSOLE_MESSAGES, { tabId, pattern });
  }

  /**
   * ネットワークリクエストを読み取り
   * @param tabId - タブID
   * @param urlPattern - URLパターン
   */
  async readNetworkRequests(tabId: number, urlPattern?: string): Promise<MCPToolResult> {
    return this.callTool(ChromeMCPTool.READ_NETWORK_REQUESTS, { tabId, urlPattern });
  }
}

// デフォルトのMCPクライアントインスタンス
export const mcpClient = new ChromeMCPClient();

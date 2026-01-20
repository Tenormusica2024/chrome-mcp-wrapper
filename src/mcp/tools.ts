/**
 * MCPツール定義
 *
 * Claude in Chrome MCPツールの定義とラッパー関数
 */

// TODO: MCP SDKの型定義を追加
// import { Tool } from '@modelcontextprotocol/sdk';

/**
 * Claude in Chrome MCPツール名
 */
export enum ChromeMCPTool {
  // タブ管理
  TABS_CONTEXT = 'tabs_context_mcp',
  TABS_CREATE = 'tabs_create_mcp',

  // ナビゲーション
  NAVIGATE = 'navigate',

  // 操作
  COMPUTER = 'computer',
  CLICK = 'click',
  FORM_INPUT = 'form_input',

  // 情報取得
  READ_PAGE = 'read_page',
  GET_PAGE_TEXT = 'get_page_text',
  FIND = 'find',

  // スクリーンショット
  SCREENSHOT = 'screenshot',

  // JavaScript実行
  JAVASCRIPT_TOOL = 'javascript_tool',

  // ウィンドウ操作
  RESIZE_WINDOW = 'resize_window',

  // ログ取得
  READ_CONSOLE_MESSAGES = 'read_console_messages',
  READ_NETWORK_REQUESTS = 'read_network_requests',

  // ショートカット
  SHORTCUTS_LIST = 'shortcuts_list',
  SHORTCUTS_EXECUTE = 'shortcuts_execute',

  // GIF録画
  GIF_CREATOR = 'gif_creator',
  UPLOAD_IMAGE = 'upload_image',
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
 */
export class ChromeMCPClient {
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  /**
   * MCPツールを呼び出す
   * @param toolName - ツール名
   * @param params - パラメータ
   * @returns 結果
   */
  async callTool(toolName: ChromeMCPTool, params: any = {}): Promise<MCPToolResult> {
    try {
      // TODO: MCP SDKを使用してClaude in Chrome MCPサーバーと通信
      console.log(`Calling MCP tool: ${toolName} with params:`, params);

      // 現在はダミー実装
      return {
        success: true,
        data: null,
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

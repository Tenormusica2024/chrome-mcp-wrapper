/**
 * テスト用簡易MCPサーバー
 *
 * ChromeMCPClientの動作確認用のシンプルなMCPサーバー
 *
 * 起動方法:
 * npx tsx test-server.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

// ツールスキーマ定義
const TOOL_SCHEMAS = [
  {
    name: 'mcp__claude-in-chrome__navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
        tabId: { type: 'number', description: 'Tab ID' },
      },
      required: ['url'],
    },
  },
  {
    name: 'mcp__claude-in-chrome__computer',
    description: 'Perform computer actions (click, screenshot, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action to perform' },
        tabId: { type: 'number', description: 'Tab ID' },
      },
    },
  },
  {
    name: 'mcp__claude-in-chrome__read_page',
    description: 'Read page content',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Tab ID' },
        filter: { type: 'string', description: 'Filter type' },
      },
    },
  },
  {
    name: 'mcp__claude-in-chrome__tabs_context_mcp',
    description: 'Get tabs context',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * ツール実行ハンドラー
 */
async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
  console.error(`[Test Server] Tool called: ${name}`, args);

  // テスト用のダミーレスポンスを返す
  const responses: Record<string, any> = {
    'mcp__claude-in-chrome__navigate': {
      content: [
        {
          type: 'text',
          text: `Navigated to: ${args.url}\nTest server mock response - navigation successful`,
        },
      ],
    },
    'mcp__claude-in-chrome__computer': {
      content: [
        {
          type: 'text',
          text: `Action: ${args.action || 'screenshot'}\nTest server mock response - action completed`,
        },
      ],
    },
    'mcp__claude-in-chrome__read_page': {
      content: [
        {
          type: 'text',
          text: `Tab ID: ${args.tabId}\nTest server mock response - page content:\n<html><body><h1>Test Page</h1></body></html>`,
        },
      ],
    },
    'mcp__claude-in-chrome__tabs_context_mcp': {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            tabId: 12345,
            url: 'https://example.com',
            title: 'Test Page',
          }, null, 2),
        },
      ],
    },
  };

  const response = responses[name];
  if (response) {
    return response;
  }

  // 未知のツールの場合
  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}\nArgs: ${JSON.stringify(args, null, 2)}`,
      },
    ],
    isError: false,
  };
}

/**
 * メイン関数
 */
async function main() {
  console.error('[Test Server] Starting MCP test server...');

  // MCPサーバー作成
  const server = new Server(
    {
      name: 'TestMCPServer',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ListToolsハンドラー設定
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOL_SCHEMAS };
  });

  // CallToolハンドラー設定
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return handleToolCall(request.params.name, request.params.arguments || {});
  });

  // Stdioトランスポートで接続
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[Test Server] MCP test server is running (stdio mode)');
  console.error('[Test Server] Available tools:', TOOL_SCHEMAS.map(t => t.name).join(', '));
}

main().catch((error) => {
  console.error('[Test Server] Fatal error:', error);
  process.exit(1);
});

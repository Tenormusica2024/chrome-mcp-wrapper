/**
 * ChromeMCPClientのテストスクリプト
 *
 * 実行前にClaude in Chrome拡張機能が起動していて、
 * MCPサーバーが http://127.0.0.1:12306/mcp で待機している必要があります。
 *
 * 起動方法:
 * npx tsx test-client.ts
 */

import { ChromeMCPClient } from './dist/mcp/tools.js';
import { SessionManager } from './dist/session/SessionManager.js';

/**
 * 基本的なツール呼び出しテスト
 */
async function testBasicToolCalls() {
  console.log('\n=== 基本的なツール呼び出しテスト ===\n');

  const client = new ChromeMCPClient();

  try {
    // タブコンテキスト取得
    console.log('1. タブコンテキスト取得...');
    const contextResult = await client.getTabsContext();
    console.log('Result:', contextResult.success ? '✅ 成功' : '❌ 失敗');
    if (contextResult.data) {
      console.log('Data:', contextResult.data);
    }

    // ナビゲート（テスト用URL）
    console.log('\n2. ページナビゲート...');
    const navResult = await client.navigate('https://example.com');
    console.log('Result:', navResult.success ? '✅ 成功' : '❌ 失敗');
    if (navResult.error) {
      console.log('Error:', navResult.error);
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await client.close();
  }
}

/**
 * セッション管理テスト
 */
async function testSessionManager() {
  console.log('\n=== セッション管理テスト ===\n');

  const manager = new SessionManager();

  try {
    // セッション作成
    console.log('1. セッション作成...');
    const session1 = manager.createSession('test-session-1');
    console.log('Session created:', session1.getSessionId());

    const session2 = manager.createSession('test-session-2');
    console.log('Session created:', session2.getSessionId());

    // 並行実行テスト
    console.log('\n2. 並行実行テスト...');
    const results = await manager.runParallel([
      async (session) => {
        console.log(`  Task 1: ${session.getSessionId()}`);
        return 'Task 1 completed';
      },
      async (session) => {
        console.log(`  Task 2: ${session.getSessionId()}`);
        return 'Task 2 completed';
      },
    ]);

    console.log('Parallel results:', results);

    // セッション削除
    console.log('\n3. セッション削除...');
    manager.removeSession('test-session-1');
    console.log('Session removed');

  } catch (error) {
    console.error('Test error:', error);
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log('🚀 ChromeMCPClient テスト開始\n');
  console.log('注意: このテストを実行するには、Claude in Chrome拡張機能が起動している必要があります。');
  console.log('MCPサーバーURL: http://127.0.0.1:12306/mcp\n');

  try {
    // 基本的なツール呼び出しテスト
    await testBasicToolCalls();

    // セッション管理テスト（MCPサーバーなしで実行可能）
    await testSessionManager();

    console.log('\n✅ テスト完了');

  } catch (error) {
    console.error('\n❌ テスト失敗:', error);
    process.exit(1);
  }
}

main();

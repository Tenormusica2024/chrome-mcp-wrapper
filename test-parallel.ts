/**
 * 並行実行テストスクリプト
 *
 * SessionManagerの並行実行機能を検証します
 *
 * 起動方法:
 * npx tsx test-parallel.ts
 */

import { SessionManager } from './dist/session/SessionManager.js';

/**
 * シンプルな遅延関数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 並行実行テスト1: 基本的な並行実行
 */
async function testBasicParallel() {
  console.log('\n=== テスト1: 基本的な並行実行 ===\n');

  const manager = new SessionManager();

  const startTime = Date.now();

  // 3つのタスクを並行実行
  const results = await manager.runParallel([
    async (session) => {
      console.log(`  Task 1 started: ${session.getSessionId()}`);
      await delay(1000);
      console.log(`  Task 1 completed`);
      return 'Task 1 result';
    },
    async (session) => {
      console.log(`  Task 2 started: ${session.getSessionId()}`);
      await delay(1500);
      console.log(`  Task 2 completed`);
      return 'Task 2 result';
    },
    async (session) => {
      console.log(`  Task 3 started: ${session.getSessionId()}`);
      await delay(800);
      console.log(`  Task 3 completed`);
      return 'Task 3 result';
    },
  ]);

  const elapsed = Date.now() - startTime;

  console.log(`\nResults:`, results);
  console.log(`Elapsed time: ${elapsed}ms`);

  // 並行実行なら最長のタスク(1500ms) + αで完了するはず
  if (elapsed < 2000) {
    console.log('✅ 並行実行成功 (時間から判断)');
  } else {
    console.log('❌ 並行実行失敗 (直列実行の可能性)');
  }

  return results;
}

/**
 * 並行実行テスト2: セッション単位の並行実行
 */
async function testParallelWithSessions() {
  console.log('\n=== テスト2: セッション単位の並行実行 ===\n');

  const manager = new SessionManager();

  // 明示的にセッション名を指定して並行実行
  const results = await manager.runParallelWithSessions(
    ['session-A', 'session-B', 'session-C'],
    [
      async (sessionA) => {
        console.log(`  Session A task: ${sessionA.getSessionId()}`);
        await delay(500);
        return { session: 'A', value: 100 };
      },
      async (sessionB) => {
        console.log(`  Session B task: ${sessionB.getSessionId()}`);
        await delay(700);
        return { session: 'B', value: 200 };
      },
      async (sessionC) => {
        console.log(`  Session C task: ${sessionC.getSessionId()}`);
        await delay(600);
        return { session: 'C', value: 300 };
      },
    ]
  );

  console.log(`\nResults:`, results);

  // セッションが正しく作成されているか確認
  const sessionA = manager.getSession('session-A');
  const sessionB = manager.getSession('session-B');
  const sessionC = manager.getSession('session-C');

  if (sessionA && sessionB && sessionC) {
    console.log('✅ セッション作成成功');
    console.log(`  Session IDs: ${sessionA.getSessionId()}, ${sessionB.getSessionId()}, ${sessionC.getSessionId()}`);
  } else {
    console.log('❌ セッション作成失敗');
  }

  return results;
}

/**
 * 並行実行テスト3: タブID管理
 */
async function testTabIdManagement() {
  console.log('\n=== テスト3: タブID管理 ===\n');

  const manager = new SessionManager();

  // セッションを作成してタブIDを設定
  const session1 = manager.createSession('tab-test-1');
  const session2 = manager.createSession('tab-test-2');

  console.log(`Session 1 ID: ${session1.getSessionId()}`);
  console.log(`Session 2 ID: ${session2.getSessionId()}`);

  // タブIDを設定
  session1.setTabId(12345);
  session2.setTabId(67890);

  console.log(`\nSession 1 TabID: ${session1.getTabId()}`);
  console.log(`Session 2 TabID: ${session2.getTabId()}`);

  // 並行実行でタブIDが正しく保持されているか確認
  await manager.runParallelWithSessions(
    ['tab-test-1', 'tab-test-2'],
    [
      async (session) => {
        const tabId = session.getTabId();
        console.log(`  Task 1 sees TabID: ${tabId} (expected: 12345)`);
        return tabId === 12345;
      },
      async (session) => {
        const tabId = session.getTabId();
        console.log(`  Task 2 sees TabID: ${tabId} (expected: 67890)`);
        return tabId === 67890;
      },
    ]
  );

  const tabId1Correct = session1.getTabId() === 12345;
  const tabId2Correct = session2.getTabId() === 67890;

  if (tabId1Correct && tabId2Correct) {
    console.log('\n✅ タブID管理成功');
  } else {
    console.log('\n❌ タブID管理失敗');
  }
}

/**
 * 並行実行テスト4: エラーハンドリング
 */
async function testErrorHandling() {
  console.log('\n=== テスト4: エラーハンドリング ===\n');

  const manager = new SessionManager();

  try {
    // 1つのタスクがエラーになる並行実行
    const results = await manager.runParallel([
      async (session) => {
        console.log(`  Task 1: 正常タスク`);
        await delay(500);
        return 'Task 1 success';
      },
      async (session) => {
        console.log(`  Task 2: エラータスク`);
        await delay(300);
        throw new Error('Task 2 error');
      },
      async (session) => {
        console.log(`  Task 3: 正常タスク`);
        await delay(400);
        return 'Task 3 success';
      },
    ]);

    console.log(`\nResults:`, results);

    // Promise.allの挙動なので1つでもエラーなら全体がエラーになるはず
    console.log('Note: 1つでもエラーがあると全体が失敗します（Promise.allの挙動）');

  } catch (error) {
    console.log(`\nExpected error caught: ${error}`);
    console.log('✅ エラーハンドリング成功');
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log('🚀 並行実行テスト開始\n');

  try {
    // テスト1: 基本的な並行実行
    await testBasicParallel();

    // テスト2: セッション単位の並行実行
    await testParallelWithSessions();

    // テスト3: タブID管理
    await testTabIdManagement();

    // テスト4: エラーハンドリング
    await testErrorHandling();

    console.log('\n✅ 全テスト完了');

  } catch (error) {
    console.error('\n❌ テスト失敗:', error);
    process.exit(1);
  }
}

main();

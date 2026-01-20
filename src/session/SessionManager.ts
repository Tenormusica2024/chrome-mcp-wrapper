/**
 * SessionManager - 複数ブラウザセッションの管理クラス
 *
 * 複数のChromeSessionを管理し、並行実行をサポートする
 */

import { ChromeSession } from './ChromeSession';

/**
 * SessionManagerクラス
 *
 * 複数のブラウザセッション（タブ）を管理し、並行実行を可能にする
 * セッション名とChromeSessionインスタンスのマッピングを保持する
 */
export class SessionManager {
  private sessions: Map<string, ChromeSession> = new Map();
  private sessionCounter: number = 0;

  /**
   * 新規セッションを作成
   * @param name - セッション名（省略時は自動採番）
   * @returns ChromeSessionインスタンス
   */
  createSession(name?: string): ChromeSession {
    const sessionId = name || `session-${this.sessionCounter++}`;

    if (this.sessions.has(sessionId)) {
      throw new Error(`Session "${sessionId}" already exists`);
    }

    const session = new ChromeSession(sessionId);
    this.sessions.set(sessionId, session);

    console.log(`Session "${sessionId}" created`);
    return session;
  }

  /**
   * セッションを取得
   * @param name - セッション名
   * @returns ChromeSessionインスタンス（存在しない場合はnull）
   */
  getSession(name: string): ChromeSession | null {
    return this.sessions.get(name) || null;
  }

  /**
   * セッションを削除
   * @param name - セッション名
   */
  removeSession(name: string): void {
    const deleted = this.sessions.delete(name);
    if (deleted) {
      console.log(`Session "${name}" removed`);
    } else {
      console.warn(`Session "${name}" not found`);
    }
  }

  /**
   * 全セッションを取得
   * @returns 全セッションのマップ
   */
  getAllSessions(): Map<string, ChromeSession> {
    return new Map(this.sessions);
  }

  /**
   * セッション数を取得
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 複数のタスクを並行実行
   * @param tasks - タスク配列（各タスクはChromeSessionを受け取る関数）
   * @returns 各タスクの結果の配列
   */
  async runParallel<T>(
    tasks: Array<(session: ChromeSession) => Promise<T>>
  ): Promise<T[]> {
    console.log(`Running ${tasks.length} tasks in parallel...`);

    // 各タスクに一時的なセッションを割り当てて実行
    const results = await Promise.all(
      tasks.map(async (task, index) => {
        const session = this.createSession(`parallel-${index}`);
        try {
          return await task(session);
        } finally {
          // 並行実行用の一時セッションを削除
          this.removeSession(session.getSessionId());
        }
      })
    );

    console.log(`All parallel tasks completed`);
    return results;
  }

  /**
   * 指定したセッションでタスクを並行実行
   * @param sessionNames - 使用するセッション名の配列
   * @param tasks - タスク配列（各タスクはChromeSessionを受け取る関数）
   * @returns 各タスクの結果の配列
   */
  async runParallelWithSessions<T>(
    sessionNames: string[],
    tasks: Array<(session: ChromeSession) => Promise<T>>
  ): Promise<T[]> {
    if (sessionNames.length !== tasks.length) {
      throw new Error(
        `Number of sessions (${sessionNames.length}) must match number of tasks (${tasks.length})`
      );
    }

    console.log(`Running ${tasks.length} tasks in parallel with specified sessions...`);

    const results = await Promise.all(
      tasks.map(async (task, index) => {
        const sessionName = sessionNames[index];
        let session = this.getSession(sessionName);

        if (!session) {
          session = this.createSession(sessionName);
        }

        return await task(session);
      })
    );

    console.log(`All parallel tasks completed`);
    return results;
  }

  /**
   * 全セッションをクリア
   */
  clearAll(): void {
    this.sessions.clear();
    this.sessionCounter = 0;
    console.log('All sessions cleared');
  }
}

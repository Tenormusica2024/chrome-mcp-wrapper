/**
 * DialogDetector - OSダイアログ検出クラス
 *
 * 定期的なスクリーンショットでOSダイアログ出現を検知する
 * ai-screen-capture-toolsと統合して実装
 */

export interface DialogDetectionOptions {
  /**
   * スクリーンショットの間隔（ミリ秒）
   * デフォルト: 5000ms (5秒)
   */
  screenshotInterval?: number;

  /**
   * 画像差分の閾値（0-1）
   * デフォルト: 0.1 (10%以上の変化があればダイアログとみなす)
   */
  diffThreshold?: number;

  /**
   * スクリーンショット保存先ディレクトリ
   * デフォルト: ./screenshots
   */
  screenshotDir?: string;
}

/**
 * ダイアログ検出結果
 */
export interface DialogDetectionResult {
  /**
   * ダイアログが検出されたか
   */
  detected: boolean;

  /**
   * 検出時のスクリーンショットパス
   */
  screenshotPath?: string;

  /**
   * 検出時刻
   */
  timestamp: Date;
}

/**
 * DialogDetectorクラス
 *
 * OSダイアログの検出を行うクラス
 * 定期的なスクリーンショットと画像差分検出を使用
 */
export class DialogDetector {
  private screenshotInterval: number;
  private diffThreshold: number;
  private screenshotDir: string;
  private monitoring: boolean = false;
  private monitorTimer: NodeJS.Timeout | null = null;
  private previousScreenshot: Buffer | null = null;
  private detectionCallback: ((result: DialogDetectionResult) => void) | null = null;

  constructor(options?: DialogDetectionOptions) {
    this.screenshotInterval = options?.screenshotInterval || 5000;
    this.diffThreshold = options?.diffThreshold || 0.1;
    this.screenshotDir = options?.screenshotDir || './screenshots';
  }

  /**
   * ダイアログ検出の監視を開始
   * @param callback - 検出時のコールバック関数
   */
  async startMonitoring(callback: (result: DialogDetectionResult) => void): Promise<void> {
    if (this.monitoring) {
      console.warn('Dialog detection monitoring is already running');
      return;
    }

    this.monitoring = true;
    this.detectionCallback = callback;
    this.previousScreenshot = await this.takeScreenshot();

    console.log(`Dialog detection monitoring started (interval: ${this.screenshotInterval}ms)`);

    // 定期的なスクリーンショットで監視
    this.monitorTimer = setInterval(async () => {
      await this.checkForDialog();
    }, this.screenshotInterval);
  }

  /**
   * ダイアログ検出の監視を停止
   */
  async stopMonitoring(): Promise<void> {
    if (!this.monitoring) {
      console.warn('Dialog detection monitoring is not running');
      return;
    }

    this.monitoring = false;

    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }

    this.previousScreenshot = null;
    this.detectionCallback = null;

    console.log('Dialog detection monitoring stopped');
  }

  /**
   * スクリーンショットを撮影
   * @returns スクリーンショットのBuffer
   */
  private async takeScreenshot(): Promise<Buffer> {
    // TODO: ai-screen-capture-toolsのMCPツールを呼び出し
    // 現在はダミーのBufferを返す
    console.log('Taking screenshot...');
    return Buffer.from('');
  }

  /**
   * ダイアログの検出を実行
   */
  private async checkForDialog(): Promise<void> {
    try {
      const currentScreenshot = await this.takeScreenshot();

      if (this.previousScreenshot) {
        const hasDialog = this.detectDialog(this.previousScreenshot, currentScreenshot);

        if (hasDialog) {
          const screenshotPath = await this.saveScreenshot(currentScreenshot);
          const result: DialogDetectionResult = {
            detected: true,
            screenshotPath,
            timestamp: new Date(),
          };

          console.log(`Dialog detected! Screenshot saved: ${screenshotPath}`);

          if (this.detectionCallback) {
            this.detectionCallback(result);
          }
        }
      }

      this.previousScreenshot = currentScreenshot;
    } catch (error) {
      console.error('Error during dialog detection:', error);
    }
  }

  /**
   * 2つのスクリーンショットの差分からダイアログを検出
   * @param prev - 前回のスクリーンショット
   * @param current - 現在のスクリーンショット
   * @returns ダイアログが検出されたか
   */
  private detectDialog(prev: Buffer, current: Buffer): boolean {
    // TODO: 画像差分アルゴリズムを実装
    // 現在は簡易的なサイズ比較のみ

    const prevSize = prev.length;
    const currentSize = current.length;
    const sizeDiff = Math.abs(prevSize - currentSize) / Math.max(prevSize, currentSize);

    // サイズが大きく変化した場合はダイアログの可能性
    if (sizeDiff > this.diffThreshold) {
      console.log(`Size diff detected: ${(sizeDiff * 100).toFixed(1)}%`);
      return true;
    }

    // TODO: より高度な画像差分検出
    // - ピクセルごとの比較
    // - 新しいウィンドウ/ダイアログの検出
    // - 画像認識によるダイアログ特定

    return false;
  }

  /**
   * スクリーンショットを保存
   * @param screenshot - スクリーンショットのBuffer
   * @returns 保存先パス
   */
  private async saveScreenshot(screenshot: Buffer): Promise<string> {
    // TODO: ファイルシステムに保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dialog-detected-${timestamp}.png`;
    const filepath = `${this.screenshotDir}/${filename}`;

    console.log(`Screenshot saved to: ${filepath}`);
    return filepath;
  }

  /**
   * 監視中か確認
   */
  isMonitoring(): boolean {
    return this.monitoring;
  }

  /**
   * スクリーンショット間隔を設定
   * @param interval - 間隔（ミリ秒）
   */
  setScreenshotInterval(interval: number): void {
    this.screenshotInterval = interval;

    // 監視中の場合は再起動
    if (this.monitoring && this.detectionCallback) {
      this.stopMonitoring();
      this.startMonitoring(this.detectionCallback);
    }
  }

  /**
   * 差分閾値を設定
   * @param threshold - 閾値（0-1）
   */
  setDiffThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this.diffThreshold = threshold;
  }
}

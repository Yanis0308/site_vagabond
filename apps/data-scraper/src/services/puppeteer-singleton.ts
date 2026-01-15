import { createRequire } from "node:module";

import type { Browser } from "puppeteer";

const require = createRequire(import.meta.url);
const puppeteer =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- puppeteer-extra bad support for ESM
  require("puppeteer-extra") as typeof import("puppeteer-extra").default;
const AdblockerPlugin =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- puppeteer-extra-plugin-adblocker bad support for ESM
  require("puppeteer-extra-plugin-adblocker") as typeof import("puppeteer-extra-plugin-adblocker").default;
const StealthPlugin =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- puppeteer-extra-plugin-stealth bad support for ESM
  require("puppeteer-extra-plugin-stealth") as unknown as typeof import("puppeteer-extra-plugin-stealth");

// Configure plugins once
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

interface PuppeteerSingletonOptions {
  headless: boolean;
}

class PuppeteerSingleton {
  private browser: Browser | null = null;
  private lastUsedAt = 0;
  private lastLaunchedAt = 0;
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private activeRequestsCount = 0;
  private browserLock: Promise<void> = Promise.resolve();

  private readonly INACTIVITY_TIMEOUT_MS = 60 * 1000; // 1 minute
  private readonly MAX_BROWSER_AGE_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get or create browser instance (thread-safe)
   */
  async getBrowser(options: PuppeteerSingletonOptions): Promise<Browser> {
    return await this.withLock(async () => {
      const now = Date.now();

      // Try to reuse existing browser if still valid
      if (this.canReuseBrowser(now) && this.browser !== null) {
        this.activeRequestsCount++;
        this.updateUsageTime(now);
        return this.browser;
      }

      // Launch new browser instance
      await this.launchBrowser(options);
      this.activeRequestsCount++;
      this.updateUsageTime(now);

      if (!this.browser?.connected) {
        throw new Error("Failed to launch browser");
      }

      return this.browser;
    });
  }

  /**
   * Release browser usage (call when done with a request)
   */
  releaseBrowser(): void {
    this.activeRequestsCount = Math.max(0, this.activeRequestsCount - 1);
    this.updateUsageTime(Date.now());
  }

  /**
   * Close browser immediately (for cleanup)
   */
  async closeBrowser(): Promise<void> {
    await this.withLock(async () => {
      this.clearInactivityTimeout();
      this.activeRequestsCount = 0;
      await this.closeBrowserSafely();
    });
  }

  /**
   * Check if existing browser can be reused
   */
  private canReuseBrowser(now: number): boolean {
    if (!this.browser?.connected) {
      return false;
    }

    const age = now - this.lastLaunchedAt;

    // Browser is too old and no active requests - need to relaunch
    if (age >= this.MAX_BROWSER_AGE_MS && this.activeRequestsCount === 0) {
      void this.closeBrowserSafely();
      return false;
    }

    // Browser is still fresh - can reuse
    return age < this.MAX_BROWSER_AGE_MS;
  }

  /**
   * Launch browser instance
   */
  private async launchBrowser(
    options: PuppeteerSingletonOptions,
  ): Promise<void> {
    await this.closeBrowserSafely();

    this.browser = await puppeteer.launch({
      headless: options.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
      ],
    });

    this.lastLaunchedAt = Date.now();

    // Handle browser disconnection
    this.browser.on("disconnected", () => {
      this.browser = null;
      this.clearInactivityTimeout();
    });
  }

  /**
   * Close browser safely (ignore errors)
   */
  private async closeBrowserSafely(): Promise<void> {
    if (this.browser !== null) {
      try {
        await this.browser.close();
      } catch {
        // Ignore errors when closing
      }
      this.browser = null;
    }
  }

  /**
   * Update last used time and reset inactivity timeout
   */
  private updateUsageTime(now: number): void {
    this.lastUsedAt = now;
    this.resetInactivityTimeout();
  }

  /**
   * Reset inactivity timeout
   */
  private resetInactivityTimeout(): void {
    this.clearInactivityTimeout();

    this.inactivityTimeout = setTimeout(() => {
      void this.closeBrowserIfInactive();
    }, this.INACTIVITY_TIMEOUT_MS);
  }

  /**
   * Clear inactivity timeout
   */
  private clearInactivityTimeout(): void {
    if (this.inactivityTimeout !== null) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  /**
   * Close browser if inactive (only if no active requests)
   */
  private async closeBrowserIfInactive(): Promise<void> {
    const now = Date.now();
    const timeSinceLastUse = now - this.lastUsedAt;

    if (
      timeSinceLastUse < this.INACTIVITY_TIMEOUT_MS ||
      this.browser === null ||
      this.activeRequestsCount > 0
    ) {
      return;
    }

    // Double-check with lock to prevent race conditions
    await this.withLock(async () => {
      const finalCheck = Date.now();
      const finalTimeSinceLastUse = finalCheck - this.lastUsedAt;

      if (
        finalTimeSinceLastUse >= this.INACTIVITY_TIMEOUT_MS &&
        this.browser !== null &&
        this.activeRequestsCount === 0
      ) {
        await this.closeBrowserSafely();
        this.clearInactivityTimeout();
      }
    });
  }

  /**
   * Execute function with mutex lock
   */
  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.browserLock;

    let releaseLock: (() => void) | undefined;
    this.browserLock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    try {
      return await fn();
    } finally {
      releaseLock?.();
    }
  }
}

// Export singleton instance
export const puppeteerSingleton = new PuppeteerSingleton();

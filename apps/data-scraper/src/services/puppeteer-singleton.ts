import { createRequire } from "node:module";

import type { Browser } from "puppeteer";

const require = createRequire(import.meta.url);
const puppeteer =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- puppeteer-extra bad support for ESM
  require("puppeteer-extra") as typeof import("puppeteer-extra").default;
const AdblockerPlugin =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- puppeteer-extra bad support for ESM
  require("puppeteer-extra-plugin-adblocker") as typeof import("puppeteer-extra-plugin-adblocker").default;
const StealthPlugin =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- puppeteer-extra bad support for ESM
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
  private readonly INACTIVITY_TIMEOUT_MS = 60 * 1000; // 1 minute
  private readonly MAX_BROWSER_AGE_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get or create browser instance
   */
  async getBrowser(options: PuppeteerSingletonOptions): Promise<Browser> {
    const now = Date.now();
    const timeSinceLastLaunch = now - this.lastLaunchedAt;

    // Check if browser exists and is connected
    if (this.browser?.connected) {
      // If browser has been running for more than 5 minutes, relaunch it
      if (timeSinceLastLaunch >= this.MAX_BROWSER_AGE_MS) {
        // Close existing browser before launching a new one
        try {
          await this.browser.close();
        } catch {
          // Ignore errors when closing
        }
        this.browser = null;
      } else {
        // Browser is still fresh, reuse it
        this.lastUsedAt = now;
        this.resetInactivityTimeout();
        return this.browser;
      }
    }

    // Launch new browser instance
    await this.launchBrowser(options);
    this.lastUsedAt = now;
    this.resetInactivityTimeout();

    if (this.browser === null) {
      throw new Error("Failed to launch browser");
    }

    return this.browser;
  }

  /**
   * Launch browser instance
   */
  private async launchBrowser(
    options: PuppeteerSingletonOptions,
  ): Promise<void> {
    // Close existing browser if any
    if (this.browser !== null) {
      try {
        await this.browser.close();
      } catch {
        // Ignore errors when closing
      }
      this.browser = null;
    }

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
   * Close browser if inactive
   */
  private async closeBrowserIfInactive(): Promise<void> {
    const now = Date.now();
    const timeSinceLastUse = now - this.lastUsedAt;

    // Only close if inactive for more than 1 minute
    if (
      timeSinceLastUse >= this.INACTIVITY_TIMEOUT_MS &&
      this.browser !== null
    ) {
      try {
        await this.browser.close();
        this.browser = null;
        this.clearInactivityTimeout();
      } catch {
        // Ignore errors when closing
        this.browser = null;
      }
    }
  }

  /**
   * Close browser immediately (for cleanup)
   */
  async closeBrowser(): Promise<void> {
    this.clearInactivityTimeout();
    if (this.browser !== null) {
      try {
        await this.browser.close();
      } catch {
        // Ignore errors when closing
      }
      this.browser = null;
    }
  }
}

// Export singleton instance
export const puppeteerSingleton = new PuppeteerSingleton();

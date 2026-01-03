import { logUtils } from "./logging.js";

/**
 * Wait for a specified number of milliseconds
 * Replacement for deprecated page.waitForTimeout()
 */
export function wait(ms: number, reason?: string): Promise<void> {
  if (reason !== undefined) {
    logUtils.log("WAIT", "⏳", `Waiting ${ms}ms: ${reason}`);
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

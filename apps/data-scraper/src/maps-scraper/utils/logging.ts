import { logger } from "@vagabond/shared-utils";
import type { WriteStream } from "fs";

/**
 * Format current date and time for logging
 */
function getDateTime(): string {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Logging utilities for better visibility
 */
export const logUtils = {
  /**
   * Log with prefix and emoji
   */
  log: (prefix: string, emoji: string, message: string): void => {
    logger.info(`${getDateTime()} ${emoji} [${prefix}] ${message}`);
  },

  /**
   * Log success
   */
  success: (prefix: string, emoji: string, message: string): void => {
    logger.info(`${getDateTime()} ${emoji} [${prefix}] ✓ ${message}`);
  },

  /**
   * Log warning
   */
  warn: (prefix: string, emoji: string, message: string): void => {
    logger.info(`${getDateTime()} ${emoji} [${prefix}] ⚠ ${message}`);
  },

  /**
   * Log error
   */
  error: (
    prefix: string,
    emoji: string,
    message: string,
    err?: unknown,
  ): void => {
    if (err !== undefined) {
      logger.error(`${getDateTime()} ${emoji} [${prefix}] ✗ ${message}`, err);
    } else {
      logger.info(`${getDateTime()} ${emoji} [${prefix}] ✗ ${message}`);
    }
  },

  /**
   * Log separator
   */
  separator: (char = "=", length = 60): void => {
    logger.info(`${getDateTime()} ${char.repeat(length)}`);
  },

  /**
   * Log step header
   */
  step: (
    step: string | number,
    total: string | number,
    message: string,
  ): void => {
    logger.info(
      `${getDateTime()} 🚀 [SCRAPE] Step ${step}/${total}: ${message}`,
    );
  },
};

/**
 * Log a message to both console (if within threshold) and log file
 * @param message Message to log
 * @param index Current iteration index
 * @param threshold Threshold for console logging
 * @param logStream File stream for logging
 * @param level Log level (info, warn, error) - defaults to 'info'
 */
export function logWithThreshold(
  message: string,
  index: number,
  threshold: number,
  logStream: WriteStream,
  level: "info" | "warn" | "error" = "info",
): void {
  // Always write to log file
  logStream.write(`${message}\n`);

  // Only write to console if within threshold
  if (index < threshold) {
    if (level === "error") {
      logger.error(message);
    } else if (level === "warn") {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  }
}

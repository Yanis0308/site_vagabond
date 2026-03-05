import { File } from "expo-file-system";

import { UnifiedAnalyticsService } from "@/lib/analytics/UnifiedAnalyticsService";

import { logger } from "./logger";

export const waitForFile = async (
  uri: string,
  maxRetries = 50,
  delayMs = 100,
): Promise<void> => {
  const initialFile = new File(uri);
  if (initialFile.exists && initialFile.size > 0) return;

  const analytics = UnifiedAnalyticsService.getInstance();
  if (analytics.getIsInitialized()) {
    await analytics.logCustomEvent("wait_for_file_missing_on_start", {
      uri,
      maxRetries,
      delayMs,
    });
  }

  for (let i = 0; i < maxRetries; i++) {
    const file = new File(uri);
    logger(`[waitForFile] file exists: ${file.exists}, size: ${file.size}`);
    if (file.exists && file.size > 0) return;
    logger(`[waitForFile] Retry ${i + 1}/${maxRetries} - file not ready:`, uri);
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`File not ready after ${maxRetries} retries: ${uri}`);
};
